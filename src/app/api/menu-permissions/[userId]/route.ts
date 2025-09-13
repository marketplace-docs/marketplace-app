
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const userIdNumber = parseInt(userId, 10);
  if (isNaN(userIdNumber)) {
    return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseService
      .from('menu_permissions')
      .select('menu_href, is_accessible')
      .eq('user_id', userIdNumber);

    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
     console.error('Supabase fetch error:', error);
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
