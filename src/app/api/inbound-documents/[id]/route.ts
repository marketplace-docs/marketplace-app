
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { id } = params;
  const { main_status } = await request.json();
  
  if (!main_status) {
      return NextResponse.json({ error: 'main_status is required.' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('inbound_documents')
    .update({ main_status: main_status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase PATCH error on inbound doc:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    userName: user.name,
    userEmail: user.email,
    action: 'UPDATE_INBOUND_STATUS',
    details: `Inbound Document ID: ${id} status changed to ${main_status}`,
  });

  return NextResponse.json(data);
}
