
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';
import type { User } from '@/types/user';

const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const user = await getAuthenticatedUser(request);
    const { id } = params;

    // A user can fetch their own data, or a super admin can fetch anyone's
    if (!user || (user.id.toString() !== id && user.role !== 'Super Admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { data, error } = await supabaseService
        .from('users')
        .select('id, name, email, role, status')
        .eq('id', id)
        .single();
    
    if (error) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !UPDATE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const { name, email, role, status } = body;

  // Only Super Admin can change a user's role
  if (role && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: Only Super Admins can change roles.' }, { status: 403 });
  }
  
  const dataToUpdate: Partial<User> = { name, email, status };
  if (user.role === 'Super Admin') {
      dataToUpdate.role = role;
  }

  const { data, error } = await supabaseService
    .from('users')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique constraint violation
        return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'UPDATE',
      details: `User ID: ${id} (${email})`,
  });

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  
  const { id } = params;

  const { error } = await supabaseService
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'DELETE',
      details: `User ID: ${id}`,
  });

  return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
}
