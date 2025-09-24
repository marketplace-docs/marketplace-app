
'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanLine, Search, Package, Waypoints, ShoppingBasket } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { BatchProduct } from '@/types/batch-product';

type FoundOrder = {
    order_reference: string;
    sku: string;
    barcode: string;
    qty: number;
    location: string;
    waveId: number;
    wave_document_number: string;
}

export default function GoPickerPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [orderRef, setOrderRef] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [foundOrder, setFoundOrder] = useState<FoundOrder | null>(null);

    const handleSearchOrder = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan or enter an order reference.' });
            return;
        }
        
        setIsLoading(true);
        setFoundOrder(null);
        try {
            const wavesResponse = await fetch('/api/waves');
            if (!wavesResponse.ok) throw new Error('Could not fetch waves to find the order.');
            const waves = await wavesResponse.json();

            let targetWave;
            let orderInWave;

            for (const wave of waves) {
                // Only check waves that are in progress
                if (wave.status !== 'Wave Progress') continue;

                const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                if (!waveDetailsRes.ok) continue; // Skip if we can't get details

                const waveDetails = await waveDetailsRes.json();
                const found = waveDetails.orders.find((o: any) => o.order_reference === orderRef);
                
                if (found) {
                    targetWave = wave;
                    orderInWave = found;
                    break;
                }
            }

            if (!orderInWave || !targetWave) {
                toast({ variant: 'destructive', title: 'Not Found', description: `Order ${orderRef} not found in any active wave.` });
                setIsLoading(false);
                return;
            }
            
            // Find an available batch for the SKU to get location and barcode
            const allBatchesRes = await fetch(`/api/master-product/batch-products`);
            if (!allBatchesRes.ok) throw new Error('Failed to fetch product stock data.');
            const allBatches: BatchProduct[] = await allBatchesRes.json();

            // Simple FEFO: sort by exp_date and find the first batch with enough stock
            const availableBatch = allBatches
                .filter(b => b.sku === orderInWave.sku && b.stock > 0)
                .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime())
                [0];

            if (!availableBatch) {
                throw new Error(`No available stock batch found for SKU ${orderInWave.sku}. The order might be Out of Stock.`);
            }
            
            setFoundOrder({
                order_reference: orderInWave.order_reference,
                sku: orderInWave.sku,
                barcode: availableBatch.barcode,
                qty: orderInWave.qty,
                location: availableBatch.location,
                waveId: targetWave.id,
                wave_document_number: targetWave.wave_document_number,
            });

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    const handleConfirmPick = async () => {
        if (!foundOrder || !user) {
             toast({ variant: 'destructive', title: 'Error', description: 'No order loaded or user not logged in.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/waves/${foundOrder.waveId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Wave Done', user }),
            });

            if (!response.ok) {
                throw new Error('Failed to update wave status.');
            }
            
            toast({
                title: 'Pick Confirmed',
                description: `Order ${foundOrder.order_reference} picked. Wave ${foundOrder.wave_document_number} status updated to "Wave Done".`,
            });
            
            setFoundOrder(null);
            setOrderRef('');
            router.push('/admin-task/monitoring-orders');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Go-Picker</h1>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <ScanLine className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Scan Picking Order</CardTitle>
                        <CardDescription className="text-center">
                            Scan the order reference to see the item, quantity, and location to pick.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="orderRef" className="text-lg">#</Label>
                                <Input 
                                    id="orderRef" 
                                    name="orderRef" 
                                    placeholder="Scan or type order reference..." 
                                    value={orderRef} 
                                    onChange={(e) => setOrderRef(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                                    className="text-center text-xl h-12"
                                    disabled={isLoading || isSubmitting}
                                />
                            </div>
                            <Button onClick={handleSearchOrder} disabled={isLoading || isSubmitting || !orderRef} className="h-12">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Search
                            </Button>
                        </div>
                        
                        {foundOrder && (
                             <div className="space-y-4 pt-6 border-t-2 border-dashed">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pick Details for Order: {foundOrder.order_reference}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-lg">
                                        <div className="flex items-center gap-4">
                                            <Package className="h-6 w-6 text-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">SKU / Barcode</p>
                                                <p className="font-semibold">{foundOrder.sku} / {foundOrder.barcode}</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-4">
                                            <ShoppingBasket className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Quantity to Pick</p>
                                                <p className="font-semibold">{foundOrder.qty.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Waypoints className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Pick From Location</p>
                                                <p className="font-semibold">{foundOrder.location}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Button onClick={handleConfirmPick} className="w-full h-12 text-lg" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Pick
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
