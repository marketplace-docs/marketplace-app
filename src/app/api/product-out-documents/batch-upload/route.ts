
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { format } from 'date-fns';

type ProductOutStatus =
    | 'Issue - Order'
    | 'Issue - Internal Transfer'
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
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const userJson = formData.get('user') as string | null;
        
        if (!file || !userJson) {
            return NextResponse.json({ error: 'Missing file or user data' }, { status: 400 });
        }

        const user = JSON.parse(userJson);
        const text = await file.text();

        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) {
            return NextResponse.json({ error: 'CSV is empty or has only a header.' }, { status: 400 });
        }
        
        const header = lines.shift()!.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const requiredHeaders = ['barcode', 'qty', 'status'];
        if (!requiredHeaders.every(h => header.includes(h))) {
            return NextResponse.json({ error: `Invalid CSV headers. Required: ${requiredHeaders.join(', ')}` }, { status: 400 });
        }

        const failedRows: { row: number, reason: string }[] = [];
        const validDocsToInsert = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const values = line.split(',');
            const entry: { [key: string]: string } = {};
            header.forEach((h, j) => entry[h] = values[j]?.trim().replace(/"/g, ''));

            let requestedQty = parseInt(entry.qty, 10);

            if (!entry.barcode || isNaN(requestedQty) || !entry.status) {
                failedRows.push({ row: i + 2, reason: 'Missing required data (barcode, qty, or status).' });
                continue;
            }
             if (requestedQty <= 0) {
                failedRows.push({ row: i + 2, reason: 'Quantity must be greater than 0.' });
                continue;
            }


            try {
                // Fetch all stock movements for the given barcode
                const [
                    { data: putawayData, error: putawayError },
                    { data: productOutData, error: productOutError }
                ] = await Promise.all([
                    supabaseService.from('putaway_documents').select('sku, brand, exp_date, location, qty, date').eq('barcode', entry.barcode),
                    supabaseService.from('product_out_documents').select('location, qty, expdate, date, status').eq('barcode', entry.barcode)
                ]);

                if (putawayError || productOutError) {
                    throw new Error('Database error fetching stock data.');
                }
                
                // Calculate current stock levels for each batch
                const stockMap = new Map<string, number>();

                putawayData.forEach(p => {
                    const key = createStockKey(entry.barcode, p.location, p.exp_date);
                    stockMap.set(key, (stockMap.get(key) || 0) + p.qty);
                });

                productOutData.forEach(p => {
                    if (REAL_STOCK_OUT_STATUSES.includes(p.status)) {
                        const key = createStockKey(entry.barcode, p.location, p.expdate);
                        stockMap.set(key, (stockMap.get(key) || 0) - p.qty);
                    }
                });

                const allAvailableBatches: BatchProduct[] = [];
                putawayData.forEach(p => {
                     const key = createStockKey(entry.barcode, p.location, p.exp_date);
                     const stock = stockMap.get(key) || 0;
                     if (stock > 0) {
                        // Check if this exact batch is already in the list to avoid duplicates
                        if (!allAvailableBatches.some(b => b.id === key)) {
                            allAvailableBatches.push({
                                id: key,
                                sku: p.sku,
                                barcode: entry.barcode,
                                brand: p.brand || '',
                                exp_date: p.exp_date,
                                location: p.location,
                                stock: stock,
                            });
                        }
                     }
                });
                
                // --- Cascading FEFO Logic ---
                const sortedBatches = allAvailableBatches.sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());
                
                const totalStockAvailable = sortedBatches.reduce((sum, batch) => sum + batch.stock, 0);

                if (totalStockAvailable < requestedQty) {
                    failedRows.push({ row: i + 2, reason: `Insufficient stock for barcode ${entry.barcode}. Required: ${requestedQty}, Available: ${totalStockAvailable}.` });
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
                failedRows.push({ row: i + 2, reason: `Error processing barcode ${entry.barcode}: ${processingError.message}` });
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
                details: `Bulk uploaded ${validDocsToInsert.length} product out documents via CSV.`,
            });
        }

        return NextResponse.json({
            message: 'Upload processed.',
            successfulUploads: validDocsToInsert.length,
            failedRows: failedRows,
        });

    } catch (error: any) {
        console.error('Batch upload error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
}
