
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

type ProductDoc = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    location: string;
    qty: number;
};

type AggregatedProduct = ProductDoc & {
    stock: number;
};

export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('sku, barcode, brand, expDate, location, qty'),
            supabaseService.from('product_out_documents').select('sku, barcode, brand, expDate, location, qty')
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // Process incoming stock
        (putawayData as ProductDoc[]).forEach(doc => {
            const key = doc.barcode;
            if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock += doc.qty;
                if (doc.location) {
                    existing.location = doc.location;
                }
            } else {
                stockMap.set(key, {
                    ...doc,
                    stock: doc.qty,
                });
            }
        });
        
        // Process outgoing stock
        (productOutData as ProductDoc[]).forEach(doc => {
             const key = doc.barcode;
             if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock -= doc.qty;
             } else {
                // This case handles items that are out but never in (data inconsistency)
                // We'll add them with negative stock to highlight the issue.
                 stockMap.set(key, {
                    ...doc,
                    stock: -doc.qty,
                });
             }
        });

        const finalInventory = Array.from(stockMap.values()).filter(p => p.stock > 0);

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
