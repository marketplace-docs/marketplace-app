
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // This RPC call executes the get_all_batch_products function directly in the database
        const { data, error } = await supabaseService.rpc('get_all_batch_products');

        if (error) {
            console.error('Error calling get_all_batch_products RPC:', error);
            throw new Error('Failed to fetch batch products from database function.');
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in batch-products API route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
