
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    stock: number;
};

export async function GET() {
    try {
        // Fetch all product in (putaway) and product out documents
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('sku, barcode, brand, expDate, qty'),
            supabaseService.from('product_out_documents').select('barcode, qty')
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // Process stock in from putaway documents
        putawayData.forEach(doc => {
            // Using barcode as the unique key for each product batch
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
                    stock: doc.qty,
                });
            }
        });
        
        // Process stock out from product out documents
        productOutData.forEach(doc => {
             const key = doc.barcode;
             if (stockMap.has(key)) {
                stockMap.get(key)!.stock -= doc.qty;
             }
        });

        // Filter out items with zero or negative stock
        const finalInventory = Array.from(stockMap.values()).filter(p => p.stock > 0);

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
