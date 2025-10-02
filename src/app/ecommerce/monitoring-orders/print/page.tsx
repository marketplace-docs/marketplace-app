
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PickLabel } from '@/components/pick-label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BatchProduct } from '@/types/batch-product';

type WaveOrder = {
    id: number;
    order_reference: string;
    sku: string;
    name: string;
    barcode: string;
    exp_date: string;
    qty: number;
    from: string;
    location: string;
    customer_name: string;
    customer_address: string;
};

function PrintPageContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [orders, setOrders] = useState<WaveOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const orderIdsParam = searchParams.get('orderIds');
        const waveIdParam = searchParams.get('waveId');

        if (!orderIdsParam && !waveIdParam) {
            setLoading(false);
            return;
        }

        const fetchOrderData = async () => {
            try {
                const [allWaves, allBatches, allProducts] = await Promise.all([
                    fetch('/api/waves').then(res => res.json()),
                    fetch('/api/master-product/batch-products').then(res => res.json()),
                    fetch('/api/master-products').then(res => res.json()),
                ]);

                const productMap = new Map(allProducts.map((p: any) => [p.sku, p.name]));
                let orderIds: string[] = [];

                if (waveIdParam) {
                    // Fetch all order IDs from the wave
                    const waveDetailsRes = await fetch(`/api/waves/${waveIdParam}`);
                    if (!waveDetailsRes.ok) throw new Error(`Could not fetch details for wave ${waveIdParam}.`);
                    const waveDetails = await waveDetailsRes.json();
                    orderIds = waveDetails.orders.map((o: any) => o.id.toString());
                } else if (orderIdsParam) {
                    orderIds = orderIdsParam.split(',');
                }

                if (orderIds.length === 0) {
                    setOrders([]);
                    setLoading(false);
                    return;
                }
                
                const ordersToPrint: WaveOrder[] = [];
                
                for (const wave of allWaves) {
                    const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                    if (!waveDetailsRes.ok) continue;
                    const waveDetails = await waveDetailsRes.json();

                    for (const order of waveDetails.orders) {
                        if (orderIds.includes(order.id.toString())) {
                            const availableBatch = allBatches.find((b: BatchProduct) => b.sku === order.sku && b.stock > 0);
                             ordersToPrint.push({
                                id: order.id,
                                order_reference: order.order_reference,
                                sku: order.sku,
                                name: productMap.get(order.sku) || 'Unknown Product',
                                barcode: availableBatch ? availableBatch.barcode : 'N/A',
                                exp_date: availableBatch ? availableBatch.exp_date : new Date().toISOString(),
                                qty: order.qty,
                                from: order.from,
                                location: availableBatch ? availableBatch.location : 'N/A',
                                customer_name: order.customer,
                                customer_address: order.address,
                            });
                        }
                    }
                }
                
                setOrders(ordersToPrint);
                setLoading(false);
                
                if (ordersToPrint.length > 0) {
                     setTimeout(() => {
                        window.print();
                    }, 500);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'No Orders Found',
                        description: 'Could not find any orders matching the provided IDs.'
                    });
                }


            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error loading print data',
                    description: error.message
                });
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [searchParams, toast]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (orders.length === 0) {
        return <div className="flex h-screen w-full items-center justify-center"><p>No orders to print.</p></div>;
    }

    return (
        <div className="print-container">
            {orders.map(order => (
                <div key={order.id} className="label-container" style={{ pageBreakAfter: 'always' }}>
                    <PickLabel order={order} />
                </div>
            ))}
             <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .label-container:last-child {
                        page-break-after: auto;
                    }
                }
                @page {
                    size: A4;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}

export default function PrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrintPageContent />
        </Suspense>
    );
}
