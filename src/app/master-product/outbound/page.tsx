
'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageMinus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function OutboundPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scanData, setScanData] = useState({
        orderRef: '',
        productBarcode: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanData.orderRef || !scanData.productBarcode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan both order and product.' });
            return;
        }

        if (!user) {
             toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Find the wave that is "Wave Done" and contains the order reference
            const wavesResponse = await fetch('/api/waves');
            if (!wavesResponse.ok) throw new Error('Could not fetch waves.');
            const waves = await wavesResponse.json();
            
            const targetWave = waves.find((w: any) => w.status === 'Wave Done');

            if (!targetWave) {
                 toast({
                    variant: 'destructive',
                    title: 'No Wave Ready for Outbound',
                    description: 'Could not find a wave with status "Wave Done". Please complete picking first.',
                });
                setIsSubmitting(false);
                return;
            }
            
            // 2. Fetch the orders for that wave
            const waveDetailsResponse = await fetch(`/api/waves/${targetWave.id}`);
            if (!waveDetailsResponse.ok) throw new Error('Could not fetch wave details.');
            const waveDetails = await waveDetailsResponse.json();
            
            // 3. Find the specific order in the wave
            const orderToProcess = waveDetails.orders.find((o: any) => o.order_reference === scanData.orderRef);

            if (!orderToProcess) {
                toast({ variant: 'destructive', title: 'Order Not Found', description: `Order ${scanData.orderRef} not found in the active wave.` });
                setIsSubmitting(false);
                return;
            }
            
            // 4. Create the product_out document (goods issue)
            const issueDoc = {
                sku: orderToProcess.sku,
                barcode: scanData.productBarcode,
                qty: orderToProcess.qty,
                status: 'Issue - Order' as const,
                date: new Date().toISOString(),
                validatedby: user.name,
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
                title: 'Outbound Confirmed',
                description: `Order ${scanData.orderRef} processed. Stock has been deducted.`,
            });
            
            setScanData({ orderRef: '', productBarcode: '' });
            // Optionally, you might want to update the wave status to 'Outbound Complete' here
            // or navigate away. For now, we'll just clear the form.
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setScanData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Outbound Process</h1>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <PackageMinus className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Scan & Confirm Outbound</CardTitle>
                        <CardDescription className="text-center">
                            Scan the order and product to confirm it's leaving the warehouse. This will deduct the stock from the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="orderRef">Scan Order</Label>
                                <Input id="orderRef" name="orderRef" placeholder="Scan or type order reference..." value={scanData.orderRef} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productBarcode">Scan Product</Label>
                                <Input id="productBarcode" name="productBarcode" placeholder="Scan or type product barcode..." value={scanData.productBarcode} onChange={handleInputChange} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Outbound
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
