

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function GET() {
  const { data, error } = await supabaseService
    .from('inbound_documents')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}


export async function POST(request: Request) {
  const { document, items, user } = await request.json();

  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  
  if (!document || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Invalid document or items data provided.' }, { status: 400 });
  }

  // 1. Insert into inbound_documents table
  const inboundItemsToInsert = items.map((item: any) => ({
    reference: document.reference,
    date: document.date,
    received_by: document.received_by,
    sku: item.sku,
    barcode: item.barcode,
    brand: item.brand,
    exp_date: item.exp_date,
    qty: item.qty,
    main_status: 'Assign' as const
  }));

  const { error: inboundError } = await supabaseService
    .from('inbound_documents')
    .insert(inboundItemsToInsert);

  if (inboundError) {
    console.error('Supabase insert error for inbound docs:', inboundError);
    return NextResponse.json({ error: 'Failed to save inbound document: ' + inboundError.message }, { status: 500 });
  }

  // 2. Create corresponding 'Receipt - Inbound' transactions in product_out_documents
  const transactionItemsToInsert = items.map((item: any) => ({
    nodocument: document.reference,
    date: document.date,
    validatedby: document.received_by,
    sku: item.sku,
    name: item.name,
    barcode: item.barcode,
    expdate: item.exp_date,
    qty: item.qty,
    location: item.location || "Staging Area Inbound", // Use provided location or default
    status: 'Receipt - Inbound' as const
  }));

  const { error: transactionError } = await supabaseService
    .from('product_out_documents')
    .insert(transactionItemsToInsert);

  if (transactionError) {
      console.error('Supabase insert error for product_out_documents:', transactionError);
      // Optional: Add rollback logic for the inbound_documents insert here if needed
      return NextResponse.json({ error: 'Failed to create stock log transaction: ' + transactionError.message }, { status: 500 });
  }


  await logActivity({
    userName: user.name,
    userEmail: user.email,
    action: 'CREATE_INBOUND',
    details: `Created inbound document ${document.reference} with ${items.length} items.`,
  });

  return NextResponse.json({ message: 'Document created successfully' }, { status: 201 });
}
