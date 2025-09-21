
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];
const DELETE_ROLES = ['Super Admin'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { marketplace_name, store_name, platform, userName, userEmail, userRole } = body;

  if (!userRole || !UPDATE_ROLES.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { data, error } = await supabaseService
    .from('marketplace_stores')
    .update({ marketplace_name, store_name, platform })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (userName && userEmail) {
    await logActivity({
        userName,
        userEmail,
        action: 'UPDATE',
        details: `Marketplace Store ID: ${id}`,
    });
  }

  return NextResponse.json(data);
}

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
    .from('marketplace_stores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'DELETE',
        details: `Marketplace Store ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Store deleted successfully' }, { status: 200 });
}
