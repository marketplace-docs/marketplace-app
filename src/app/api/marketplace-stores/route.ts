
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  const { data, error } = await supabase
    .from('marketplace_stores')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { marketplace_name, store_name } = body;

    if (!marketplace_name || !store_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('marketplace_stores')
      .insert([{ marketplace_name, store_name }])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST Error:', error);
       if (error.code === '23505') { // Unique constraint violation for store_name
        return NextResponse.json({ error: 'A store with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('API POST Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
