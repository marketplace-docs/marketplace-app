
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const prefix = `DOC-INB-${year}`;

    const { data, error } = await supabaseService
      .from('inbound_documents')
      .select('reference')
      .like('reference', `${prefix}-%`)
      .order('reference', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last inbound document number:', error);
      throw new Error('Could not fetch last document number from database.');
    }

    let newSeq = 1;
    if (data && data.reference) {
      const lastSeqStr = data.reference.split('-').pop();
      if (lastSeqStr) {
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
          newSeq = lastSeq + 1;
        }
      }
    }

    const newDocNumber = `${prefix}-${newSeq.toString().padStart(6, '0')}`;
    
    return NextResponse.json({ newDocNumber });
  } catch (error: any) {
    console.error("Error in generate-number API for inbound:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
