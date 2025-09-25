

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { packer_name, shipping_status, user } = body;

  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const updateData: { packer_name?: string; shipping_status?: string } = {};
  let logAction = 'UPDATE';
  let logDetails = `Updated document ID: ${id}.`;

  if (packer_name) {
    updateData.packer_name = packer_name;
    logAction = 'CONFIRM_PACKING';
    logDetails = `Order packed by: ${packer_name}. Doc ID: ${id}`;
  }
  
  if (shipping_status) {
    updateData.shipping_status = shipping_status;
    logAction = `CONFIRM_${shipping_status.toUpperCase()}`;
    logDetails = `Order status updated to ${shipping_status}. Doc ID: ${id}`;
  }
  
  if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('product_out_documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error updating document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    userName: user.name,
    userEmail: user.email,
    action: logAction,
    details: logDetails,
  });

  return NextResponse.json(data);
}
