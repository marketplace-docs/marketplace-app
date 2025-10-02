
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

// GET details of a specific wave (including its orders)
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const { data: waveData, error: waveError } = await supabaseService
            .from('waves')
            .select('*')
            .eq('id', id)
            .single();
        
        if (waveError) throw new Error('Wave not found.');

        const { data: ordersData, error: ordersError } = await supabaseService
            .from('wave_orders')
            .select('*')
            .eq('wave_id', id);

        if (ordersError) throw new Error('Could not fetch orders for the wave.');
        
        return NextResponse.json({ ...waveData, orders: ordersData });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


async function generateNewDocumentNumberForReturn(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MP-OTR-${year}`; // Outbound Transaction Return

    const { data, error } = await supabaseService
        .from('product_out_documents')
        .select('nodocument')
        .like('nodocument', `${prefix}-%`)
        .order('nodocument', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching last document number for outbound return:", error);
        throw new Error("Could not generate new document number for return.");
    }

    let newSeq = 1;
    if (data) {
        const lastSeq = parseInt(data.nodocument.split('-').pop() || '0', 10);
        newSeq = lastSeq + 1;
    }
    
    return `${prefix}-${newSeq.toString().padStart(5, '0')}`;
}

// DELETE a wave (now with rollback logic)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const user = await getAuthenticatedUser(request);
    if (!user || !['Super Admin', 'Manager', 'Supervisor'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }
    
    const { id } = params;

    try {
        // 1. Get all orders in the wave, including the extra data
        const { data: waveOrders, error: waveOrdersError } = await supabaseService
            .from('wave_orders')
            .select('*')
            .eq('wave_id', id);

        if (waveOrdersError) {
            console.error('Error fetching orders in wave for cancellation:', waveOrdersError);
            throw new Error('Could not retrieve orders to cancel.');
        }

        if (waveOrders.length > 0) {
            // 2. Re-insert orders back into manual_orders with complete data, INCLUDING THE ORIGINAL ID
            const ordersToReinsert = waveOrders.map(wo => ({
                id: wo.order_id, 
                reference: wo.order_reference,
                sku: wo.sku,
                qty: wo.qty,
                status: 'Payment Accepted', // Reset status
                customer: wo.customer,
                city: wo.city,
                order_date: wo.order_date,
                type: wo.type,
                from: wo.from,
                delivery_type: wo.delivery_type,
            }));

            const { error: reinsertError } = await supabaseService
                .from('manual_orders')
                .upsert(ordersToReinsert, { onConflict: 'id' });

            if (reinsertError) {
                console.error('Error re-inserting cancelled orders into manual_orders:', reinsertError);
                throw new Error('Failed to return orders to the manual queue.');
            }

            // 3. Create reversal stock transactions (if any stock was issued)
            const orderReferences = waveOrders.map(wo => wo.order_reference);
            const { data: issueDocs, error: issueDocsError } = await supabaseService
                .from('product_out_documents')
                .select('*')
                .in('order_reference', orderReferences)
                .eq('status', 'Issue - Order');

            if (issueDocsError) {
                 console.error('Could not find original issue documents to reverse stock:', issueDocsError);
                 // Continue with cancellation but log this critical error
            }

            if (issueDocs && issueDocs.length > 0) {
                const returnDocsToInsert = await Promise.all(issueDocs.map(async (doc) => {
                    const newDocNumber = await generateNewDocumentNumberForReturn();
                    return {
                        nodocument: newDocNumber,
                        sku: doc.sku,
                        barcode: doc.barcode,
                        expdate: doc.expdate,
                        location: doc.location,
                        qty: doc.qty,
                        status: 'Receipt - Outbound Return' as const,
                        date: new Date().toISOString(),
                        validatedby: user.name,
                        order_reference: doc.order_reference,
                    };
                }));

                const { error: returnDocsError } = await supabaseService
                    .from('product_out_documents')
                    .insert(returnDocsToInsert);

                if (returnDocsError) {
                    console.error('Failed to create stock reversal documents:', returnDocsError);
                    // This is critical, log it but proceed with deletion to avoid user being stuck
                }
            }
        }
        
        // 4. Delete the wave itself (CASCADE will delete wave_orders)
        const { error: deleteWaveError } = await supabaseService
            .from('waves')
            .delete()
            .eq('id', id);

        if (deleteWaveError) {
            console.error('Error deleting wave after rollback:', deleteWaveError);
            throw new Error(deleteWaveError.message);
        }

        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'CANCEL_WAVE',
            details: `Cancelled wave ID: ${id}. Returned ${waveOrders.length} orders to queue and reversed stock.`,
        });
        
        return NextResponse.json({ message: 'Wave cancelled successfully. Orders and stock have been rolled back.' }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { id } = params;
  const { action, status, orderId } = await request.json();

  // Handle marking an order as Out of Stock
  if (action === 'mark_oos') {
    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required to mark as Out of Stock.' }, { status: 400 });
    }

    // 1. Get the order details from wave_orders
    const { data: waveOrder, error: findError } = await supabaseService
        .from('wave_orders')
        .select('*')
        .eq('order_reference', orderId)
        .eq('wave_id', id)
        .single();
    
    if (findError || !waveOrder) {
        return NextResponse.json({ error: 'Order not found in this wave.' }, { status: 404 });
    }
    
    // 2. Re-insert the order into manual_orders with OOS status
    const { error: insertError } = await supabaseService
        .from('manual_orders')
        .upsert({
            id: waveOrder.order_id, 
            reference: waveOrder.order_reference,
            sku: waveOrder.sku,
            qty: waveOrder.qty,
            customer: waveOrder.customer,
            city: waveOrder.city,
            order_date: waveOrder.order_date,
            type: waveOrder.type,
            from: waveOrder.from,
            delivery_type: waveOrder.delivery_type,
            status: 'Out of Stock'
        }, { onConflict: 'id' });

    if (insertError) {
        console.error('Error re-inserting OOS order into manual_orders:', insertError);
        return NextResponse.json({ error: 'Failed to move order to OOS list.' }, { status: 500 });
    }
    
    // 3. Delete the order from wave_orders
    const { error: deleteError } = await supabaseService
        .from('wave_orders')
        .delete()
        .eq('id', waveOrder.id);
    
    if (deleteError) {
        console.error('CRITICAL: Failed to delete order from wave after marking OOS. Manual cleanup needed.', deleteError);
    }
    
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'MARK_OOS_PICKING',
        details: `Order ${waveOrder.order_reference} marked as OOS during picking from wave ID ${id}.`,
    });
    
    return NextResponse.json({ message: 'Order marked as Out of Stock.' });
  }

  // Handle removing a single order from a wave
  if (action === 'remove_order') {
    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required to remove from wave.' }, { status: 400 });
    }
    
    // Find the order to be removed
    const { data: waveOrder, error: findError } = await supabaseService
        .from('wave_orders')
        .select('*')
        .eq('order_reference', orderId)
        .eq('wave_id', id)
        .single();
    
    if (findError || !waveOrder) {
        return NextResponse.json({ error: 'Order not found in this wave.' }, { status: 404 });
    }

    // Return it to manual_orders with 'Payment Accepted' status
    const { error: insertError } = await supabaseService
        .from('manual_orders')
        .upsert({
            id: waveOrder.order_id, 
            reference: waveOrder.order_reference,
            sku: waveOrder.sku,
            qty: waveOrder.qty,
            customer: waveOrder.customer,
            city: waveOrder.city,
            order_date: waveOrder.order_date,
            type: waveOrder.type,
            from: waveOrder.from,
            delivery_type: waveOrder.delivery_type,
            status: 'Payment Accepted'
        }, { onConflict: 'id' });

    if (insertError) {
        return NextResponse.json({ error: 'Failed to return order to manual queue.' }, { status: 500 });
    }

    // Delete from wave_orders
    const { error: deleteError } = await supabaseService.from('wave_orders').delete().eq('id', waveOrder.id);
    if (deleteError) {
      // This is a problem, but the order is already back in the queue, so we should log it and proceed.
      console.error(`CRITICAL: Failed to delete order ${waveOrder.id} from wave_orders table.`);
    }

    // Decrement total_orders count in the wave
    const { data: waveData, error: waveFetchError } = await supabaseService.from('waves').select('total_orders').eq('id', id).single();
    if(waveFetchError || !waveData) {
        console.error(`Failed to fetch wave ${id} to decrement order count.`);
    } else {
        const { error: waveUpdateError } = await supabaseService
            .from('waves')
            .update({ total_orders: waveData.total_orders - 1 })
            .eq('id', id);
        if (waveUpdateError) {
             console.error(`Failed to decrement order count for wave ${id}.`);
        }
    }


    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'REMOVE_ORDER_FROM_WAVE',
        details: `Order ${waveOrder.order_reference} removed from wave ID ${id} and returned to queue.`,
    });

    return NextResponse.json({ message: 'Order removed from wave and returned to the queue.' });

  }

  // Handle normal status updates
  if (action === 'update_status') {
     const { data, error } = await supabaseService
        .from('waves')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (user.name && user.email) {
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'UPDATE_WAVE_STATUS',
            details: `Wave ID: ${id} status changed to ${status}`,
        });
    }
     return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
}
