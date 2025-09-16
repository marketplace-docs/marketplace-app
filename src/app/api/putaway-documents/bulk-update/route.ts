
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, status, userName, userEmail, userRole } = body;

    if (!userRole || !UPDATE_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

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
    
    if (userName && userEmail) {
        await logActivity({
            userName,
            userEmail,
            action: 'BULK_UPDATE',
            details: `Updated status to "${status}" for ${ids.length} putaway document(s). IDs: ${ids.join(', ')}`,
        });
    }

    return NextResponse.json({ message: 'Documents updated successfully', data });
  } catch (error: any) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
