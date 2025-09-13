
import { supabaseService } from '@/lib/supabase-service';
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
    const { error } = await supabaseService
      .from('menu_permissions')
      .upsert(records, { onConflict: 'user_id, menu_href' });

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Permissions updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
