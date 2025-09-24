

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { packer_name, user } = body;

  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  if (!packer_name) {
    return NextResponse.json({ error: 'Packer name is required.' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('product_out_documents')
    .update({ packer_name })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error updating packer_name:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    userName: user.name,
    userEmail: user.email,
    action: 'CONFIRM_PACKING',
    details: `Order processed by packer: ${packer_name}. Doc ID: ${data.nodocument}`,
  });

  return NextResponse.json(data);
}
