
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    // Using consistent prefix as seen in other modules like product-out
    const prefix = `MP-RTN-${year}`;

    const { data, error } = await supabaseService
      .from('return_documents')
      .select('no_document')
      .like('no_document', `${prefix}-%`)
      .order('no_document', { ascending: false })
      .limit(1)
      .single();

    // This logic handles the case where no document exists for the year yet
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found", which is a valid case
        console.error('Error fetching last return document number:', error);
        throw new Error('Could not fetch last document number.');
    }

    let newSeq = 1;
    if (data && data.no_document) {
      // Correctly parse the last sequence number, e.g., from "MP-RTN-2024-00001"
      const lastSeqStr = data.no_document.split('-').pop();
      if (lastSeqStr) {
        const lastSeq = parseInt(lastSeqStr, 10);
        // Ensure parsing was successful before incrementing
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
