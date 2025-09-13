
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    location: string;
    stock: number;
};

export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('sku, barcode, brand, expDate, location, qty'),
            supabaseService.from('product_out_documents').select('barcode, qty, location')
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        putawayData.forEach(doc => {
            const key = doc.barcode;
            if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock += doc.qty;
            } else {
                stockMap.set(key, {
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: doc.brand,
                    expDate: doc.expDate,
                    location: doc.location,
                    stock: doc.qty,
                });
            }
        });
        
        productOutData.forEach(doc => {
             const key = doc.barcode;
             if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock -= doc.qty;
                // Update location if product_out has a more recent one, assuming it's relevant
                if (doc.location) {
                    existing.location = doc.location;
                }
             }
        });

        const finalInventory = Array.from(stockMap.values()).filter(p => p.stock > 0);

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
