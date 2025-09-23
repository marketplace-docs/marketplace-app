
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';


// GET details of a specific wave (including its orders)
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const { data: waveData, error: waveError } = await supabaseService
            .from('waves')
            .select('*')
            .eq('id', id)
            .single();
        
        if (waveError) throw new Error('Wave not found.');

        const { data: ordersData, error: ordersError } = await supabaseService
            .from('wave_orders')
            .select('*')
            .eq('wave_id', id);

        if (ordersError) throw new Error('Could not fetch orders for the wave.');
        
        return NextResponse.json({ ...waveData, orders: ordersData });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// DELETE a wave
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const user = {
        name: request.headers.get('X-User-Name'),
        email: request.headers.get('X-User-Email'),
        role: request.headers.get('X-User-Role'),
    };

    // Add role-based access control if necessary
    if (!user?.role || !['Super Admin', 'Manager', 'Supervisor'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    try {
        // The database is set up with ON DELETE CASCADE, so deleting the wave
        // will automatically delete the associated wave_orders.
        const { error } = await supabaseService
            .from('waves')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting wave:', error);
            throw new Error(error.message);
        }

        if (user.name && user.email) {
            await logActivity({
                userName: user.name,
                userEmail: user.email,
                action: 'CANCEL_WAVE',
                details: `Cancelled wave ID: ${id}`,
            });
        }
        
        return NextResponse.json({ message: 'Wave cancelled successfully.' }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { status, user } = body;

  if (!user?.role) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { data, error } = await supabaseService
    .from('waves')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE_WAVE_STATUS',
        details: `Wave ID: ${id} status changed to ${status}`,
    });
  }

  return NextResponse.json(data);
}
