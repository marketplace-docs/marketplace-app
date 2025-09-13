
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
  const { user, documents } = body;

  if (!Array.isArray(documents)) {
    return NextResponse.json({ error: 'Request body must be an array of documents.' }, { status: 400 });
  }

  const docsToInsert = documents.map(doc => ({
    nodocument: doc.nodocument,
    sku: doc.sku,
    barcode: doc.barcode,
    location: doc.location,
    qty: doc.qty,
    status: doc.status,
    date: doc.date,
    validatedby: doc.validatedby,
    expdate: doc.expdate,
  }));

  const { data, error } = await supabaseService
    .from('product_out_documents')
    .insert(docsToInsert)
    .select();

  if (error) {
    console.error('Supabase insert error in product-out-documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user && user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Created ${documents.length} Product Out Document(s)`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
