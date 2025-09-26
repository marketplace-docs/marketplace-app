

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseService
    .from('manual_orders')
    .select('*');

  if (status) {
      query = query.eq('status', status);
  } else {
      // Default behavior: only get orders that are not 'Out of Stock'
      query = query.neq('status', 'Out of Stock');
  }
  
  query = query.order('order_date', { ascending: false });

  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ensure all orders have a numeric ID
    const processedData = data.map(order => ({
        ...order,
        id: Number(order.id) 
    }));


  return NextResponse.json(processedData);
}


export async function POST(request: Request) {
    const contentType = request.headers.get('content-type');

    // Handle JSON body for single/manual add
    if (contentType && contentType.includes('application/json')) {
      const { ordersToInsert, user } = await request.json();
        if (!user) {
          return NextResponse.json({ error: 'User data is missing.' }, { status: 400 });
        }
        const { data, error } = await supabaseService
            .from('manual_orders')
            .insert(ordersToInsert)
            .select('id');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'CREATE_MANUAL_ORDER',
            details: `Created manual order: ${ordersToInsert[0].reference}`,
        });
        
        return NextResponse.json({ message: 'Order created', data }, { status: 201 });
    }
    
    // Handle FormData for bulk upload from CSV
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userJson = formData.get('user') as string | null;

    if (!userJson) {
        return NextResponse.json({ error: 'User data is missing.' }, { status: 400 });
    }
    const user = JSON.parse(userJson);

    if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    
    if (!user?.role) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    try {
        // 1. Fetch all marketplace stores to create a lookup map
        const { data: stores, error: storesError } = await supabaseService
            .from('marketplace_stores')
            .select('store_name, platform');

        if (storesError) {
            throw new Error('Could not fetch marketplace stores to validate orders.');
        }

        const storeMap = new Map(stores.map(s => [s.store_name.toLowerCase(), s.platform]));

        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) {
            return NextResponse.json({ error: 'CSV is empty or has only a header.' }, { status: 400 });
        }

        const headerLine = lines.shift();
        if (!headerLine) {
             return NextResponse.json({ error: 'CSV header not found.' }, { status: 400 });
        }
        const header = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

        // 'type' and 'from' are no longer required from CSV, but 'store_name' is now essential.
        const requiredHeaders = ['reference', 'sku', 'qty', 'store_name'];
        if (!requiredHeaders.every(h => header.includes(h))) {
            return NextResponse.json({ error: `Invalid CSV headers. Required headers include: ${requiredHeaders.join(', ')}` }, { status: 400 });
        }
        
        const referenceIndex = header.indexOf('reference');
        const skuIndex = header.indexOf('sku');
        const qtyIndex = header.indexOf('qty');
        const storeNameIndex = header.indexOf('store_name'); // new essential index
        const addressIndex = header.indexOf('address');
        const phoneIndex = header.indexOf('phone');


        const ordersToInsert = lines.map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            
            const reference = values[referenceIndex];
            const sku = values[skuIndex];
            const qty = parseInt(values[qtyIndex], 10);
            const store_name = values[storeNameIndex];

            if (!reference || !sku || isNaN(qty) || !store_name) {
                console.warn(`Skipping row ${index + 2}: Missing or invalid required fields (reference, sku, qty, store_name).`);
                return null;
            }
            
            const storePlatform = storeMap.get(store_name.toLowerCase());
            if (!storePlatform) {
                console.warn(`Skipping row ${index + 2}: Store name "${store_name}" not found in marketplace stores.`);
                return null;
            }
            
            return {
                reference,
                sku,
                qty,
                order_date: new Date().toISOString(),
                customer: "Edit By Sociolla",
                city: "Tangerang",
                address: values[addressIndex] || 'Jln. Testing Order, No.Blok A 92, 28, Tangerang Selatan, 15677',
                phone: values[phoneIndex] || '08956103267566',
                type: storePlatform, // Auto-filled from marketplace_stores.platform
                from: store_name,     // Auto-filled from CSV store_name
                delivery_type: "Regular",
                status: 'Payment Accepted', // Default status
            };
        }).filter((order): order is NonNullable<typeof order> => order !== null);


        if (ordersToInsert.length === 0) {
            return NextResponse.json({ error: 'No valid orders found in the file. Check for missing fields or invalid store names.' }, { status: 400 });
        }
        
        const { error } = await supabaseService
            .from('manual_orders')
            .insert(ordersToInsert);

        if (error) {
            console.error('Error inserting manual orders:', error);
            // Provide a more specific error message if possible
            if (error.code === '23505') { // unique_violation
                 throw new Error(`Database error: One or more order references already exist.`);
            }
            throw new Error(`Database error: ${error.message}`);
        }

        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'UPLOAD_MANUAL_ORDERS',
            details: `Uploaded ${ordersToInsert.length} manual orders.`,
        });

        return NextResponse.json({ message: 'Upload successful', successCount: ordersToInsert.length }, { status: 201 });

    } catch (error: any) {
        console.error("Manual order upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
