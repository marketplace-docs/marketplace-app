
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !UPDATE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  try {
    const { ids, status } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: 'Document IDs and status are required.' }, { status: 400 });
    }

    const { data, error } = await supabaseService
      .from('putaway_documents')
      .update({ status: status })
      .in('id', ids)
      .select();

    if (error) {
      console.error('Supabase bulk update error:', error);
      throw new Error(error.message);
    }
    
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'BULK_UPDATE',
        details: `Updated status to "${status}" for ${ids.length} putaway document(s). IDs: ${ids.join(', ')}`,
    });

    return NextResponse.json({ message: 'Documents updated successfully', data });
  } catch (error: any) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
