
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { parse } from 'date-fns';

export async function GET() {
  const { data, error } = await supabaseService
    .from('manual_orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}


export async function POST(request: Request) {
    const body = await request.json().catch(() => null);

    // Handle single manual order from dialog
    if (body && body.ordersToInsert) {
      const { ordersToInsert, user } = body;
        if (!user) {
          return NextResponse.json({ error: 'User data is missing.' }, { status: 400 });
        }
        const { data, error } = await supabaseService
            .from('manual_orders')
            .insert(ordersToInsert)
            .select();

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
    
    // Handle bulk upload from CSV
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
        const requiredHeaders = ['reference', 'sku', 'order_date', 'customer', 'city', 'type', 'from', 'delivery_type', 'qty'];
        if (!requiredHeaders.every(h => header.includes(h))) {
            return NextResponse.json({ error: `Invalid CSV headers. Required: ${requiredHeaders.join(', ')}` }, { status: 400 });
        }

        const ordersToInsert = lines.map((line, index) => {
            const values = line.split(',');
            const orderData: { [key: string]: string } = {};
            header.forEach((h, i) => orderData[h] = values[i]?.trim().replace(/"/g, '') || '');

            const parsedDate = parse(orderData.order_date, 'yyyy-MM-dd HH:mm:ss', new Date());

            if (!orderData.reference || !orderData.qty || !orderData.sku) {
                 console.warn(`Skipping row ${index + 2}: Missing reference, sku, or qty.`);
                return null;
            }
            
            return {
                reference: orderData.reference,
                sku: orderData.sku,
                order_date: parsedDate.toISOString(),
                customer: orderData.customer,
                city: orderData.city,
                type: orderData.type,
                from: orderData.from,
                delivery_type: orderData.delivery_type,
                qty: parseInt(orderData.qty, 10),
            };
        }).filter((order): order is NonNullable<typeof order> => order !== null && !isNaN(order.qty));


        if (ordersToInsert.length === 0) {
            return NextResponse.json({ error: 'No valid orders found in the file.' }, { status: 400 });
        }
        
        const { data, error } = await supabaseService
            .from('manual_orders')
            .insert(ordersToInsert)
            .select();

        if (error) {
            throw new Error(error.message);
        }

        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'UPLOAD_MANUAL_ORDERS',
            details: `Uploaded ${ordersToInsert.length} manual orders.`,
        });

        return NextResponse.json({ message: 'Upload successful', successCount: ordersToInsert.length, data }, { status: 201 });

    } catch (error: any) {
        console.error("Manual order upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
