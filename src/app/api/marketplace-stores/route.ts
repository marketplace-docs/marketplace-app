
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
  const { user, stores, ...singleStore } = body;

  // Handle bulk upload
  if (Array.isArray(stores)) {
    const storesToInsert = stores.map(store => ({
      marketplace_name: store.marketplace_name,
      store_name: store.store_name,
      platform: store.platform,
    }));

    const { data, error } = await supabaseService
      .from('marketplace_stores')
      .insert(storesToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    if (user && user.name && user.email) {
      await logActivity({
          userName: user.name,
          userEmail: user.email,
          action: 'CREATE',
          details: `Bulk uploaded ${stores.length} marketplace stores`,
      });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // Handle single store creation
  const { marketplace_name, store_name, platform } = singleStore;
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

  if (user && user.name && user.email) {
      await logActivity({
          userName: user.name,
          userEmail: user.email,
          action: 'CREATE',
          details: `Marketplace Store: ${store_name} on ${platform}`,
      });
  }

  return NextResponse.json(data, { status: 201 });
}
