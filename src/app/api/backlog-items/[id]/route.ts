
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { store_name, payment_accepted, marketplace } = await request.json();

  const { data, error } = await supabaseService
    .from('backlog_items')
    .update({ store_name, payment_accepted, marketplace })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { error } = await supabaseService
    .from('backlog_items')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Backlog item deleted successfully' }, { status: 200 });
}
