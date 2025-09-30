

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format, differenceInMonths, isBefore } from 'date-fns';

type ProductOutStatus =
    | 'Receipt - Inbound'
    | 'Receipt - Putaway'
    | 'Receipt - Internal Transfer In to Warehouse'
    | 'Receipt - Update Expired'
    | 'Receipt - Outbound Return'
    | 'Receipt'
    | 'Issue - Order'
    | 'Issue - Internal Transfer'
    | 'Issue - Internal Transfer Out From Warehouse'
    | 'Issue - Internal Transfer out B2B'
    | 'Issue - Internal Transfer out B2C'
    | 'Issue - Adjustment Manual'
    | 'Issue - Putaway'
    | 'Issue - Return'
    | 'Issue - Return Putaway'
    | 'Issue - Update Expired'
    | 'Adjustment - Loc'
    | 'Adjusment - Loc';

type ProductOutDocument = {
    id: string;
    nodocument: string;
    sku: string;
    barcode: string;
    expdate: string;
    qty: number;
    status: ProductOutStatus;
    date: string;
    location: string;
};

type MasterProduct = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
};

type BatchKey = string;

type ProductStatus = 'Sellable' | 'Expiring' | 'Expired' | 'Out of Stock' | 'Quarantine' | 'Damaged' | 'Marketplace' | 'Sensitive MP';

type BatchDetails = {
    sku: string;
    name: string;
    brand: string;
    barcode: string;
    location: string;
    exp_date: string;
    stock: number;
    status: ProductStatus;
};


// Define statuses that represent an INCREASE in stock.
const STOCK_IN_STATUSES: ProductOutStatus[] = [
    'Receipt - Inbound',
    'Receipt - Putaway',
    'Receipt - Internal Transfer In to Warehouse',
    'Receipt - Update Expired',
    'Receipt - Outbound Return',
    'Receipt'
];

// Define statuses that represent a DECREASE in stock.
const STOCK_OUT_STATUSES: ProductOutStatus[] = [
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

const getLocationType = (locationName: string): ProductStatus => {
    const lowerCaseName = locationName.toLowerCase();
    if (lowerCaseName.includes('quarantine')) return 'Quarantine';
    if (lowerCaseName.includes('damaged')) return 'Damaged';
    if (lowerCaseName.includes('sensitive')) return 'Sensitive MP';
    if (lowerCaseName.includes('marketplace')) return 'Marketplace';
    return 'Sellable'; // Default if no other type matches
};

const getProductStatus = (expDate: Date, stock: number, locationType: ProductStatus): ProductStatus => {
    const today = new Date();

    if (stock <= 0) return 'Out of Stock';
    if (locationType !== 'Sellable') return locationType; // Quarantine, Damaged, etc. override date logic
    if (isBefore(expDate, today)) return 'Expired';

    const monthsUntilExpiry = differenceInMonths(expDate, today);
    if (monthsUntilExpiry < 3) return 'Expired'; // Treat as expired if less than 3 months
    if (monthsUntilExpiry < 9) return 'Expiring';
    
    return 'Sellable';
};


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
            if (p.sku) {
                 productMap.set(p.sku, p);
            }
        });
        
        // 3. Process documents to calculate current stock for each batch
        const stockBatchMap = new Map<BatchKey, Omit<BatchDetails, 'status'>>();

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
                const productInfo = productMap.get(doc.sku);
                
                stockBatchMap.set(key, {
                    sku: doc.sku,
                    name: productInfo?.name || '(No Master Data)',
                    brand: productInfo?.brand || '(No Master Data)',
                    barcode: doc.barcode,
                    location: doc.location,
                    exp_date: doc.expdate,
                    stock: qtyChange,
                });
            }
        }

        // 4. Convert map to array, assign status, and FILTER OUT "Staging Area Inbound"
        const finalBatchProducts = Array.from(stockBatchMap.values())
            .filter(batch => batch.location.toLowerCase() !== 'staging area inbound') // Exclude staging area
            .map((batch, index) => {
                const locationType = getLocationType(batch.location);
                const status = getProductStatus(new Date(batch.exp_date), batch.stock, locationType);

                return {
                    ...batch,
                    id: `${batch.barcode}-${batch.location}-${batch.exp_date}`,
                    status: status,
                };
            });


        return NextResponse.json(finalBatchProducts);

    } catch (error: any) {
        console.error('Error in batch-products API route (manual calculation):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
