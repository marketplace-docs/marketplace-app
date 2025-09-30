
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

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
        const { data: documents, error } = await supabaseService
            .from('product_out_documents')
            .select('id, date, nodocument, sku, barcode, location, qty, status, validatedby')
            .order('date', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        const stockLog = documents.map((doc, index, allDocs) => {
            const previousDocs = allDocs.filter(d => 
                d.barcode === doc.barcode && 
                d.location === doc.location && 
                new Date(d.date) < new Date(doc.date)
            );

            const qty_before = previousDocs.reduce((acc, prevDoc) => {
                let change = 0;
                if (STOCK_IN_STATUSES.includes(prevDoc.status)) {
                    change = prevDoc.qty;
                } else if (STOCK_OUT_STATUSES.includes(prevDoc.status)) {
                    change = -prevDoc.qty;
                }
                return acc + change;
            }, 0);
            
            let qty_change = 0;
             if (STOCK_IN_STATUSES.includes(doc.status)) {
                qty_change = doc.qty;
            } else if (STOCK_OUT_STATUSES.includes(doc.status)) {
                qty_change = -doc.qty;
            }

            const qty_after = qty_before + qty_change;
            
            return {
                ...doc,
                type: qty_change > 0 ? 'IN' : 'OUT',
                qty_before,
                qty_change,
                qty_after
            };
        });

        return NextResponse.json(stockLog);

    } catch (err: any) {
        console.error('Stock Log API Error:', err);
        return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
