
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format, differenceInMonths, isBefore, parseISO } from 'date-fns';

// A document representing a stock movement
type StockMovement = {
    id: string;
    date: Date;
    sku: string;
    barcode: string;
    brand: string;
    location: string;
    exp_date: string; // ISO format
    qty: number; // Always positive
    type: 'IN' | 'OUT';
};

// Represents a distinct batch of products
type ProductBatch = {
    id: string; // Composite key: barcode|location|exp_date
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string; // ISO format
    location: string;
    stock: number;
    status: ProductStatus;
};

type ProductStatus = 'All' | 'Sellable' | 'Expiring' | 'Expired' | 'Out of Stock' | 'Quarantine' | 'Damaged' | 'Marketplace' | 'Sensitive MP';

// Helper to get status based on batch properties
const getProductStatus = (expDate: string, stock: number, location: string): Omit<ProductStatus, 'All'> => {
    const lowerCaseLocation = location.toLowerCase();
    if (lowerCaseLocation.includes('marketplace')) return 'Marketplace';
    if (lowerCaseLocation.includes('sensitive')) return 'Sensitive MP';
    if (lowerCaseLocation.includes('quarantine')) return 'Quarantine';
    if (lowerCaseLocation.includes('damaged')) return 'Damaged';
    
    if (stock <= 0) return 'Out of Stock';

    try {
        const today = new Date();
        const expiryDate = parseISO(expDate);
        
        if (isBefore(expiryDate, today)) return 'Expired';

        const monthsUntilExpiry = differenceInMonths(expiryDate, today);
        if (monthsUntilExpiry < 3) return 'Expiring';
    } catch (e) {
        // If date is invalid, it's safer to treat it as unsellable for now.
        return 'Quarantine';
    }
    
    return 'Sellable';
};


// Define statuses that represent a DECREASE in stock.
const REAL_STOCK_OUT_STATUSES: string[] = [
    'Issue - Order',
    'Issue - Internal Transfer',
    'Issue - Adjustment Manual',
    'Adjustment - Loc',
    'Issue - Putaway',
    'Issue - Return',
    'Issue - Return Putaway',
    'Issue - Update Expired',
];

// Define statuses that represent an INCREASE in stock.
const REAL_STOCK_IN_STATUSES: string[] = [
    'Putaway', // from original putaway docs
    'Receipt - Putaway',
    'Receipt - Update Expired',
    'Receipt - Outbound Return',
    'Receipt'
];

export async function GET() {
    try {
        const [
            { data: putawayData, error: putawayError },
            { data: productOutData, error: productOutError }
        ] = await Promise.all([
            // Select all putaway documents, which are our primary source of 'IN' transactions
            supabaseService.from('putaway_documents').select('id, sku, barcode, brand, exp_date, location, qty, date').limit(30000),
            // Select all product out documents, which can be IN or OUT
            supabaseService.from('product_out_documents').select('id, sku, barcode, location, qty, expdate, date, status').limit(30000)
        ]);

        if (putawayError) throw putawayError;
        if (productOutError) throw productOutError;
        
        // 1. Combine all raw movements into a single list
        const allMovements: StockMovement[] = [];

        // All original putaway documents are IN transactions
        (putawayData || []).forEach(doc => {
            allMovements.push({
                id: `in-${doc.id}`,
                date: new Date(doc.date),
                sku: doc.sku,
                barcode: doc.barcode,
                brand: doc.brand || '',
                location: doc.location,
                exp_date: doc.exp_date,
                qty: doc.qty,
                type: 'IN',
            });
        });

        // product_out_documents can be IN or OUT
        (productOutData || []).forEach(doc => {
            const isOut = REAL_STOCK_OUT_STATUSES.includes(doc.status);
            allMovements.push({
                id: `out-${doc.id}`,
                date: new Date(doc.date),
                sku: doc.sku,
                barcode: doc.barcode,
                brand: '', // Brand info comes from putaway docs
                location: doc.location,
                exp_date: doc.expdate,
                qty: doc.qty,
                type: isOut ? 'OUT' : 'IN',
            });
        });

        // 2. Sort all movements chronologically
        allMovements.sort((a, b) => a.date.getTime() - b.date.getTime());

        // 3. Process movements to calculate final stock for each distinct batch
        const stockBatches = new Map<string, ProductBatch>(); // Key: barcode|location|exp_date

        for (const movement of allMovements) {
            if (movement.type === 'IN') {
                // For IN transactions, we use the exact batch key
                const key = `${movement.barcode}|${movement.location}|${movement.exp_date}`;
                if (!stockBatches.has(key)) {
                    stockBatches.set(key, {
                        id: key,
                        sku: movement.sku,
                        barcode: movement.barcode,
                        brand: movement.brand,
                        location: movement.location,
                        exp_date: movement.exp_date,
                        stock: 0,
                        status: 'Sellable', // Will be recalculated at the end
                    });
                }
                const batch = stockBatches.get(key)!;
                batch.stock += movement.qty;
                // Update brand if it was missing
                if (!batch.brand && movement.brand) {
                    batch.brand = movement.brand;
                }
            } else { // type === 'OUT'
                // For OUT transactions, find the correct batch(es) to deduct from using FEFO
                const batchesAtLocation = Array.from(stockBatches.values())
                    .filter(b => b.barcode === movement.barcode && b.location === movement.location && b.stock > 0)
                    .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());

                let qtyToDeduct = movement.qty;

                if (batchesAtLocation.length > 0) {
                    for (const batch of batchesAtLocation) {
                        if (qtyToDeduct <= 0) break;
                        const deduction = Math.min(qtyToDeduct, batch.stock);
                        batch.stock -= deduction;
                        qtyToDeduct -= deduction;
                    }
                } else {
                    // This is an anomaly (outgoing stock from a non-existent batch).
                    // We'll create a negative stock record to make this visible in the UI for fixing.
                    const key = `${movement.barcode}|${movement.location}|${movement.exp_date}`;
                     if (!stockBatches.has(key)) {
                        stockBatches.set(key, {
                            id: key,
                            sku: movement.sku,
                            barcode: movement.barcode,
                            brand: '', // Will be filled later if possible
                            location: movement.location,
                            exp_date: movement.exp_date,
                            stock: 0,
                            status: 'Sellable', // Will be re-evaluated
                        });
                    }
                    const anomalousBatch = stockBatches.get(key)!;
                    anomalousBatch.stock -= movement.qty;
                }
            }
        }
        
        // 4. Final calculation and status update
        const finalInventory: ProductBatch[] = Array.from(stockBatches.values()).map(batch => ({
            ...batch,
            status: getProductStatus(batch.exp_date, batch.stock, batch.location)
        }));

        return NextResponse.json(finalInventory);

    } catch (error: any) {
        console.error('Error fetching batch product data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
