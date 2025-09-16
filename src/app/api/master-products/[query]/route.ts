'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { query: string } }) {
  const { query } = params;

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseService
      .from('master_products')
      .select('sku, barcode, brand')
      .or(`sku.eq.${query},barcode.eq.${query}`)
      .limit(1)
      .single();

    if (error) {
        if (error.code === 'PGRST116') { // "single() row not found"
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching master product by query:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
