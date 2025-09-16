'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const prefix = `MP-CC-${year}`;

    const { data, error } = await supabaseService
      .from('cycle_count_docs')
      .select('no_doc')
      .like('no_doc', `${prefix}-%`)
      .order('no_doc', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last cycle count document number:', error);
      throw new Error('Could not fetch last document number from database.');
    }

    let newSeq = 1;
    if (data && data.no_doc) {
      const lastSeqStr = data.no_doc.split('-').pop();
      if (lastSeqStr) {
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
          newSeq = lastSeq + 1;
        }
      }
    }

    const newDocNumber = `${prefix}-${newSeq.toString().padStart(5, '0')}`;
    
    return NextResponse.json({ newDocNumber });
  } catch (error: any) {
    console.error("Error in generate-number API for cycle count:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
