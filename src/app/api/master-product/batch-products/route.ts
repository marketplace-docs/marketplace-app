
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
    status: string;
};

type CombinedDoc = {
    type: 'IN' | 'OUT';
    date: Date;
    doc: ProductDoc | ProductOutDoc;
};

type AggregatedProduct = {
    // This ID is now a composite key, not a DB ID
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
            // Standardize date format to avoid discrepancies (e.g., timezone issues)
            exp = format(new Date(exp_date), 'yyyy-MM-dd');
        }
    } catch (e) {
        exp = 'invalid-date';
    }
    return `${barcode}|${loc}|${exp}`;
};

// Define statuses that represent a DECREASE in stock.
const REAL_STOCK_OUT_STATUSES = [
    'Issue - Order',
    'Issue - Internal Transfer',
    'Issue - Adjustment Manual',
    'Adjustment - Loc',
    'Issue - Putaway', // Moving stock out of a location
    'Issue - Return', // Returning goods to a supplier
    'Issue - Return Putaway',
    'Issue - Update Expired',
    // 'Receipt' statuses are IN, so they are excluded here.
];


export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('id, sku, barcode, brand, exp_date, location, qty, date').limit(20000),
            supabaseService.from('product_out_documents').select('id, sku, barcode, location, qty, expdate, date, status').limit(20000)
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        const stockMap = new Map<string, AggregatedProduct>();

        // All putaway documents are IN transactions
        const inTransactions = putawayData.map(doc => ({ type: 'IN' as const, date: new Date(doc.date), doc }));

        // Process product_out documents to determine if they are IN or OUT
        const outOrInFromProductOut = (productOutData as ProductOutDoc[]).map(doc => {
            const isOut = REAL_STOCK_OUT_STATUSES.includes(doc.status);
            return { type: (isOut ? 'OUT' : 'IN') as 'IN' | 'OUT', date: new Date(doc.date), doc };
        });

        const allTransactions: CombinedDoc[] = [...inTransactions, ...outOrInFromProductOut];

        // Initialize map with all possible batches from ALL documents
        allTransactions.forEach(tx => {
            const doc = tx.doc;
            const exp_date = 'exp_date' in doc ? doc.exp_date : doc.expdate;
            const key = createStockKey(doc.barcode, doc.location, exp_date);
            if (!stockMap.has(key)) {
                stockMap.set(key, {
                    id: key, 
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: ('brand' in doc) ? doc.brand || '' : '',
                    exp_date: exp_date,
                    location: doc.location,
                    stock: 0,
                });
            }
        });

        // Chronologically process all transactions to calculate final stock
        allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        allTransactions.forEach(tx => {
            const doc = tx.doc;
            const exp_date = 'exp_date' in doc ? doc.exp_date : doc.expdate;
            
            const key = createStockKey(doc.barcode, doc.location, exp_date);

            if (stockMap.has(key)) {
                const entry = stockMap.get(key)!;
                if (tx.type === 'IN') {
                    entry.stock += doc.qty;
                } else { 
                    entry.stock -= doc.qty;
                }
                // Fill in brand if it's missing and this is a putaway doc
                if (tx.type === 'IN' && 'brand' in doc && !entry.brand) {
                    entry.brand = doc.brand;
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
