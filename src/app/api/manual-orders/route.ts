

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
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) {
            return NextResponse.json({ error: 'CSV is empty or has only a header.' }, { status: 400 });
        }

        const header = lines.shift()!.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const requiredHeaders = ['reference', 'sku', 'customer', 'city', 'type', 'from', 'delivery_type', 'qty'];
        if (!requiredHeaders.every(h => header.includes(h))) {
            return NextResponse.json({ error: `Invalid CSV headers. Required: ${requiredHeaders.join(', ')}` }, { status: 400 });
        }

        const ordersToInsert = lines.map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            
            const orderData: { [key: string]: string | number | undefined } = {};
            header.forEach((h, i) => {
                if (h === 'qty') {
                    const qty = parseInt(values[i], 10);
                    orderData[h] = isNaN(qty) ? undefined : qty;
                } else {
                    orderData[h] = values[i] || undefined;
                }
            });


            if (!orderData.reference || !orderData.sku || orderData.qty === undefined) {
                 console.warn(`Skipping row ${index + 2}: Missing reference, sku, or qty.`);
                return null;
            }
            
            return {
                reference: orderData.reference,
                sku: orderData.sku,
                order_date: new Date().toISOString(), // Automatically set order date
                customer: orderData.customer,
                city: orderData.city,
                type: orderData.type,
                from: orderData.from,
                delivery_type: orderData.delivery_type,
                qty: orderData.qty,
                // Status will be set by default in the database
            };
        }).filter((order): order is NonNullable<typeof order> => order !== null);


        if (ordersToInsert.length === 0) {
            return NextResponse.json({ error: 'No valid orders found in the file.' }, { status: 400 });
        }
        
        const { error } = await supabaseService
            .from('manual_orders')
            .insert(ordersToInsert);

        if (error) {
            console.error('Error inserting manual orders:', error);
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
