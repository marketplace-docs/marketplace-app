
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { format } from 'date-fns';

type BatchProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

export async function POST(request: Request) {
    const { batch, user } = await request.json();

    if (!user || user.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!batch || !batch.barcode || !batch.location || !batch.exp_date) {
        return NextResponse.json({ error: 'Invalid batch data provided.' }, { status: 400 });
    }

    try {
        const { barcode, location, exp_date } = batch;

        const formattedExpDate = format(new Date(exp_date), 'yyyy-MM-dd');

        // Find the product_out documents that could be causing the negative stock for this specific batch
        const { data: anomalousDocs, error: findError } = await supabaseService
            .from('product_out_documents')
            .select('id')
            .eq('barcode', barcode)
            .eq('location', location)
            .eq('expdate', formattedExpDate);

        if (findError) {
            console.error('Error finding anomalous documents:', findError);
            throw new Error('Could not find documents to delete.');
        }

        if (anomalousDocs.length === 0) {
            return NextResponse.json({ message: 'No anomalous documents found to delete.' }, { status: 200 });
        }

        const idsToDelete = anomalousDocs.map(doc => doc.id);

        // Delete the found documents
        const { error: deleteError } = await supabaseService
            .from('product_out_documents')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error('Error deleting anomalous documents:', deleteError);
            throw new Error('Failed to delete anomalous documents.');
        }

        // Log this significant action
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'DELETE_ANOMALY',
            details: `Deleted ${idsToDelete.length} 'product_out' document(s) for barcode ${barcode} at location ${location} to fix negative stock.`,
        });

        return NextResponse.json({ message: `Successfully deleted ${idsToDelete.length} anomalous document(s).` });

    } catch (error: any) {
        console.error('Error in delete-anomaly endpoint:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
