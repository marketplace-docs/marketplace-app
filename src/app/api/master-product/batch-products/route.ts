
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
    try {
        const formattedExpDate = exp_date ? format(new Date(exp_date), 'yyyy-MM-dd') : 'no-exp-date';
        return `${barcode}|${location}|${formattedExpDate}`;
    } catch (e) {
        // Handle invalid date format gracefully
        return `${barcode}|${location}|invalid-date`;
    }
};


export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('id, sku, barcode, brand, exp_date, location, qty, date'),
            supabaseService.from('product_out_documents').select('id, sku, barcode, location, qty, expdate, date')
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // Initialize map with all possible batches from putaway documents
        (putawayData as ProductDoc[]).forEach(doc => {
            if (!doc.barcode || !doc.location || !doc.exp_date) return;
            const key = createStockKey(doc.barcode, doc.location, doc.exp_date);
            if (!stockMap.has(key)) {
                stockMap.set(key, {
                    id: doc.id, 
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: doc.brand,
                    exp_date: doc.exp_date,
                    location: doc.location,
                    stock: 0, 
                });
            }
        });

        // Combine and sort all transactions by date
        const combinedTransactions: CombinedDoc[] = [
            ...(putawayData as ProductDoc[]).map(doc => ({ type: 'IN' as const, date: new Date(doc.date), doc })),
            ...(productOutData as ProductOutDoc[]).map(doc => ({ type: 'OUT' as const, date: new Date(doc.date), doc }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());


        // Process transactions chronologically
        combinedTransactions.forEach(tx => {
            const doc = tx.doc;
            const exp_date = tx.type === 'IN' ? (doc as ProductDoc).exp_date : (doc as ProductOutDoc).expdate;
            
            if (!doc.barcode || !doc.location || !exp_date) return;

            const key = createStockKey(doc.barcode, doc.location, exp_date);

            if (stockMap.has(key)) {
                const entry = stockMap.get(key)!;
                if (tx.type === 'IN') {
                    entry.stock += doc.qty;
                } else { // 'OUT'
                    entry.stock -= doc.qty;
                }
            } else {
                 if (tx.type === 'OUT') {
                    console.warn(`Outgoing stock for key ${key} has no corresponding putaway record. Stock might appear negative.`);
                    // Create a dummy entry to show the negative stock, which indicates a data issue
                    stockMap.set(key, {
                        id: `out-${doc.id}`,
                        sku: doc.sku,
                        barcode: doc.barcode,
                        brand: '', // Brand might not be available on out-doc
                        exp_date: exp_date,
                        location: doc.location,
                        stock: -doc.qty,
                    });
                 }
            }
        });


        const finalInventory = Array.from(stockMap.values());

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
