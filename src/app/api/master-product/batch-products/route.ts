
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
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

// Helper function to create a consistent key for grouping
const createStockKey = (barcode: string, location: string, exp_date: string): string => {
    const formattedExpDate = exp_date ? format(new Date(exp_date), 'yyyy-MM-dd') : 'no-exp-date';
    return `${barcode}|${location}|${formattedExpDate}`;
};


export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('sku, barcode, brand, exp_date, location, qty'),
            supabaseService.from('product_out_documents').select('sku, barcode, location, qty, expdate')
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // Process incoming stock from putaway_documents
        (putawayData as ProductDoc[]).forEach(doc => {
            if (!doc.barcode || !doc.location || !doc.exp_date) return; // Skip incomplete records
            const key = createStockKey(doc.barcode, doc.location, doc.exp_date);

            if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock += doc.qty;
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
        (productOutData as any[]).forEach((doc: any) => {
             if (!doc.barcode || !doc.location || !doc.expdate) return; // Skip incomplete records
             const key = createStockKey(doc.barcode, doc.location, doc.expdate);
             if (stockMap.has(key)) {
                const existing = stockMap.get(key)!;
                existing.stock -= doc.qty;
             } else {
                // This case handles stock going out that might not have a matching putaway doc (e.g., initial stock)
                // For accurate aggregation, we mainly rely on putaway docs as the source of truth for batch details.
                // Creating a negative entry here could be confusing. We will assume product_out reduces existing stock.
                console.warn(`Outgoing stock for barcode ${doc.barcode} has no matching incoming batch. This may lead to inaccurate stock counts.`);
             }
        });

        const finalInventory = Array.from(stockMap.values()).filter(p => p.stock > 0);

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
