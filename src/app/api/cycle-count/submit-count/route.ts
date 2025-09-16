
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

async function generateNewDocumentNumber(prefixBase: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${prefixBase}-${year}`;
  
  const { data, error } = await supabaseService
    .from('product_out_documents')
    .select('nodocument')
    .like('nodocument', `${prefix}-%`)
    .order('nodocument', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching last document number for adjustment:", error);
    throw new Error("Could not generate new document number for adjustment.");
  }

  let newSeq = 1;
  if (data) {
    const lastSeq = parseInt(data.nodocument.split('-').pop() || '0', 10);
    newSeq = lastSeq + 1;
  }
  
  return `${prefix}-${newSeq.toString().padStart(5, '0')}`;
}


export async function POST(request: Request) {
  try {
    const { adjustments, user } = await request.json();

    if (!user || !user.role) {
      return NextResponse.json({ error: 'Forbidden: User authentication is required.' }, { status: 403 });
    }

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json({ error: 'No adjustments provided.' }, { status: 400 });
    }

    const docsToInsert = await Promise.all(adjustments.map(async (adj: any) => {
        const qtyChange = adj.variance;
        
        let status: 'Issue - Adjustment Manual' | 'Receipt';
        let prefix: string;

        if (qtyChange < 0) {
            status = 'Issue - Adjustment Manual';
            prefix = 'MP-ADJ';
        } else {
            status = 'Receipt'; // Assuming positive variance is a stock 'receipt'
            prefix = 'MP-RCP';
        }

        const newDocNumber = await generateNewDocumentNumber(prefix);
        
        return {
            nodocument: newDocNumber,
            sku: adj.sku,
            barcode: adj.barcode,
            expdate: adj.exp_date,
            location: adj.location,
            qty: Math.abs(qtyChange), // Quantity is always positive
            status: status,
            date: new Date().toISOString(),
            validatedby: user.name,
        };
    }));

    const { data, error } = await supabaseService
      .from('product_out_documents')
      .insert(docsToInsert)
      .select();

    if (error) {
      console.error('Supabase error creating adjustment documents:', error);
      throw new Error('Failed to create adjustment documents in database.');
    }

    // Log this important activity
    await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'CYCLE_COUNT_ADJUSTMENT',
      details: `Created ${adjustments.length} adjustment document(s) from CC Location for location: ${adjustments[0].location}`,
    });

    return NextResponse.json({ message: 'Adjustments submitted successfully', data }, { status: 201 });

  } catch (error: any) {
    console.error("Error in submit-count API:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
