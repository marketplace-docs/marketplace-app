
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

// Role-based access control rules
const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  CAPTAIN: 'Captain',
  ADMIN: 'Admin',
  STAFF: 'Staff'
};

const CREATE_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.CAPTAIN, ROLES.ADMIN, ROLES.STAFF];


export async function GET() {
  const { data, error } = await supabaseService
    .from('admin_tasks')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !CREATE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  
  const { name, job, shift, status } = await request.json();

  const { data, error } = await supabaseService
    .from('admin_tasks')
    .insert([{ name, job, shift, status }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'CREATE',
      details: `Admin Task: ${name} (Job: ${job})`,
  });

  return NextResponse.json(data, { status: 201 });
}
