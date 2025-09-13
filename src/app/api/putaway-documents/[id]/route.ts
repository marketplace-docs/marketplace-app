
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { noDocument, qty, status, sku, barcode, brand, expDate, checkBy, userName, userEmail } = body;

  const { data, error } = await supabaseService
    .from('putaway_documents')
    .update({ noDocument, qty, status, sku, barcode, brand, expDate, checkBy })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (userName && userEmail) {
    await logActivity({
        userName,
        userEmail,
        action: 'UPDATE',
        details: `Putaway Document ID: ${id}`,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = {
      name: request.headers.get('X-User-Name'),
      email: request.headers.get('X-User-Email')
  };

  const { error } = await supabaseService
    .from('putaway_documents')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'DELETE',
        details: `Putaway Document ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
}
