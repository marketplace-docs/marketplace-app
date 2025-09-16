
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin'];

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
  const body = await request.json();
  const { user, documents, ...singleDoc } = body;

  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  // Handle bulk upload from CSV
  if (Array.isArray(documents)) {
    const docsToInsert = documents.map(doc => ({
      nodocument: doc.nodocument,
      qty: doc.qty,
      status: doc.status,
      sku: doc.sku,
      barcode: doc.barcode,
      brand: doc.brand,
      reason: doc.reason,
      received_by: doc.received_by,
    }));

    const { data, error } = await supabaseService
      .from('return_documents')
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
        details: `Bulk uploaded ${documents.length} return documents`,
      });
    }
    return NextResponse.json(data, { status: 201 });
  }


  // Handle single document creation
  const { no_document, qty, status, sku, barcode, brand, reason, received_by } = singleDoc;

  const { data, error } = await supabaseService
    .from('return_documents')
    .insert([{ nodocument: no_document, qty, status, sku, barcode, brand, reason, received_by }])
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
        details: `Return Document: ${no_document}`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
