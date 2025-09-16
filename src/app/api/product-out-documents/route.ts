
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

async function generateNewDocumentNumber(status: ProductOutStatus): Promise<string> {
  const year = new Date().getFullYear();
  let prefix = 'MP-ORD'; // Default prefix
  
  if (status.startsWith('Issue - Order')) {
      prefix = `MP-ORD-${year}`;
  } else if (status.startsWith('Adjustment') || status.startsWith('Adjusment')) { // Handle typo and correct version
      prefix = `MP-ADJ-${year}`;
  } else if (status.startsWith('Issue - Internal Transfer')) {
      prefix = `MP-TRSF-${year}`;
  } else if (status.startsWith('Issue - Return')) {
      prefix = `MP-RTN-${year}`;
  } else if (status.startsWith('Issue - Update Expired') || status.startsWith('Receipt - Update Expired')) {
      prefix = `MP-UPD-EXP-${year}`;
  } else if (status.startsWith('Receipt - Outbound Return')) {
      prefix = `MP-OTR-${year}`;
  } else if (status === 'Receipt') {
      prefix = `MP-RCP-${year}`;
  } else if (status.startsWith('Issue - Putaway') || status.startsWith('Receipt - Putaway')) {
    prefix = `MP-PTW-${year}`;
  } else {
      // Fallback for other statuses
      prefix = `MP-GEN-${year}`;
  }

  const { data, error } = await supabaseService
    .from('product_out_documents')
    .select('nodocument')
    .like('nodocument', `${prefix}-%`)
    .order('nodocument', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching last document number for product_out:", error);
    throw new Error("Could not generate new document number.");
  }

  let newSeq = 1;
  if (data) {
    const lastSeq = parseInt(data.nodocument.split('-').pop() || '0', 10);
    newSeq = lastSeq + 1;
  }
  
  return `${prefix}-${newSeq.toString().padStart(5, '0')}`;
}


export async function GET() {
  const { data, error } = await supabaseService
    .from('product_out_documents')
    .select('*')
    .order('date', { ascending: false })
    .limit(20000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user, documents } = body;

  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  if (!Array.isArray(documents)) {
    return NextResponse.json({ error: 'Request body must be an array of documents.' }, { status: 400 });
  }
  
  // Use Promise.all to generate document numbers in parallel if needed, or sequentially to guarantee order
  const docsToInsert = await Promise.all(documents.map(async (doc) => {
    const newDocNumber = await generateNewDocumentNumber(doc.status);
    return {
        nodocument: newDocNumber,
        sku: doc.sku,
        barcode: doc.barcode,
        location: doc.location,
        qty: doc.qty,
        status: doc.status,
        date: doc.date,
        validatedby: doc.validatedby,
        expdate: doc.expdate,
    };
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

type ProductOutStatus = 
    | 'Issue - Order' 
    | 'Issue - Internal Transfer' 
    | 'Issue - Adjustment Manual'
    | 'Adjustment - Loc'
    | 'Adjustment - SKU'
    | 'Issue - Putaway'
    | 'Receipt - Putaway'
    | 'Issue - Return'
    | 'Issue - Return Putaway'
    | 'Issue - Update Expired'
    | 'Receipt - Update Expired'
    | 'Receipt - Outbound Return'
    | 'Receipt'
    | 'Adjusment - Loc'; // Keep for backwards compatibility if needed
    
