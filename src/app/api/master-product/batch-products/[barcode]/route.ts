
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

type ProductDoc = {
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    qty: number;
};

type AggregatedProduct = {
    id: string; // Add id to be able to select it
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

const createStockKey = (barcode: string, location: string, exp_date: string): string => {
    const formattedExpDate = exp_date ? format(new Date(exp_date), 'yyyy-MM-dd') : 'no-exp-date';
    return `${barcode}|${location}|${formattedExpDate}`;
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
            supabaseService.from('putaway_documents').select('id, sku, barcode, brand, exp_date, location, qty').eq('barcode', barcode),
            supabaseService.from('product_out_documents').select('sku, barcode, location, qty, expdate').eq('barcode', barcode)
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // Process incoming stock from putaway_documents
        (putawayData as (ProductDoc & {id: string})[]).forEach(doc => {
            if (!doc.barcode || !doc.location || !doc.exp_date) return;
            const key = createStockKey(doc.barcode, doc.location, doc.exp_date);

            if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock += doc.qty;
            } else {
                stockMap.set(key, {
                    id: doc.id, // Use the ID of the first putaway doc for this batch
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: doc.brand,
                    exp_date: doc.exp_date,
                    location: doc.location,
                    stock: doc.qty,
                });
            }
        });
        
        // Process outgoing stock from product_out_documents
        (productOutData as any[]).forEach((doc: any) => {
             if (!doc.barcode || !doc.location || !doc.expdate) return;
             const key = createStockKey(doc.barcode, doc.location, doc.expdate);
             if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock -= doc.qty;
             }
        });

        const finalInventory = Array.from(stockMap.values()).filter(p => p.stock > 0);

        if (finalInventory.length === 0) {
             return NextResponse.json({ error: 'Product not found in any batch or stock is zero.' }, { status: 404 });
        }

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data by barcode:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
