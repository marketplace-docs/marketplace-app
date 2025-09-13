
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

  const { noDocument, sku, barcode, expDate, location, qty, status, date, validatedBy } = docData;

  const { data, error } = await supabaseService
    .from('product_out_documents')
    .insert([{ "noDocument": noDocument, sku, barcode, "expDate": expDate, location, qty, status, date, "validatedBy": validatedBy }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user && user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Product Out Document: ${docData.noDocument}`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
