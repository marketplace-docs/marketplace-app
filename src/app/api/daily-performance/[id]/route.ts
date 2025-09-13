
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { error } = await supabaseService
    .from('daily_performance')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Performance entry deleted successfully' }, { status: 200 });
}
