'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ArrowRight, ShoppingCart, Package, Warehouse } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import type { BatchProduct } from '@/types/batch-product';

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    total_stock: number;
}

export default function TransferFromB2CPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [barcode, setBarcode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [foundProduct, setFoundProduct] = useState<AggregatedProduct | null>(null);
    const [destinationLocation, setDestinationLocation] = useState('');
    const [transferQty, setTransferQty] = useState('');

    const handleSearch = async () => {
        if (!barcode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a product barcode.' });
            return;
        }
        setIsLoading(true);
        setFoundProduct(null);
        try {
            const res = await fetch('/api/master-product/batch-products');
            if (!res.ok) throw new Error('Failed to fetch stock data.');
            const allBatches: BatchProduct[] = await res.json();
            
            const productBatches = allBatches.filter(b => b.barcode === barcode && b.stock > 0);

            if (productBatches.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found', description: `No available sellable stock found for barcode ${barcode}.` });
                setIsLoading(false);
                return;
            }

            const aggregated: AggregatedProduct = {
                sku: productBatches[0].sku,
                barcode: productBatches[0].barcode,
                brand: productBatches[0].brand,
                total_stock: productBatches.reduce((sum, b) => sum + b.stock, 0)
            };

            setFoundProduct(aggregated);
            toast({ title: 'Product Found', description: `Total B2C stock for ${aggregated.sku}: ${aggregated.total_stock.toLocaleString()}` });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmTransfer = async () => {
        const qty = parseInt(transferQty, 10);
        if (!foundProduct || !destinationLocation || isNaN(qty) || qty <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Details', description: 'Please fill all transfer details correctly.'});
            return;
        }
        if (qty > foundProduct.total_stock) {
             toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Transfer quantity (${qty}) exceeds total available stock (${foundProduct.total_stock}).`});
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                documents: [{
                    barcode: foundProduct.barcode,
                    qty: qty,
                    status: 'Issue - Internal Transfer out B2C',
                }],
                user
            };
            
            const response = await fetch('/api/product-out-documents/batch-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create B2C transfer document.');
            }

            toast({ title: 'Transfer Submitted', description: `${qty} units of ${foundProduct.sku} will be moved from B2C stock to ${destinationLocation}.`});
            resetForm();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Transfer Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setBarcode('');
        setFoundProduct(null);
        setDestinationLocation('');
        setTransferQty('');
        setIsSubmitting(false);
    };

    return (
        <MainLayout>
            <h1 className="text-2xl font-bold mb-6">Transfer From B2C</h1>
             <Card>
                <CardHeader>
                    <CardTitle>B2C Stock Transfer</CardTitle>
                    <CardDescription>Move stock from general B2C (sellable) inventory to a specific location (e.g., for B2B or other purposes).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="barcode"><Package className="inline-block h-4 w-4 mr-2" />Product Barcode</Label>
                        <div className="flex items-end gap-2">
                            <Input id="barcode" placeholder="Scan or enter barcode" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} disabled={isLoading}/>
                             <Button onClick={handleSearch} disabled={isLoading || !barcode}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                Find Product
                            </Button>
                        </div>
                    </div>

                    {foundProduct && (
                        <div className="space-y-6 pt-6 border-t">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-sm font-medium text-muted-foreground">SKU / Brand</p>
                                        <p className="font-semibold">{foundProduct.sku} / {foundProduct.brand}</p>
                                     </div>
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Available B2C Stock</p>
                                        <p><Badge variant="default" className="text-base">{foundProduct.total_stock.toLocaleString()}</Badge></p>
                                     </div>
                                </CardContent>
                            </Card>
                            
                             <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
                                <div className="p-3 bg-background rounded-full"><ShoppingCart className="h-5 w-5 text-primary" /></div>
                                <p className="font-semibold text-lg text-primary">From: B2C Sellable Stock</p>
                                <div className="flex-grow text-center"><ArrowRight className="h-6 w-6 text-muted-foreground" /></div>
                                <div className="p-3 bg-background rounded-full"><Warehouse className="h-5 w-5 text-primary" /></div>
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="destinationLocation">To: Destination Location</Label>
                                    <Input id="destinationLocation" placeholder="Scan or enter destination" value={destinationLocation} onChange={e => setDestinationLocation(e.target.value)} disabled={isSubmitting}/>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="transferQty">Quantity to Transfer</Label>
                                <Input id="transferQty" type="number" placeholder="Enter quantity" value={transferQty} onChange={e => setTransferQty(e.target.value)} disabled={isSubmitting}/>
                                <p className="text-xs text-muted-foreground">The system will automatically pick from the oldest stock first (FEFO).</p>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t">
                                <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
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
