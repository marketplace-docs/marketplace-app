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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type TransferStep = 'findProduct' | 'selectSource' | 'specifyDetails';

export default function TransferFromWarehousePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [step, setStep] = useState<TransferStep>('findProduct');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [barcode, setBarcode] = useState('');
    const [foundBatches, setFoundBatches] = useState<BatchProduct[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<BatchProduct | null>(null);

    const [destinationLocation, setDestinationLocation] = useState('');
    const [transferQty, setTransferQty] = useState('');

    const handleSearch = async () => {
        if (!barcode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a product barcode.' });
            return;
        }
        setIsLoading(true);
        setFoundBatches([]);
        try {
            const res = await fetch('/api/master-product/batch-products');
            if (!res.ok) throw new Error('Failed to fetch stock data.');
            const allBatches: BatchProduct[] = await res.json();
            
            const batches = allBatches.filter(b => 
                b.barcode === barcode && b.stock > 0
            );

            if (batches.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found', description: `No available stock for barcode ${barcode} found in any location.` });
                setIsLoading(false);
                return;
            }

            setFoundBatches(batches);
            setStep('selectSource');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectBatch = (batch: BatchProduct) => {
        setSelectedBatch(batch);
        setStep('specifyDetails');
    };


    const handleConfirmTransfer = async () => {
        const qty = parseInt(transferQty, 10);
        if (!selectedBatch || !destinationLocation || isNaN(qty) || qty <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Details', description: 'Please fill all transfer details correctly.'});
            return;
        }
        if (qty > selectedBatch.stock) {
             toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Transfer quantity (${qty}) exceeds available stock (${selectedBatch.stock}).`});
            return;
        }
        if (destinationLocation.toLowerCase() === selectedBatch.location.toLowerCase()) {
             toast({ variant: 'destructive', title: 'Invalid Location', description: `Destination location cannot be the same as the source location.`});
            return;
        }

        setIsSubmitting(true);
        try {
            const transferDocuments = [
                // Document for stock out from source
                {
                    sku: selectedBatch.sku,
                    barcode: selectedBatch.barcode,
                    location: selectedBatch.location,
                    expdate: selectedBatch.exp_date,
                    qty: qty,
                    status: 'Issue - Internal Transfer Out From Warehouse' as const,
                    date: new Date().toISOString(),
                    validatedby: user!.name,
                },
                // Document for stock in to destination
                {
                    sku: selectedBatch.sku,
                    barcode: selectedBatch.barcode,
                    location: destinationLocation,
                    expdate: selectedBatch.exp_date,
                    qty: qty,
                    status: 'Receipt - Internal Transfer In to Warehouse' as const,
                    date: new Date().toISOString(),
                    validatedby: user!.name,
                }
            ];

            const response = await fetch('/api/product-out-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: transferDocuments, user }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process transfer.');
            }

            toast({ title: 'Transfer Successful', description: `${qty} units of ${selectedBatch.sku} moved from ${selectedBatch.location} to ${destinationLocation}.`});
            resetForm();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Transfer Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setBarcode('');
        setFoundBatches([]);
        setSelectedBatch(null);
        setDestinationLocation('');
        setTransferQty('');
        setStep('findProduct');
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
                    {/* Step 1: Find Product */}
                    {step === 'findProduct' && (
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="barcode"><Package className="inline-block h-4 w-4 mr-2" />Product Barcode</Label>
                                <Input id="barcode" placeholder="Scan or enter barcode" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} disabled={isLoading}/>
                            </div>
                             <div className="text-right">
                                <Button onClick={handleSearch} disabled={isLoading || !barcode}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                    Find Product
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 2: Select Source Batch */}
                    {step === 'selectSource' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Select Source Location for <span className="text-primary">{foundBatches[0].name}</span></h3>
                             <div className="border rounded-lg max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Exp Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {foundBatches.map(batch => (
                                            <TableRow key={batch.id}>
                                                <TableCell className="font-medium">{batch.location}</TableCell>
                                                <TableCell><Badge variant="secondary">{batch.stock}</Badge></TableCell>
                                                <TableCell>{format(new Date(batch.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleSelectBatch(batch)}>Select</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button variant="outline" onClick={resetForm}>Back</Button>
                        </div>
                    )}


                    {/* Step 3: Specify Details */}
                    {step === 'specifyDetails' && selectedBatch && (
                        <div className="space-y-6">
                            <Card className="bg-green-50 border-green-200">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                     <CheckCircle className="h-6 w-6 text-green-600"/>
                                    <div>
                                        <CardTitle className="text-lg">Source Location Selected</CardTitle>
                                        <CardDescription className="text-green-700">Ready to transfer.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-3 gap-4 text-sm p-4 pt-0">
                                    <div><p className="font-medium text-muted-foreground">SKU</p><p className="font-semibold">{selectedBatch.sku}</p></div>
                                    <div><p className="font-medium text-muted-foreground">From Location</p><p className="font-semibold">{selectedBatch.location}</p></div>
                                    <div><p className="font-medium text-muted-foreground">Available Stock</p><p className="font-semibold">{selectedBatch.stock.toLocaleString()}</p></div>
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
