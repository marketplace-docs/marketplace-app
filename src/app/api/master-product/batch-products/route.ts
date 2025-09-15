
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

        const allDocs = [
            ...(putawayData as ProductDoc[]).map(doc => ({ ...doc, type: 'IN' as const, expDate: doc.exp_date })),
            ...(productOutData as ProductOutDoc[]).map(doc => ({ ...doc, type: 'OUT' as const, expDate: doc.expdate }))
        ];
        
        // Initialize map with all possible batches from ALL documents
        allDocs.forEach(doc => {
            if (!doc.barcode || !doc.location || !doc.expDate) return;
            const key = createStockKey(doc.barcode, doc.location, doc.expDate);
            if (!stockMap.has(key)) {
                stockMap.set(key, {
                    id: doc.id, 
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
        
        // Reset stock to 0 before chronological calculation
        stockMap.forEach(entry => entry.stock = 0);

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
                 // Fill in potentially missing info from putaway docs
                if (tx.type === 'IN' && !(entry.brand)) {
                    entry.brand = (doc as ProductDoc).brand;
                }
            } else {
                 // This case should not happen with the new logic, but is a safeguard.
                 const newEntry: AggregatedProduct = {
                    id: `anomaly-${doc.id}`,
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: (doc as ProductDoc).brand || '',
                    exp_date: exp_date,
                    location: doc.location,
                    stock: tx.type === 'IN' ? doc.qty : -doc.qty,
                };
                stockMap.set(key, newEntry);
            }
        });


        const finalInventory = Array.from(stockMap.values());

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
