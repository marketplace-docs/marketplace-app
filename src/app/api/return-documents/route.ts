
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabaseService
    .from('return_documents')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { noDocument, qty, status, sku, barcode, brand, reason, receivedBy } = await request.json();

  const { data, error } = await supabaseService
    .from('return_documents')
    .insert([{ noDocument, qty, status, sku, barcode, brand, reason, receivedBy }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
