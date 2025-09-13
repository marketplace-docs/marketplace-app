
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function GET() {
  const { data, error } = await supabaseService
    .from('putaway_documents')
    .select('id, noDocument, date, qty, status, sku, barcode, brand, expDate, location, checkBy, created_at')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Map snake_case to camelCase
  const mappedData = data.map(item => ({
    id: item.id,
    noDocument: item.noDocument,
    date: item.date,
    qty: item.qty,
    status: item.status,
    sku: item.sku,
    barcode: item.barcode,
    brand: item.brand,
    expDate: item.expDate,
    location: item.location,
    checkBy: item.checkBy,
    created_at: item.created_at
  }));

  return NextResponse.json(mappedData);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user, documents, ...singleDoc } = body;

  // Handle bulk upload from CSV
  if (Array.isArray(documents)) {
    const docsToInsert = documents.map(doc => ({
      noDocument: doc.noDocument,
      date: new Date().toISOString(),
      qty: doc.qty,
      status: doc.status,
      sku: doc.sku,
      barcode: doc.barcode,
      brand: doc.brand,
      expDate: doc.expDate,
      location: doc.location,
      checkBy: doc.checkBy,
    }));

    const { data, error } = await supabaseService
      .from('putaway_documents')
      .insert(docsToInsert)
      .select();

    if (error) {
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
  const { noDocument, qty, status, sku, barcode, brand, expDate, location, checkBy } = singleDoc;

  const { data, error } = await supabaseService
    .from('putaway_documents')
    .insert([{ noDocument, qty, status, sku, barcode, brand, expDate, location, checkBy }])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user && user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Putaway Document: ${noDocument}`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
