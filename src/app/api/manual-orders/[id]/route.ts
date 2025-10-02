

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const body = await request.json();
    const { user, ...fieldsToUpdate } = body;


    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return NextResponse.json({ error: 'No fields to update provided.' }, { status: 400 });
    }
    
    // Ensure `qty` is a number if it exists
    if (fieldsToUpdate.qty !== undefined) {
      fieldsToUpdate.qty = parseInt(fieldsToUpdate.qty, 10);
      if (isNaN(fieldsToUpdate.qty)) {
        delete fieldsToUpdate.qty; // Don't update if it's not a valid number
      }
    }


    // Find the order to get its reference for logging
    const { data: orderData, error: findError } = await supabaseService
        .from('manual_orders')
        .select('reference, status')
        .eq('id', id)
        .single();
    
    if (findError) {
        console.error("Error finding order to update:", findError);
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

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

    let details = `Updated order ${orderData.reference} (ID: ${id}).`;
    if (fieldsToUpdate.status && fieldsToUpdate.status !== orderData.status) {
        details = `Updated order ID ${id} status: ${orderData.status} -> ${fieldsToUpdate.status}.`;
        if (fieldsToUpdate.status === 'Out of Stock') {
            details = `Order ${orderData.reference} marked as Out of Stock during picking.`;
        } else if (fieldsToUpdate.status === 'Payment Accepted') {
            details = `Order ${orderData.reference} sent back to packing queue from OOS.`;
            if (fieldsToUpdate.location) {
                details += ` New location assigned: ${fieldsToUpdate.location}`;
            }
        }
    }


    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE_MANUAL_ORDER',
        details: details,
    });

    return NextResponse.json(data);
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = { 
      name: request.headers.get('X-User-Name'), 
      email: request.headers.get('X-User-Email'),
      role: request.headers.get('X-User-Role')
  };

  if (!user.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { error } = await supabaseService
    .from('manual_orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting manual order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'DELETE_OOS_ORDER',
        details: `Removed Out of Stock manual order ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
}
