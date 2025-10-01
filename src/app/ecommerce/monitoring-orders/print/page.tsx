
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
        const orderIds = searchParams.get('orderIds')?.split(',');

        if (!orderIds || orderIds.length === 0) {
            setLoading(false);
            return;
        }

        const fetchOrderData = async () => {
            try {
                const [wavesRes, allBatchesRes, allProductsRes] = await Promise.all([
                    fetch('/api/waves'),
                    fetch('/api/master-product/batch-products'),
                    fetch('/api/master-products'),
                ]);
                
                if (!wavesRes.ok) throw new Error('Failed to fetch waves.');
                if (!allBatchesRes.ok) throw new Error('Failed to fetch batch products.');
                if (!allProductsRes.ok) throw new Error('Failed to fetch master products.');

                const allWaves = await wavesRes.json();
                const allBatches: BatchProduct[] = await allBatchesRes.json();
                const allProducts: {sku: string, name: string}[] = await allProductsRes.json();
                
                const productMap = new Map(allProducts.map(p => [p.sku, p.name]));

                const ordersToPrint: WaveOrder[] = [];
                
                for (const wave of allWaves) {
                    const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                    if (!waveDetailsRes.ok) continue;
                    const waveDetails = await waveDetailsRes.json();

                    for (const order of waveDetails.orders) {
                        if (orderIds.includes(order.id.toString())) {
                            const availableBatch = allBatches.find(b => b.sku === order.sku && b.stock > 0);
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
                
                // Trigger print after a short delay to ensure rendering
                setTimeout(() => {
                    window.print();
                }, 500);


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
