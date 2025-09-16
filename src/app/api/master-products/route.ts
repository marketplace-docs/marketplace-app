'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function GET() {
  const { data, error } = await supabaseService
    .from('master_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching master products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userJson = formData.get('user') as string | null;

    if (!userJson) {
        return NextResponse.json({ error: 'User data is missing.' }, { status: 400 });
    }
     const user = JSON.parse(userJson);

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        return NextResponse.json({ error: 'CSV is empty or has only a header.' }, { status: 400 });
    }

    const header = lines.shift()!.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredHeaders = ['sku', 'barcode', 'brand'];
    if (!requiredHeaders.every(h => header.includes(h))) {
        return NextResponse.json({ error: `Invalid CSV headers. Required: ${requiredHeaders.join(', ')}` }, { status: 400 });
    }
    
    const skuIndex = header.indexOf('sku');
    const barcodeIndex = header.indexOf('barcode');
    const brandIndex = header.indexOf('brand');

    let successCount = 0;
    const errors: { row: number, line: string, error: string }[] = [];

    const productsToInsert = lines.map((line, index) => {
        const values = line.split(',');
        const sku = values[skuIndex]?.trim().replace(/"/g, '');
        const barcode = values[barcodeIndex]?.trim().replace(/"/g, '');
        const brand = values[brandIndex]?.trim().replace(/"/g, '');
        
        if (!sku || !barcode || !brand) {
            errors.push({ row: index + 2, line, error: 'Missing required fields (sku, barcode, or brand).' });
            return null;
        }

        return { sku, barcode, brand };
    }).filter((p): p is { sku: string, barcode: string, brand: string } => p !== null);

    if (productsToInsert.length > 0) {
        const { error: insertError } = await supabaseService
            .from('master_products')
            .upsert(productsToInsert, { onConflict: 'sku', ignoreDuplicates: false });

        if (insertError) {
             console.error('Supabase bulk insert error:', insertError);
            return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 });
        }
        successCount = productsToInsert.length;
    }
    
    if (successCount > 0) {
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'BULK_UPLOAD',
            details: `Uploaded ${successCount} master products.`,
        });
    }

    return NextResponse.json({
        message: 'CSV processed.',
        successCount,
        errorCount: errors.length,
        errors,
    });
}
