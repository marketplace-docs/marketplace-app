
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const prefix = `MP-RTN-${year}`;

    const { data, error } = await supabaseService
      .from('return_documents')
      .select('nodocument')
      .like('nodocument', `${prefix}-%`)
      .order('nodocument', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last return document number:', error);
      throw new Error('Could not fetch last document number.');
    }

    let newSeq = 1;
    if (data && data.nodocument) {
      const lastSeqStr = data.nodocument.split('-').pop();
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
    console.error("Error in generate-number API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
