
import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId, permissions } = await request.json();

  if (!userId || !permissions) {
    return NextResponse.json({ error: 'userId and permissions are required' }, { status: 400 });
  }

  const records = Object.entries(permissions).map(([menu_href, is_accessible]) => ({
    user_id: userId,
    menu_href,
    is_accessible,
  }));

  // Upsert into the database
  const { error } = await supabase
    .from('menu_permissions')
    .upsert(records, { onConflict: 'user_id, menu_href' });

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Permissions updated successfully' }, { status: 200 });
}

    