
'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanLine } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function GoPickerPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scanData, setScanData] = useState({
        orderRef: '',
        location: '',
        productBarcode: '',
        quantity: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanData.orderRef || !scanData.location || !scanData.productBarcode || !scanData.quantity) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
            return;
        }

        if (!user) {
             toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        setIsSubmitting(true);

        try {
            // In a real scenario, you would find the wave associated with this order reference.
            // This requires an API endpoint to search waves by order reference.
            // For now, we will simulate this by assuming we know the wave ID.
            
            // This is a placeholder. You'd need a way to get the real waveId.
            // For example: const waveId = await findWaveIdForOrder(scanData.orderRef);
            // Let's find a wave that's in progress to update it.
            const wavesResponse = await fetch('/api/waves');
            if (!wavesResponse.ok) throw new Error('Could not fetch waves to find a target.');
            const waves = await wavesResponse.json();
            const waveToUpdate = waves.find((w: any) => w.status === 'Wave Progress');
            
            if (!waveToUpdate) {
                toast({
                    variant: 'destructive',
                    title: 'No Wave to Update',
                    description: 'Could not find a wave in "Progress" status to update. Please start a new wave.',
                });
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`/api/waves/${waveToUpdate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Wave Done', user }),
            });

            if (!response.ok) {
                throw new Error('Failed to update wave status.');
            }
            
            toast({
                title: 'Pick Confirmed',
                description: `Order pick confirmed. Wave ${waveToUpdate.wave_document_number} status updated to "Wave Done".`,
            });
            
            setScanData({ orderRef: '', location: '', productBarcode: '', quantity: '' });
            router.push('/admin-task/monitoring-orders');

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
                <h1 className="text-2xl font-bold">Go-Picker</h1>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <ScanLine className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Scan & Pick</CardTitle>
                        <CardDescription className="text-center">
                            Scan the order, location, product, and enter the quantity to complete the picking process.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="orderRef">Scan Order</Label>
                                <Input id="orderRef" name="orderRef" placeholder="Scan or type order reference..." value={scanData.orderRef} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Scan Location</Label>
                                <Input id="location" name="location" placeholder="Scan or type location..." value={scanData.location} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productBarcode">Scan Product</Label>
                                <Input id="productBarcode" name="productBarcode" placeholder="Scan or type product barcode..." value={scanData.productBarcode} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Scan Quantity</Label>
                                <Input id="quantity" name="quantity" type="number" placeholder="Enter picked quantity..." value={scanData.quantity} onChange={handleInputChange} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Pick
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
