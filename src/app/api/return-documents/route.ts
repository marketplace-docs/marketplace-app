
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

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
  const user = await getAuthenticatedUser(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { documents, ...singleDoc } = await request.json();

  // Handle bulk upload from CSV
  if (Array.isArray(documents)) {
    const docsToInsert = documents.map(doc => ({
      nodocument: doc.nodocument,
      qty: doc.qty,
      status: doc.status,
      sku: doc.sku,
      barcode: doc.barcode,
      brand: doc.brand,
      location: doc.location,
      reason: doc.reason,
      receivedby: doc.receivedby,
    }));

    const { data, error } = await supabaseService
      .from('return_documents')
      .insert(docsToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Bulk uploaded ${documents.length} return documents`,
      });
    return NextResponse.json(data, { status: 201 });
  }


  // Handle single document creation
  const { nodocument, qty, status, sku, barcode, brand, location, reason, receivedby } = singleDoc;

  const { data, error } = await supabaseService
    .from('return_documents')
    .insert([{ nodocument, qty, status, sku, barcode, brand, location, reason, receivedby }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'CREATE',
      details: `Return Document: ${nodocument}`,
  });

  return NextResponse.json(data, { status: 201 });
}
