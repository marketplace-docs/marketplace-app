
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { getAuthenticatedUser } from '@/lib/auth-service';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function GET() {
  const { data, error } = await supabaseService
    .from('locations')
    .select('*')
    .order('name', { ascending: true })
    .limit(4000); // Set a higher limit to fetch all locations

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  
  const { locations } = await request.json();

  if (!Array.isArray(locations) || locations.length === 0) {
    return NextResponse.json({ error: 'Request body must be an array of location objects.' }, { status: 400 });
  }

  const locationsToInsert = locations.map(loc => ({
    name: loc.name,
    type: loc.type,
  }));

  const { data, error } = await supabaseService
    .from('locations')
    .insert(locationsToInsert)
    .select();

  if (error) {
    // Handle unique constraint violation gracefully
    if (error.code === '23505') { // 'unique_violation'
        return NextResponse.json({ error: 'One or more locations already exist.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'CREATE',
      details: `Created ${locations.length} new location(s): ${locations.map(l => l.name).join(', ')}`,
  });

  return NextResponse.json(data, { status: 201 });
}
