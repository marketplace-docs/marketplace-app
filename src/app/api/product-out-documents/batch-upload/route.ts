
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

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

type AggregatedProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

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

            const qty = parseInt(entry.qty, 10);

            if (!entry.barcode || isNaN(qty) || !entry.status) {
                failedRows.push({ row: i + 2, reason: 'Missing required data (barcode, qty, or status).' });
                continue;
            }

            try {
                // Fetch available batches for the barcode
                const { data: batches, error: batchError } = await supabaseService
                    .from('putaway_documents')
                    .select('sku, exp_date, location, qty')
                    .eq('barcode', entry.barcode);

                if (batchError) throw batchError;

                const { data: outBatches } = await supabaseService
                    .from('product_out_documents')
                    .select('location, expdate, qty')
                    .eq('barcode', entry.barcode);
                
                const stockMap = new Map<string, number>();
                batches.forEach(b => {
                    const key = `${b.location}|${b.exp_date}`;
                    stockMap.set(key, (stockMap.get(key) || 0) + b.qty);
                });

                outBatches?.forEach(ob => {
                    const key = `${ob.location}|${ob.expdate}`;
                    stockMap.set(key, (stockMap.get(key) || 0) - ob.qty);
                });

                const availableBatches: AggregatedProduct[] = Array.from(stockMap.entries())
                    .map(([key, stock]) => {
                        const [location, exp_date] = key.split('|');
                        const batchInfo = batches.find(b => b.location === location && b.exp_date === exp_date);
                        return {
                            id: key,
                            sku: batchInfo?.sku || '',
                            barcode: entry.barcode,
                            brand: '',
                            exp_date,
                            location,
                            stock,
                        };
                    })
                    .filter(b => b.stock > 0)
                    .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());
                
                if (availableBatches.length === 0) {
                    failedRows.push({ row: i + 2, reason: `No available stock for barcode ${entry.barcode}.` });
                    continue;
                }

                const bestBatch = availableBatches[0];
                if (qty > bestBatch.stock) {
                    failedRows.push({ row: i + 2, reason: `Qty ${qty} exceeds stock ${bestBatch.stock} for barcode ${entry.barcode}.` });
                    continue;
                }

                const docNumber = await generateNewDocumentNumber(entry.status as ProductOutStatus);
                validDocsToInsert.push({
                    nodocument: docNumber,
                    sku: bestBatch.sku,
                    barcode: entry.barcode,
                    expdate: bestBatch.exp_date,
                    location: bestBatch.location,
                    qty,
                    status: entry.status as ProductOutStatus,
                    date: new Date().toISOString(),
                    validatedby: user.name,
                });

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
