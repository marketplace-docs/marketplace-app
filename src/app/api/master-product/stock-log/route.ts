

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

type ProductOutDocument = {
    id: string;
    date: string;
    nodocument: string;
    sku: string;
    barcode: string;
    location: string;
    qty: number;
    status: string;
    validatedby: string;
};

type MasterProduct = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
};


// Define statuses that represent an INCREASE in stock.
const STOCK_IN_STATUSES = [
    'Receipt - Inbound',
    'Receipt - Putaway',
    'Receipt - Internal Transfer In to Warehouse',
    'Receipt - Update Expired',
    'Receipt - Outbound Return',
    'Receipt'
];

// Define statuses that represent a DECREASE in stock.
const STOCK_OUT_STATUSES = [
    'Issue - Order',
    'Issue - Internal Transfer',
    'Issue - Internal Transfer Out From Warehouse',
    'Issue - Internal Transfer out B2B',
    'Issue - Internal Transfer out B2C',
    'Issue - Adjustment Manual',
    'Issue - Putaway',
    'Issue - Return',
    'Issue - Return Putaway',
    'Issue - Update Expired',
    'Adjustment - Loc',
    'Adjusment - Loc'
];


export async function GET() {
    try {
        const [docsRes, productsRes] = await Promise.all([
            supabaseService
                .from('product_out_documents')
                .select('id, date, nodocument, sku, barcode, location, qty, status, validatedby')
                .order('date', { ascending: false }),
            supabaseService.from('master_products').select('sku, name')
        ]);
        
        if (docsRes.error) throw new Error(docsRes.error.message);
        if (productsRes.error) throw new Error(productsRes.error.message);

        const documents: ProductOutDocument[] = docsRes.data;
        const products: { sku: string; name: string }[] = productsRes.data;
        
        const productMap = new Map<string, string>();
        products.forEach(p => productMap.set(p.sku, p.name));
        
        // This is a simplified calculation for demonstration. A real-world scenario might need a more robust approach.
        // We create a map to track running totals for each batch (barcode + location).
        const runningTotals = new Map<string, number>();
        const sortedDocuments = [...documents].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const stockLog = sortedDocuments.map((doc) => {
            const batchKey = `${doc.barcode}|${doc.location}`;
            const qty_before = runningTotals.get(batchKey) || 0;
            
            let qty_change = 0;
             if (STOCK_IN_STATUSES.includes(doc.status)) {
                qty_change = doc.qty;
            } else if (STOCK_OUT_STATUSES.includes(doc.status)) {
                qty_change = -doc.qty;
            }

            const qty_after = qty_before + qty_change;
            runningTotals.set(batchKey, qty_after);
            
            return {
                ...doc,
                name: productMap.get(doc.sku) || '(No Master Data)',
                type: qty_change >= 0 ? 'IN' : 'OUT',
                qty_before,
                qty_change,
                qty_after,
                validated_by: doc.validatedby
            };
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


        return NextResponse.json(stockLog);

    } catch (err: any) {
        console.error('Stock Log API Error:', err);
        return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
