
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, status, role } = body;

    if (!name || !email || !status || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, email, status, role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase PATCH Error:', error);
       if (error.code === '23505') { // Unique constraint violation for email
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('API PATCH Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase DELETE Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (e) {
    console.error('API DELETE Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
