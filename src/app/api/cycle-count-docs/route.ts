
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor'];

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission.' }, { status: 403 });
  }
  
  try {
    const { document } = await request.json();

    const docToInsert = {
      no_doc: document.no_doc,
      counter_name: document.counter_name,
      count_type: document.count_type,
      items_to_count: document.items_to_count,
      status: document.status,
      notes: document.notes,
      date: new Date().toISOString(),
    };

    const { data, error } = await supabaseService
      .from('cycle_count_docs')
      .insert(docToInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating cycle count doc:', error);
      throw new Error(error.message);
    }
    
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Cycle Count Document: ${data.no_doc}`,
    });

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
    try {
        const { data, error } = await supabaseService
            .from('cycle_count_docs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
