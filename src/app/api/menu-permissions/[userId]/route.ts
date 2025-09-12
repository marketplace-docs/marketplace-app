
import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Convert userId to a number, as it comes as a string from params
  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('menu_permissions')
    .select('menu_href, is_accessible')
    .eq('user_id', userIdNumber);

  if (error) {
    console.error('Supabase fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
