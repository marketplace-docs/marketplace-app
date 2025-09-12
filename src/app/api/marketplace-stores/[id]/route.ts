
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { marketplace_name, store_name } = body;

    if (!marketplace_name || !store_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('marketplace_stores')
      .update({ marketplace_name, store_name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase PATCH Error:', error);
       if (error.code === '23505') { 
        return NextResponse.json({ error: 'A store with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
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
      .from('marketplace_stores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase DELETE Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Store deleted successfully' }, { status: 200 });
  } catch (e) {
    console.error('API DELETE Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
