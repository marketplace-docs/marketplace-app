
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const { status, user } = await request.json();

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!status) {
        return NextResponse.json({ error: 'Status is required for update.' }, { status: 400 });
    }

    // Find the order to get its reference for logging
    const { data: orderData, error: findError } = await supabaseService
        .from('manual_orders')
        .select('reference')
        .eq('id', id)
        .single();
    
    if (findError) {
        console.error("Error finding order to update:", findError);
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const { data, error } = await supabaseService
        .from('manual_orders')
        .update({ status: status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating manual order status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let details = `Updated order ID ${id} to status: ${status}.`;
    if (status === 'Out of Stock') {
        details = `Order ${orderData.reference} marked as Out of Stock during picking.`;
    } else if (status === 'Payment Accepted') {
        details = `Order ${orderData.reference} sent back to packing queue from OOS.`;
    }

    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE_ORDER_STATUS',
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
