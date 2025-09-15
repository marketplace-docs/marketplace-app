
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

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
  const body = await request.json();
  const { name, email, role, status, userName, userEmail, userRole } = body;

  if (userRole !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const user = { name: userName, email: userEmail };

  if (!name || !email || !role || !status) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('users')
    .insert([{ name, email, role, status }])
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
          details: `User: ${email} (Role: ${role})`,
      });
  }

  return NextResponse.json(data, { status: 201 });
}
