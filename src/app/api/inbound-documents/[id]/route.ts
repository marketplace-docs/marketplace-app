
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { main_status, user } = body;

  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  
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

  if (user.name && user.email) {
    await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'UPDATE_INBOUND_STATUS',
      details: `Inbound Document ID: ${id} status changed to ${main_status}`,
    });
  }

  return NextResponse.json(data);
}
