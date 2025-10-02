
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const DELETE_ROLES = ['Super Admin'];

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !DELETE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required.' }, { status: 400 });
    }

    const { error } = await supabaseService
      .from('putaway_documents')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Supabase bulk delete error:', error);
      throw new Error(error.message);
    }
    
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'BULK_DELETE',
        details: `Deleted ${ids.length} putaway document(s). IDs: ${ids.join(', ')}`,
    });

    return NextResponse.json({ message: 'Documents deleted successfully' });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
