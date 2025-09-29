

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

  const itemsToInsert = items.map((item: any) => ({
    reference: document.reference,
    date: document.date,
    received_by: document.received_by,
    sku: item.sku,
    barcode: item.barcode,
    brand: item.brand,
    exp_date: item.exp_date,
    qty: item.qty,
    main_status: 'Assign' // Default status
  }));


  const { data, error } = await supabaseService
    .from('inbound_documents')
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error('Supabase insert error for inbound docs:', error);
    return NextResponse.json({ error: 'Failed to save inbound document: ' + error.message }, { status: 500 });
  }

  await logActivity({
    userName: user.name,
    userEmail: user.email,
    action: 'CREATE_INBOUND',
    details: `Created inbound document ${document.reference} with ${items.length} items.`,
  });

  return NextResponse.json({ message: 'Document created successfully', data }, { status: 201 });
}
