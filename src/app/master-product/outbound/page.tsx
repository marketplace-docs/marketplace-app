
'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageMinus, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { BatchProduct } from '@/types/batch-product';


type OrderToProcess = {
    order_reference: string;
    sku: string;
    barcode: string;
    qty: number;
    exp_date: string;
    location: string;
}

export default function OutboundPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderRef, setOrderRef] = useState('');
    const [foundOrder, setFoundOrder] = useState<OrderToProcess | null>(null);

    const handleSearchOrder = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan an order reference.' });
            return;
        }
        
        setIsLoading(true);
        setFoundOrder(null);

        try {
            const wavesResponse = await fetch('/api/waves');
            if (!wavesResponse.ok) throw new Error('Could not fetch waves.');
            const waves = await wavesResponse.json();
            
            let targetWave;
            let orderInWave;
            
            for (const wave of waves) {
                const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                const waveDetails = await waveDetailsRes.json();
                orderInWave = waveDetails.orders.find((o: any) => o.order_reference === orderRef);
                if (orderInWave) {
                    targetWave = wave;
                    break;
                }
            }

            if (!orderInWave || !targetWave) {
                 toast({ variant: 'destructive', title: 'Not Found', description: `Order ${orderRef} not found in any wave.` });
                setIsLoading(false);
                return;
            }
            if (targetWave.status !== 'Wave Done') {
                toast({ variant: 'destructive', title: 'Wave Not Ready', description: `Wave ${targetWave.wave_document_number} is not marked as "Wave Done". Please complete picking first.` });
                setIsLoading(false);
                return;
            }

            // Now find a batch for this SKU to get the exp_date and location
            const batchProductsRes = await fetch(`/api/master-product/batch-products`);
            if (!batchProductsRes.ok) throw new Error('Could not fetch batch product data.');
            const allBatches: BatchProduct[] = await batchProductsRes.json();

            // Find first available batch (FEFO logic would be more robust here)
            const availableBatch = allBatches.find(b => b.sku === orderInWave.sku && b.stock > 0);
            if (!availableBatch) {
                throw new Error(`No available stock batch found for SKU ${orderInWave.sku}.`);
            }

            setFoundOrder({
                order_reference: orderInWave.order_reference,
                sku: orderInWave.sku,
                barcode: availableBatch.barcode,
                qty: orderInWave.qty,
                exp_date: availableBatch.exp_date,
                location: availableBatch.location,
            });


        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPacking = async () => {
        if (!foundOrder || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'No order data loaded or user not logged in.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const issueDoc = {
                sku: foundOrder.sku,
                barcode: foundOrder.barcode,
                qty: foundOrder.qty,
                status: 'Issue - Order' as const,
                date: new Date().toISOString(),
                validatedby: user.name,
                expdate: foundOrder.exp_date,
                location: foundOrder.location,
            };

            const productOutResponse = await fetch('/api/product-out-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: [issueDoc], user }),
            });

            if (!productOutResponse.ok) {
                const errorData = await productOutResponse.json();
                throw new Error(errorData.error || 'Failed to create goods issue document.');
            }

            toast({
                title: 'Packing Confirmed',
                description: `Order ${foundOrder.order_reference} processed. Stock has been deducted.`,
            });
            
            // Reset state
            setOrderRef('');
            setFoundOrder(null);
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Packing Orders</h1>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <PackageMinus className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Packing Information Station</CardTitle>
                        <CardDescription className="text-center">
                            Scan the picked order to verify details and finalize for shipment. This action marks the order as complete and adjusts stock levels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-end gap-2">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="orderRef">Scan Order</Label>
                                    <Input id="orderRef" name="orderRef" placeholder="Scan or type order reference..." value={orderRef} onChange={e => setOrderRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchOrder()} disabled={isLoading}/>
                                </div>
                                <Button onClick={handleSearchOrder} disabled={isLoading || !orderRef}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Find Order
                                </Button>
                            </div>
                            
                            {foundOrder && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-medium text-muted-foreground">SKU</p>
                                            <p className="font-semibold">{foundOrder.sku}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Barcode</p>
                                            <p className="font-semibold">{foundOrder.barcode}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Quantity</p>
                                            <p className="font-semibold">{foundOrder.qty}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">From Location</p>
                                            <p className="font-semibold">{foundOrder.location}</p>
                                        </div>
                                    </div>

                                    <Button onClick={handleConfirmPacking} className="w-full" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm Packing
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
