
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const prefix = `MP-RTN-${year}`;

    const { data, error } = await supabaseService
      .from('return_documents')
      .select('no_document')
      .like('no_document', `${prefix}-%`)
      .order('no_document', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // No rows found is okay
        console.error('Error fetching last return document number:', error);
        throw new Error('Could not fetch last document number.');
    }

    let newSeq = 1;
    if (data) {
      const lastSeq = parseInt(data.no_document.split('-').pop() || '0', 10);
      newSeq = lastSeq + 1;
    }

    const newDocNumber = `${prefix}-${newSeq.toString().padStart(5, '0')}`;
    
    return NextResponse.json({ newDocNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
