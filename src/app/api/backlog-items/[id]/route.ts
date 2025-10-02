
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];
const DELETE_ROLES = ['Super Admin'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !UPDATE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { id } = params;
  const { store_name, payment_accepted, marketplace } = await request.json();

  const { data, error } = await supabaseService
    .from('backlog_items')
    .update({ store_name, payment_accepted, marketplace })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'UPDATE',
      details: `Backlog Item ID: ${id}`,
  });

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !DELETE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { id } = params;

  const { error } = await supabaseService
    .from('backlog_items')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'DELETE',
      details: `Backlog Item ID: ${id}`,
  });

  return NextResponse.json({ message: 'Backlog item deleted successfully' }, { status: 200 });
}
