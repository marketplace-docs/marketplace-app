
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabaseService
    .from('backlog_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const items = await request.json();
  
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Request body must be an array of backlog items.' }, { status: 400 });
  }

  const itemsToInsert = items.map(item => ({
    store_name: item.store_name,
    payment_accepted: item.payment_accepted,
    marketplace: item.marketplace,
  }));

  const { data, error } = await supabaseService
    .from('backlog_items')
    .insert(itemsToInsert)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
