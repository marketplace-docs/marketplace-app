'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Warehouse, Package, ArrowRight, CheckCircle, MoveRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { BatchProduct } from '@/types/batch-product';

type TransferStep = 'findSource' | 'specifyDetails';

export default function TransferFromWarehousePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [step, setStep] = useState<TransferStep>('findSource');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [sourceLocation, setSourceLocation] = useState('');
    const [barcode, setBarcode] = useState('');
    const [foundBatch, setFoundBatch] = useState<BatchProduct | null>(null);

    const [destinationLocation, setDestinationLocation] = useState('');
    const [transferQty, setTransferQty] = useState('');

    const handleSearch = async () => {
        if (!sourceLocation || !barcode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide both source location and product barcode.' });
            return;
        }
        setIsLoading(true);
        setFoundBatch(null);
        try {
            const res = await fetch('/api/master-product/batch-products');
            if (!res.ok) throw new Error('Failed to fetch stock data.');
            const allBatches: BatchProduct[] = await res.json();
            
            const batch = allBatches.find(b => 
                b.location.toLowerCase() === sourceLocation.toLowerCase() && 
                b.barcode === barcode
            );

            if (!batch || batch.stock <= 0) {
                toast({ variant: 'destructive', title: 'Not Found', description: `No stock for barcode ${barcode} found at location ${sourceLocation}.` });
                return;
            }

            setFoundBatch(batch);
            setStep('specifyDetails');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmTransfer = async () => {
        const qty = parseInt(transferQty, 10);
        if (!foundBatch || !destinationLocation || isNaN(qty) || qty <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Details', description: 'Please fill all transfer details correctly.'});
            return;
        }
        if (qty > foundBatch.stock) {
             toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Transfer quantity (${qty}) exceeds available stock (${foundBatch.stock}).`});
            return;
        }
        if (destinationLocation.toLowerCase() === foundBatch.location.toLowerCase()) {
             toast({ variant: 'destructive', title: 'Invalid Location', description: `Destination location cannot be the same as the source location.`});
            return;
        }

        setIsSubmitting(true);
        // TODO: Implement API call to create product_out_documents
        // One 'Issue - Internal Transfer' and one 'Receipt - Internal Transfer' (or similar)
        console.log({
            from: foundBatch.location,
            to: destinationLocation,
            qty,
            product: foundBatch,
            user,
        });

        setTimeout(() => {
            toast({ title: 'Transfer Submitted', description: `${qty} units of ${foundBatch.sku} are being moved from ${foundBatch.location} to ${destinationLocation}.`});
            resetForm();
        }, 1500);
    };

    const resetForm = () => {
        setSourceLocation('');
        setBarcode('');
        setFoundBatch(null);
        setDestinationLocation('');
        setTransferQty('');
        setStep('findSource');
        setIsSubmitting(false);
    };

    return (
        <MainLayout>
            <h1 className="text-2xl font-bold mb-6">Transfer From Warehouse</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Create Internal Transfer</CardTitle>
                    <CardDescription>Move stock from one warehouse location to another.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Find Source */}
                    {step === 'findSource' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="sourceLocation"><Warehouse className="inline-block h-4 w-4 mr-2" />Source Location</Label>
                                    <Input id="sourceLocation" placeholder="Scan or enter location" value={sourceLocation} onChange={e => setSourceLocation(e.target.value)} disabled={isLoading}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="barcode"><Package className="inline-block h-4 w-4 mr-2" />Product Barcode</Label>
                                    <Input id="barcode" placeholder="Scan or enter barcode" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} disabled={isLoading}/>
                                </div>
                            </div>
                             <div className="text-right">
                                <Button onClick={handleSearch} disabled={isLoading || !sourceLocation || !barcode}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                    Find Stock
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Specify Details */}
                    {step === 'specifyDetails' && foundBatch && (
                        <div className="space-y-6">
                            <Card className="bg-green-50 border-green-200">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                     <CheckCircle className="h-6 w-6 text-green-600"/>
                                    <div>
                                        <CardTitle className="text-lg">Stock Found</CardTitle>
                                        <CardDescription className="text-green-700">Ready to transfer.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4 text-sm p-4 pt-0">
                                    <div><p className="font-medium text-muted-foreground">SKU</p><p className="font-semibold">{foundBatch.sku}</p></div>
                                    <div><p className="font-medium text-muted-foreground">Location</p><p className="font-semibold">{foundBatch.location}</p></div>
                                    <div><p className="font-medium text-muted-foreground">Available Stock</p><p className="font-semibold">{foundBatch.stock.toLocaleString()}</p></div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center gap-4">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="destinationLocation"><MoveRight className="inline-block h-4 w-4 mr-2" />Destination Location</Label>
                                    <Input id="destinationLocation" placeholder="Scan or enter destination" value={destinationLocation} onChange={e => setDestinationLocation(e.target.value)} disabled={isSubmitting}/>
                                </div>
                                <div className="space-y-2 w-48">
                                    <Label htmlFor="transferQty">Quantity to Transfer</Label>
                                    <Input id="transferQty" type="number" placeholder="QTY" value={transferQty} onChange={e => setTransferQty(e.target.value)} disabled={isSubmitting}/>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t">
                                <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Start Over</Button>
                                <Button onClick={handleConfirmTransfer} disabled={isSubmitting}>
                                     {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4"/>}
                                    Confirm Transfer
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </MainLayout>
    );
}
