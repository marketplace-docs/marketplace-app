

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function GET() {
  // Always select snake_case columns that exist in the table
  const { data, error } = await supabaseService
    .from('putaway_documents')
    .select('id, no_document, date, qty, status, sku, barcode, brand, exp_date, location, check_by')
    .order('date', { ascending: false });

  if (error) {
    console.error("Supabase GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user, documents, ...singleDoc } = body;

  if (user?.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  // Handle bulk upload from CSV
  if (Array.isArray(documents)) {
    const docsToInsert = documents.map(doc => ({
      no_document: doc.no_document,
      date: new Date().toISOString(),
      qty: doc.qty,
      status: doc.status,
      sku: doc.sku,
      barcode: doc.barcode,
      brand: doc.brand,
      exp_date: doc.exp_date,
      location: doc.location,
      check_by: doc.check_by,
    }));

    const { data, error } = await supabaseService
      .from('putaway_documents')
      .insert(docsToInsert)
      .select();

    if (error) {
      console.error("Supabase bulk insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (user && user.name && user.email) {
      await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Bulk uploaded ${documents.length} putaway documents`,
      });
    }
    return NextResponse.json(data, { status: 201 });
  }


  // Handle single document creation
  const { no_document, qty, status, sku, barcode, brand, exp_date, location, check_by } = singleDoc;

  const { data, error } = await supabaseService
    .from('putaway_documents')
    .insert([{ no_document, date: new Date().toISOString(), qty, status, sku, barcode, brand, exp_date, location, check_by }])
    .select()
    .single();

  if (error) {
    console.error("Supabase single insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user && user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Putaway Document: ${no_document}`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
