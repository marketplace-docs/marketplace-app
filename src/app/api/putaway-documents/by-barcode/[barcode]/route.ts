
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

// This endpoint is now OBSOLETE as the logic has moved to /api/master-product/batch-products/[barcode]
// It is kept for now to avoid breaking changes if it's being called elsewhere, but should be removed in the future.
export async function GET(request: Request, { params }: { params: { barcode: string } }) {
  const { barcode } = params;

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseService
      .from('putaway_documents')
      .select('*')
      .eq('barcode', barcode)
      .order('date', { ascending: false }) // Get the most recent entry for this barcode
      .limit(1)
      .single();

    if (error) {
        if (error.code === 'PGRST116') { // PostgREST error for "single() row not found"
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching putaway document by barcode:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
