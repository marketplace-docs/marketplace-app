
import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId, permissions } = await request.json();

  if (!userId || !permissions) {
    return NextResponse.json({ error: 'userId and permissions are required' }, { status: 400 });
  }
  
  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
  }

  const records = Object.entries(permissions).map(([menu_href, is_accessible]) => ({
    user_id: userIdNumber,
    menu_href,
    is_accessible,
  }));

  try {
    // Upsert into the database
    // onConflict specifies what to do if a row with the same user_id and menu_href already exists.
    // Here we tell it to UPDATE the is_accessible column.
    const { error } = await supabase
      .from('menu_permissions')
      .upsert(records, { onConflict: 'user_id, menu_href' });

    if (error) {
      console.error('Supabase upsert error:', error);
      // Provide a more specific error message to the client
      if (error.code === '42501') { // RLS violation code
        return NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Permissions updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
