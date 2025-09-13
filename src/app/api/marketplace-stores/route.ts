
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function GET() {
  const { data, error } = await supabaseService
    .from('marketplace_stores')
    .select('id, marketplace_name, store_name, platform, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { marketplace_name, store_name, platform, userName, userEmail } = body;

  if (!marketplace_name || !store_name || !platform) {
    return NextResponse.json({ error: 'marketplace_name, store_name, and platform are required' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('marketplace_stores')
    .insert([{ marketplace_name, store_name, platform }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
  }

  if (userName && userEmail) {
      await logActivity({
          userName,
          userEmail,
          action: 'CREATE',
          details: `Marketplace Store: ${store_name} on ${platform}`,
      });
  }

  return NextResponse.json(data, { status: 201 });
}
