
import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { noDocument, qty, status, sku, barcode, brand, reason, receivedBy } = await request.json();

  const { data, error } = await supabase
    .from('return_documents')
    .update({ noDocument, qty, status, sku, barcode, brand, reason, receivedBy })
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

  const { error } = await supabase
    .from('return_documents')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
}
