import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor'];

export async function POST(request: Request) {
  try {
    const { document, user } = await request.json();

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission.' }, { status: 403 });
    }

    const docToInsert = {
      ...document,
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
    
    if (user.name && user.email) {
      await logActivity({
          userName: user.name,
          userEmail: user.email,
          action: 'CREATE',
          details: `Cycle Count Document: ${data.no_document}`,
      });
    }

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
