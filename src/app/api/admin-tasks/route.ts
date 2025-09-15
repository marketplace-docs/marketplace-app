
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

const CREATE_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.CAPTAIN, ROLES.ADMIN];


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
  const body = await request.json();
  const { name, job, shift, status, userName, userEmail, userRole } = body;
  
  if (!userRole || !CREATE_ROLES.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const user = { name: userName, email: userEmail }; // Assuming user info is passed in body

  const { data, error } = await supabaseService
    .from('admin_tasks')
    .insert([{ name, job, shift, status }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Admin Task: ${name} (Job: ${job})`,
    });
  }


  return NextResponse.json(data, { status: 201 });
}
