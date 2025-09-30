
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

type ProductOutDocument = {
    id: string;
    nodocument: string;
    sku: string;
    barcode: string;
    expdate: string;
    qty: number;
    status: string;
    date: string;
    location: string;
};

type MasterProduct = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
};

type StockLogEntry = {
    type: 'IN' | 'OUT';
    barcode: string;
    location: string;
    exp_date: string;
    qty: number;
};

type BatchKey = string;
type BatchDetails = {
    sku: string;
    name: string;
    brand: string;
    barcode: string;
    location: string;
    exp_date: string;
    stock: number;
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
        // 1. Fetch all necessary data in parallel
        const [docsRes, productsRes] = await Promise.all([
            supabaseService.from('product_out_documents').select('sku, barcode, expdate, qty, status, location'),
            supabaseService.from('master_products').select('sku, name, barcode, brand')
        ]);

        if (docsRes.error) throw new Error('Failed to fetch stock documents: ' + docsRes.error.message);
        if (productsRes.error) throw new Error('Failed to fetch master products: ' + productsRes.error.message);

        const allDocuments: Omit<ProductOutDocument, 'id' | 'nodocument' | 'date' | 'validatedby'>[] = docsRes.data;
        const allMasterProducts: MasterProduct[] = productsRes.data;

        // 2. Create a lookup map for master products for efficient access
        const productMap = new Map<string, MasterProduct>();
        allMasterProducts.forEach(p => {
             // Prioritize SKU as the key, but also handle mapping by barcode if needed
            if (!productMap.has(p.sku)) {
                 productMap.set(p.sku, p);
            }
             if (!productMap.has(p.barcode)) {
                productMap.set(p.barcode, p);
            }
        });
        
        // 3. Process documents to calculate current stock for each batch
        const stockBatchMap = new Map<BatchKey, BatchDetails>();

        for (const doc of allDocuments) {
            if (!doc.location || !doc.expdate) continue; // Skip docs without location or exp_date

            const key: BatchKey = `${doc.barcode}|${doc.location}|${format(new Date(doc.expdate), 'yyyy-MM-dd')}`;
            
            let qtyChange = 0;
            if (STOCK_IN_STATUSES.includes(doc.status)) {
                qtyChange = doc.qty;
            } else if (STOCK_OUT_STATUSES.includes(doc.status)) {
                qtyChange = -doc.qty;
            }

            if (qtyChange === 0) continue;

            const existingBatch = stockBatchMap.get(key);

            if (existingBatch) {
                existingBatch.stock += qtyChange;
            } else {
                 // Get product info from master data. Fallback from SKU to Barcode.
                const productInfo = productMap.get(doc.sku) || productMap.get(doc.barcode);
                if (productInfo) {
                    stockBatchMap.set(key, {
                        sku: productInfo.sku,
                        name: productInfo.name, // The crucial 'name' field
                        brand: productInfo.brand,
                        barcode: doc.barcode,
                        location: doc.location,
                        exp_date: doc.expdate,
                        stock: qtyChange,
                    });
                }
            }
        }

        // 4. Convert the map to an array and assign a unique ID
        const finalBatchProducts = Array.from(stockBatchMap.values()).map((batch, index) => ({
            ...batch,
            id: `${batch.barcode}-${batch.location}-${batch.exp_date}`, // Create a stable unique ID
        }));


        return NextResponse.json(finalBatchProducts);

    } catch (error: any) {
        console.error('Error in batch-products API route (manual calculation):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
