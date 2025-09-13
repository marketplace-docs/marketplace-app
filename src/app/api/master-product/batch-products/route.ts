
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

type ProductDoc = {
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    qty: number;
};

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('sku, barcode, brand, exp_date, location, qty'),
            supabaseService.from('product_out_documents').select('sku, barcode, location, qty')
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // Process incoming stock from putaway_documents
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
        (productOutData as Omit<ProductDoc, 'brand' | 'exp_date'>[]).forEach((doc: any) => {
             const key = doc.barcode;
             if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock -= doc.qty;
             } else {
                // This case should ideally not happen if inventory is managed properly
                // But as a fallback, we create an entry with negative stock. Exp_date will be missing.
                 stockMap.set(key, {
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: '', 
                    exp_date: new Date().toISOString(), // Fallback to current date
                    location: doc.location,
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
