
import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('marketplace_stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { marketplace_name, store_name, platform } = await request.json();

  const { data, error } = await supabase
    .from('marketplace_stores')
    .insert([{ marketplace_name, store_name, platform }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
