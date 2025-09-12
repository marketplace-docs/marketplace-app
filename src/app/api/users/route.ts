
import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { name, email, role, status } = await request.json();

  if (!name || !email || !role || !status) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, role, status }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

    