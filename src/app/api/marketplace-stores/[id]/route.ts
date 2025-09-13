
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { marketplace_name, store_name, platform } = await request.json();

  const { data, error } = await supabaseService
    .from('marketplace_stores')
    .update({ marketplace_name, store_name, platform })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { error } = await supabaseService
    .from('marketplace_stores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Store deleted successfully' }, { status: 200 });
}
