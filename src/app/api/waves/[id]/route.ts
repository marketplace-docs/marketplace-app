
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';


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


// DELETE a wave
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const user = {
        name: request.headers.get('X-User-Name'),
        email: request.headers.get('X-User-Email'),
        role: request.headers.get('X-User-Role'),
    };

    // Add role-based access control if necessary
    if (!user?.role || !['Super Admin', 'Manager', 'Supervisor'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    try {
        // The database is set up with ON DELETE CASCADE, so deleting the wave
        // will automatically delete the associated wave_orders.
        const { error } = await supabaseService
            .from('waves')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting wave:', error);
            throw new Error(error.message);
        }

        if (user.name && user.email) {
            await logActivity({
                userName: user.name,
                userEmail: user.email,
                action: 'CANCEL_WAVE',
                details: `Cancelled wave ID: ${id}`,
            });
        }
        
        return NextResponse.json({ message: 'Wave cancelled successfully.' }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { action, status, user, orderId } = body;

  if (!user?.role) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  // Handle marking an order as Out of Stock
  if (action === 'mark_oos') {
    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required to mark as Out of Stock.' }, { status: 400 });
    }

    // 1. Get the order details from wave_orders
    const { data: waveOrder, error: findError } = await supabaseService
        .from('wave_orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('wave_id', id)
        .single();
    
    if (findError || !waveOrder) {
        return NextResponse.json({ error: 'Order not found in this wave.' }, { status: 404 });
    }
    
    // 2. Re-insert the order into manual_orders with OOS status
    const { error: insertError } = await supabaseService
        .from('manual_orders')
        .insert({
            id: waveOrder.order_id,
            reference: waveOrder.order_reference,
            sku: waveOrder.sku,
            qty: waveOrder.qty,
            customer: waveOrder.customer,
            city: waveOrder.city,
            // Add defaults for other fields
            order_date: new Date().toISOString(),
            type: 'N/A',
            from: 'N/A',
            delivery_type: 'N/A',
            status: 'Out of Stock' // The important part
        });

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
        // This is not ideal, as we've already re-inserted it. Log and alert.
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
