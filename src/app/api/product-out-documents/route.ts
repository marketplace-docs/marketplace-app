'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function GET() {
  const { data, error } = await supabaseService
    .from('product_out_documents')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user, ...docData } = body;

  const { no_document, sku, barcode, location, qty, status, date, validated_by, exp_date } = docData;

  const { data, error } = await supabaseService
    .from('product_out_documents')
    .insert([{ no_document, sku, barcode, location, qty, status, date, validated_by, exp_date }])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error in product-out-documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user && user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Product Out Document: ${docData.no_document}`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
