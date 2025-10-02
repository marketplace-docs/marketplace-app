
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const user = await getAuthenticatedUser(request);
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, selectedBatch, qty, ...fieldsToUpdate } = body;

    if (action === 'send_to_packing_from_oos') {
        try {
            // 1. Create the 'Issue - Order' document
            const issueDocPayload = {
                nodocument: fieldsToUpdate.reference, // Use order reference as doc number
                sku: selectedBatch.sku,
                barcode: selectedBatch.barcode,
                expdate: selectedBatch.exp_date,
                location: selectedBatch.location,
                qty,
                status: 'Issue - Order' as const,
                date: new Date().toISOString(),
                validatedby: user.name,
                order_reference: fieldsToUpdate.reference,
            };

            const { error: issueError } = await supabaseService
                .from('product_out_documents')
                .insert(issueDocPayload);

            if (issueError) {
                console.error("Error creating issue document from OOS:", issueError);
                throw new Error('Failed to create stock issue document.');
            }
            
            // 2. Delete the order from manual_orders table
            const { error: deleteError } = await supabaseService
                .from('manual_orders')
                .delete()
                .eq('id', id);

            if (deleteError) {
                // This is a critical state. The stock has been issued, but the OOS order still exists.
                // Log this for manual intervention.
                console.error(`CRITICAL: Stock issued for order ${fieldsToUpdate.reference} from OOS, but failed to delete from manual_orders. Error: ${deleteError.message}`);
            }

            await logActivity({
                userName: user.name,
                userEmail: user.email,
                action: 'PROCESS_OOS_ORDER',
                details: `Processed OOS order ${fieldsToUpdate.reference} with ${qty} item(s) from location ${selectedBatch.location}. Ready for packing.`,
            });
            
            return NextResponse.json({ message: 'Order sent to packing.' });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }


    if (Object.keys(fieldsToUpdate).length === 0) {
        return NextResponse.json({ error: 'No fields to update provided.' }, { status: 400 });
    }
    
    // Original logic for simple updates
    const { data, error } = await supabaseService
        .from('manual_orders')
        .update(fieldsToUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating manual order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE_MANUAL_ORDER',
        details: `Updated OOS order ${data.reference} status back to Payment Accepted.`,
    });

    return NextResponse.json(data);
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { id } = params;

  // Find the order to get its reference for logging before deleting
  const { data: orderToDelete, error: findError } = await supabaseService
    .from('manual_orders')
    .select('reference')
    .eq('id', id)
    .single();

  if (findError || !orderToDelete) {
      console.error("Could not find order to delete for logging, but proceeding with deletion.");
  }


  const { error } = await supabaseService
    .from('manual_orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting manual order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'DELETE_OOS_ORDER',
      details: `Removed Out of Stock manual order: ${orderToDelete?.reference || `ID: ${id}`}`,
  });

  return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
}
