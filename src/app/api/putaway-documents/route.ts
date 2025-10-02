
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

// This is no longer the main endpoint for creating putaway transactions, 
// as that logic is now handled by the two-step process in Go-Putaway page 
// which calls the /api/product-out-documents endpoint.

// This endpoint is kept for historical data retrieval and potential manual adjustments by Super Admins.

const ALLOWED_ROLES = ['Super Admin'];

export async function GET() {
  // Always select snake_case columns that exist in the table
  const { data, error } = await supabaseService
    .from('putaway_documents')
    .select('id, no_document, date, qty, status, sku, barcode, brand, exp_date, location, check_by')
    .order('date', { ascending: false })
    .limit(20000);

  if (error) {
    console.error("Supabase GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST is now primarily for manual overrides or legacy support.
export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { documents, ...singleDoc } = await request.json();

  // Handle bulk upload from CSV - maintained for admin purposes
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

    await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'CREATE',
      details: `Bulk uploaded ${documents.length} putaway documents`,
    });
    return NextResponse.json(data, { status: 201 });
  }


  // Handle single document creation - maintained for admin purposes
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

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'CREATE',
      details: `Putaway Document: ${no_document}`,
  });

  return NextResponse.json(data, { status: 201 });
}
