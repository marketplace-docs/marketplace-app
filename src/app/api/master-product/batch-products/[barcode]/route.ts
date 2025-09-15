
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

type ProductDoc = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    qty: number;
    date: string;
};

type ProductOutDoc = {
    id: string;
    sku: string;
    barcode: string;
    expdate: string;
    location: string;
    qty: number;
    date: string;
};

type CombinedDoc = {
    type: 'IN' | 'OUT';
    date: Date;
    doc: ProductDoc | ProductOutDoc;
};

type AggregatedProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

const createStockKey = (barcode: string, location: string, exp_date: string): string => {
    const loc = location || 'no-location';
    let exp = 'no-exp-date';
    try {
        if (exp_date) {
            exp = format(new Date(exp_date), 'yyyy-MM-dd');
        }
    } catch (e) {
        exp = 'invalid-date';
    }
    return `${barcode}|${loc}|${exp}`;
};

export async function GET(request: Request, { params }: { params: { barcode: string } }) {
    const { barcode } = params;

    if (!barcode) {
        return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('id, sku, barcode, brand, exp_date, location, qty, date').eq('barcode', barcode),
            supabaseService.from('product_out_documents').select('id, sku, barcode, location, qty, expdate, date').eq('barcode', barcode)
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        const allDocsForBarcode = [
            ...(putawayData as ProductDoc[]).map(doc => ({ ...doc, type: 'IN' as const, expDate: doc.exp_date })),
            ...(productOutData as ProductOutDoc[]).map(doc => ({ ...doc, type: 'OUT' as const, expDate: doc.expdate }))
        ];

        // Initialize map with all possible batches for this barcode from ALL documents
        allDocsForBarcode.forEach(doc => {
            const key = createStockKey(doc.barcode, doc.location, doc.expDate);
            if (!stockMap.has(key)) {
                stockMap.set(key, {
                    // Use the key itself as the unique ID
                    id: key,
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: (doc as ProductDoc).brand || '', // Brand might not be on OUT docs
                    exp_date: doc.expDate,
                    location: doc.location,
                    stock: 0, // Start with 0, will calculate chronologically
                });
            }
        });


        // Combine and sort all transactions by date
        const combinedTransactions: CombinedDoc[] = [
            ...(putawayData as ProductDoc[]).map(doc => ({ type: 'IN' as const, date: new Date(doc.date), doc })),
            ...(productOutData as ProductOutDoc[]).map(doc => ({ type: 'OUT' as const, date: new Date(doc.date), doc }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        // Stock levels are already reset to 0 during initialization.

        // Process transactions chronologically
        combinedTransactions.forEach(tx => {
            const doc = tx.doc;
            const exp_date = tx.type === 'IN' ? (doc as ProductDoc).exp_date : (doc as ProductOutDoc).expdate;

            const key = createStockKey(doc.barcode, doc.location, exp_date);

            if (stockMap.has(key)) {
                const entry = stockMap.get(key)!;
                if (tx.type === 'IN') {
                    entry.stock += doc.qty;
                } else { // 'OUT'
                    entry.stock -= doc.qty;
                }
                 // Fill in potentially missing info from putaway docs
                if (tx.type === 'IN' && !(entry.brand)) {
                    entry.brand = (doc as ProductDoc).brand;
                }
            }
            // 'else' case is not needed because all batches are pre-initialized.
        });

        const finalInventory = Array.from(stockMap.values());

        if (finalInventory.length === 0) {
             return NextResponse.json({ error: 'Product not found in any batch.' }, { status: 404 });
        }

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data by barcode:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
