

'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { format } from 'date-fns';

type ProductOutStatus =
    | 'Issue - Order'
    | 'Issue - Internal Transfer'
    | 'Issue - Internal Transfer Out From Warehouse'
    | 'Issue - Internal Transfer out B2B'
    | 'Issue - Internal Transfer out B2C'
    | 'Receipt - Internal Transfer In to Warehouse'
    | 'Issue - Adjustment Manual'
    | 'Adjustment - Loc'
    | 'Adjustment - SKU'
    | 'Issue - Putaway'
    | 'Receipt - Putaway'
    | 'Issue - Return'
    | 'Issue - Return Putaway'
    | 'Issue - Update Expired'
    | 'Receipt - Update Expired'
    | 'Receipt - Outbound Return'
    | 'Receipt'
    | 'Adjusment - Loc';

type BatchProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

// Helper function to create a unique key for each stock batch
const createStockKey = (barcode: string, location: string, exp_date: string): string => {
    const loc = location || 'no-location';
    let exp = 'no-exp-date';
    try {
        if (exp_date) {
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
    'Issue - Internal Transfer Out From Warehouse',
    'Issue - Internal Transfer out B2B',
    'Issue - Internal Transfer out B2C',
    'Issue - Adjustment Manual',
    'Issue - Putaway',
    'Issue - Return',
    'Issue - Return Putaway',
    'Issue - Update Expired',
];


async function generateNewDocumentNumber(status: ProductOutStatus): Promise<string> {
    const year = new Date().getFullYear();
    let prefix = 'MP-ORD'; // Default prefix

    if (status.startsWith('Issue - Order')) prefix = `MP-ORD-${year}`;
    else if (status.startsWith('Adjustment') || status.startsWith('Adjusment')) prefix = `MP-ADJ-${year}`;
    else if (status.startsWith('Issue - Internal Transfer')) prefix = `MP-TRSF-${year}`;
    else if (status.startsWith('Issue - Return')) prefix = `MP-RTN-${year}`;
    else if (status.startsWith('Issue - Update Expired') || status.startsWith('Receipt - Update Expired')) prefix = `MP-UPD-EXP-${year}`;
    else if (status.startsWith('Receipt - Outbound Return')) prefix = `MP-OTR-${year}`;
    else if (status === 'Receipt') prefix = `MP-RCP-${year}`;
    else if (status.startsWith('Issue - Putaway') || status.startsWith('Receipt - Putaway')) prefix = `MP-PTW-${year}`;
    else prefix = `MP-GEN-${year}`;

    const { data, error } = await supabaseService
        .from('product_out_documents')
        .select('nodocument')
        .like('nodocument', `${prefix}-%`)
        .order('nodocument', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching last document number for product_out:", error);
        throw new Error("Could not generate new document number.");
    }

    let newSeq = 1;
    if (data) {
        const lastSeq = parseInt(data.nodocument.split('-').pop() || '0', 10);
        newSeq = lastSeq + 1;
    }

    return `${prefix}-${newSeq.toString().padStart(5, '0')}`;
}

export async function POST(request: Request) {
    try {
        // This API now only handles JSON, not FormData
        const { documents, user } = await request.json();
        
        if (!documents || !Array.isArray(documents) || !user) {
            return NextResponse.json({ error: 'Invalid request body. Expects { documents: [], user: {} }' }, { status: 400 });
        }

        const failedRows: { document: any, reason: string }[] = [];
        const validDocsToInsert = [];

        for (const entry of documents) {
            let requestedQty = entry.qty;

            if (!entry.barcode || !requestedQty || !entry.status) {
                failedRows.push({ document: entry, reason: 'Missing required data (barcode, qty, or status).' });
                continue;
            }
             if (requestedQty <= 0) {
                failedRows.push({ document: entry, reason: 'Quantity must be greater than 0.' });
                continue;
            }

            try {
                 const { data, error: rpcError } = await supabaseService.rpc('get_all_batch_products');
                 if (rpcError) throw new Error('Failed to fetch stock data from database.');
                 const allAvailableBatches: BatchProduct[] = data;

                const productBatches = allAvailableBatches.filter(b => b.barcode === entry.barcode && b.stock > 0);

                // --- Cascading FEFO Logic ---
                const sortedBatches = productBatches.sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());
                
                const totalStockAvailable = sortedBatches.reduce((sum, batch) => sum + batch.stock, 0);

                if (totalStockAvailable < requestedQty) {
                    failedRows.push({ document: entry, reason: `Insufficient stock for barcode ${entry.barcode}. Required: ${requestedQty}, Available: ${totalStockAvailable}.` });
                    continue;
                }
                
                let remainingQtyToTake = requestedQty;
                
                for (const batch of sortedBatches) {
                    if (remainingQtyToTake <= 0) break;

                    const qtyFromThisBatch = Math.min(remainingQtyToTake, batch.stock);

                    const docNumber = await generateNewDocumentNumber(entry.status as ProductOutStatus);
                    validDocsToInsert.push({
                        nodocument: docNumber,
                        sku: batch.sku,
                        barcode: entry.barcode,
                        expdate: batch.exp_date,
                        location: batch.location,
                        qty: qtyFromThisBatch,
                        status: entry.status as ProductOutStatus,
                        date: new Date().toISOString(),
                        validatedby: user.name,
                    });
                    
                    remainingQtyToTake -= qtyFromThisBatch;
                }

            } catch (processingError: any) {
                failedRows.push({ document: entry, reason: `Error processing barcode ${entry.barcode}: ${processingError.message}` });
            }
        }

        if (validDocsToInsert.length > 0) {
            const { error: insertError } = await supabaseService
                .from('product_out_documents')
                .insert(validDocsToInsert);

            if (insertError) {
                return NextResponse.json({ error: `Database insert error: ${insertError.message}` }, { status: 500 });
            }
            
            await logActivity({
                userName: user.name,
                userEmail: user.email,
                action: 'CREATE_BULK',
                details: `Bulk processed ${validDocsToInsert.length} product out documents via internal transfer.`,
            });
        }
        
        if (failedRows.length > 0) {
            return NextResponse.json({ 
                message: 'Upload processed with some failures.',
                successfulUploads: validDocsToInsert.length,
                failedRows: failedRows 
            }, { status: 207 });
        }


        return NextResponse.json({
            message: 'Upload processed successfully.',
            successfulUploads: validDocsToInsert.length,
            failedRows: [],
        });

    } catch (error: any) {
        console.error('Batch upload error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
}
