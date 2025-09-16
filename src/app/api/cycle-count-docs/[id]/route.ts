
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const DELETE_ROLES = ['Super Admin'];

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = {
    name: request.headers.get('X-User-Name'),
    email: request.headers.get('X-User-Email'),
    role: request.headers.get('X-User-Role'),
  };

  if (!user.role || !DELETE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { error } = await supabaseService
    .from('cycle_count_docs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error deleting cycle count doc:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'DELETE',
      details: `Cycle Count Document ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
}

    