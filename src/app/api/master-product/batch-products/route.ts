
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { differenceInMonths, isBefore } from 'date-fns';

const STOCK_IN_STATUSES = [
    'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse', 
    'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt'
];

const STOCK_OUT_STATUSES = [
    'Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse', 
    'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C', 'Issue - Adjustment Manual', 
    'Issue - Putaway', 'Issue - Return', 'Issue - Return Putaway', 'Issue - Update Expired', 'Adjustment - Loc'
];

const getProductStatus = (exp_date: string): 'Sellable' | 'Expiring' | 'Expired' => {
    const now = new Date();
    const expiry = new Date(exp_date);
    if (isBefore(expiry, now)) {
        return 'Expired';
    }
    const monthsDiff = differenceInMonths(expiry, now);
    if (monthsDiff < 9) {
        return 'Expiring';
    }
    return 'Sellable';
};


export async function GET() {
    try {
        const [docsRes, productsRes] = await Promise.all([
            supabaseService.from('product_out_documents').select('sku, barcode, location, expdate, status, qty'),
            supabaseService.from('master_products').select('sku, name, brand, barcode')
        ]);
        
        if (docsRes.error) throw new Error(docsRes.error.message);
        if (productsRes.error) throw new Error(productsRes.error.message);

        const productMap = new Map<string, { name: string; brand: string }>();
        productsRes.data.forEach(p => {
            productMap.set(p.sku, { name: p.name, brand: p.brand });
        });

        const stockByBatch = new Map<string, { id: string, sku: string, barcode: string, exp_date: string, location: string, stock: number }>();

        docsRes.data.forEach((doc, index) => {
            if (!doc.barcode || !doc.location || !doc.expdate) return;

            const batchKey = `${doc.barcode}|${doc.location}|${doc.expdate}`;
            
            if (!stockByBatch.has(batchKey)) {
                stockByBatch.set(batchKey, {
                    id: `${doc.barcode}-${doc.location}-${doc.expdate}`, // Composite key
                    sku: doc.sku,
                    barcode: doc.barcode,
                    location: doc.location,
                    exp_date: doc.expdate,
                    stock: 0,
                });
            }

            const batch = stockByBatch.get(batchKey)!;
            
            if (STOCK_IN_STATUSES.includes(doc.status)) {
                batch.stock += doc.qty;
            } else if (STOCK_OUT_STATUSES.includes(doc.status)) {
                batch.stock -= doc.qty;
            }
        });
        
        const finalData = Array.from(stockByBatch.values()).map(batch => {
            const productInfo = productMap.get(batch.sku);
            return {
                ...batch,
                name: productInfo?.name || '(No Master Data)',
                brand: productInfo?.brand || '(No Brand)',
                status: getProductStatus(batch.exp_date),
            };
        });

        return NextResponse.json(finalData);

    } catch (error: any) {
        console.error('Error in batch-products API route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
