
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { format } from 'date-fns';

async function generateWaveDocumentNumber(): Promise<string> {
    const datePrefix = format(new Date(), 'yyyyMMdd');
    const prefix = `WAVE-${datePrefix}`;

    const { data, error } = await supabaseService
        .from('waves')
        .select('wave_document_number')
        .like('wave_document_number', `${prefix}-%`)
        .order('wave_document_number', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
        console.error('Error fetching last wave number:', error);
        throw new Error('Could not generate new wave number.');
    }

    let newSeq = 1;
    if (data) {
        const lastSeq = parseInt(data.wave_document_number.split('-').pop() || '0', 10);
        newSeq = lastSeq + 1;
    }

    return `${prefix}-${newSeq.toString().padStart(4, '0')}`;
}

export async function POST(request: Request) {
    try {
        const { orders, user, waveType } = await request.json();

        if (!user || !user.role) {
            return NextResponse.json({ error: 'Forbidden: You must be logged in.' }, { status: 403 });
        }
        if (!Array.isArray(orders) || orders.length === 0) {
            return NextResponse.json({ error: 'No orders selected for the wave.' }, { status: 400 });
        }

        const waveDocumentNumber = await generateWaveDocumentNumber();

        // 1. Create the wave entry
        const { data: waveData, error: waveError } = await supabaseService
            .from('waves')
            .insert({
                wave_document_number: waveDocumentNumber,
                wave_type: waveType,
                status: 'Wave Progress',
                total_orders: orders.length,
                created_by: user.name,
            })
            .select()
            .single();

        if (waveError) {
            console.error('Error creating wave:', waveError);
            throw new Error(waveError.message);
        }

        // 2. Create the wave_orders entries
        const waveOrdersToInsert = orders.map(order => ({
            wave_id: waveData.id,
            order_id: order.id,
            order_reference: order.reference,
            sku: order.sku,
            qty: order.qty,
            customer: order.customer,
            city: order.city,
        }));

        const { error: waveOrdersError } = await supabaseService
            .from('wave_orders')
            .insert(waveOrdersToInsert);

        if (waveOrdersError) {
            console.error('Error inserting wave orders:', waveOrdersError);
            // Optional: Rollback wave creation
            await supabaseService.from('waves').delete().eq('id', waveData.id);
            throw new Error('Failed to associate orders with the wave.');
        }

        // 3. Delete the orders from manual_orders
        const orderIdsToDelete = orders.map(order => order.id);
        const { error: deleteError } = await supabaseService
            .from('manual_orders')
            .delete()
            .in('id', orderIdsToDelete);

        if (deleteError) {
            console.error('Error deleting processed manual orders:', deleteError);
            // This is not ideal, as the wave is already created. Manual cleanup might be needed.
            // We'll still return success but log the error.
        }

        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'CREATE_WAVE',
            details: `Created wave ${waveDocumentNumber} with ${orders.length} orders.`,
        });

        return NextResponse.json({ message: 'Wave created successfully', wave: waveData }, { status: 201 });

    } catch (error: any) {
        console.error('Error in POST /api/waves:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}


export async function GET() {
    try {
         const { data, error } = await supabaseService
            .from('waves')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching waves:', error);
        return NextResponse.json({ error: 'Failed to fetch waves.' }, { status: 500 });
    }
}
