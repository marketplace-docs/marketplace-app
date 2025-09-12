
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  const { data, error } = await supabase
    .from('putaway_documents')
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
    const { noDocument, qty, status, sku, barcode, brand, expDate, checkBy } = body;

    if (!noDocument || !qty || !status || !sku || !barcode || !brand || !expDate || !checkBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('putaway_documents')
      .insert([{ noDocument, qty, status, sku, barcode, brand, expDate, checkBy }])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('API POST Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
