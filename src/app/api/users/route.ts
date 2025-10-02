
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const ADD_USER_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function GET() {
  const { data, error } = await supabaseService
    .from('users')
    .select('id, name, email, role, status')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !ADD_USER_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { name, email, role, status } = await request.json();

  if (!name || !email || !role || !status) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  
  // Only Super Admin can create other admins
  if (role !== 'Staff' && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: You can only create Staff users.' }, { status: 403 });
  }


  const { data, error } = await supabaseService
    .from('users')
    .insert([{ name, email, role, status }])
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
      action: 'CREATE',
      details: `User: ${email} (Role: ${role})`,
  });

  return NextResponse.json(data, { status: 201 });
}
