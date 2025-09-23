
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const DELETE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = { 
      name: request.headers.get('X-User-Name'), 
      email: request.headers.get('X-User-Email'),
      role: request.headers.get('X-User-Role')
  };

  if (!user.role || !DELETE_ROLES.includes(user.role)) {
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
        details: `Deleted Out of Stock manual order ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
}
