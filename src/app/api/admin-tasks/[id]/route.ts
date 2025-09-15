
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

// Role-based access control rules
const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  CAPTAIN: 'Captain',
  ADMIN: 'Admin'
};

const UPDATE_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.CAPTAIN, ROLES.ADMIN];
const DELETE_ROLES = [ROLES.SUPER_ADMIN];


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { name, job, shift, status, userName, userEmail, userRole } = body;
  
  if (!userRole || !UPDATE_ROLES.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const user = { name: userName, email: userEmail };

  const { data, error } = await supabaseService
    .from('admin_tasks')
    .update({ name, job, shift, status })
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
        action: 'UPDATE',
        details: `Admin Task ID: ${id}`,
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
    .from('admin_tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'DELETE',
        details: `Admin Task ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
}
