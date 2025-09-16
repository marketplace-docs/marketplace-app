
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

// Define statuses that represent a true stock deduction from the warehouse
const REAL_STOCK_OUT_STATUSES = [
    'Issue - Order',
    'Issue - Internal Transfer',
    'Issue - Adjustment Manual',
    'Issue - Return'
];


export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            // Fetch status as well to filter internal movements
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            supabaseService.from('putaway_documents').select('id, sku, barcode, brand, exp_date, location, qty, date').limit(20000),
            supabaseService.from('product_out_documents').select('id, sku, barcode, location, qty, expdate, date, status').limit(20000)
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
            const key = createStockKey(doc.barcode, doc.location, doc.expDate);
            if (!stockMap.has(key)) {
                stockMap.set(key, {
                    // Use the key itself as the unique ID for the aggregated batch
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
            // CRITICAL FIX: Only include documents that represent a true stock out in the calculation
            ...(productOutData as ProductOutDoc[])
              .filter(doc => REAL_STOCK_OUT_STATUSES.includes(doc.status))
              .map(doc => ({ type: 'OUT' as const, date: new Date(doc.date), doc }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Stock levels are already reset to 0 during initialization in the map.

        // Process transactions chronologically
        combinedTransactions.forEach(tx => {
            const doc = tx.doc as ProductDoc | ProductOutDoc;
            const exp_date = tx.type === 'IN' ? (doc as ProductDoc).exp_date : (doc as ProductOutDoc).expdate;
            
            const key = createStockKey(doc.barcode, doc.location, exp_date);

            if (stockMap.has(key)) {
                const entry = stockMap.get(key)!;
                if (tx.type === 'IN') {
                    entry.stock += doc.qty;
                } else { // 'OUT'
                    entry.stock -= doc.qty;
                }
                 // Fill in potentially missing brand info from putaway docs
                if (tx.type === 'IN' && !(entry.brand)) {
                    entry.brand = (doc as ProductDoc).brand;
                }
            } 
            // The 'else' case is no longer needed because all batches are pre-initialized.
        });


        const finalInventory = Array.from(stockMap.values());

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
