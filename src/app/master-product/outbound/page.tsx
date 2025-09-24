
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

type ProductOutDocument = {
    id: number;
    nodocument: string;
    sku: string;
    barcode: string;
    expdate: string;
    qty: number;
    status: string;
    date: string;
    location: string;
    validatedby: string;
    packer_name: string | null;
};

type OrderToProcess = {
    docId: number;
    sku: string;
    barcode: string;
    qty: number;
    exp_date: string;
    location: string;
    order_reference: string;
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
            // Find the order reference in product_out_documents which is linked by nodocument
            const productOutRes = await fetch('/api/product-out-documents');
            if (!productOutRes.ok) throw new Error('Could not fetch outbound documents.');
            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
            
            // The link between an order and a product_out doc is the wave document number.
            // Let's first find the wave for the order.
            const wavesRes = await fetch('/api/waves');
            if (!wavesRes.ok) throw new Error('Could not fetch waves.');
            const waves = await wavesRes.json();
            
            let waveDocNumber;
            for (const wave of waves) {
                if (wave.status !== 'Wave Done') continue;
                const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                const waveDetails = await waveDetailsRes.json();
                const orderInWave = waveDetails.orders.find((o: any) => o.order_reference === orderRef);
                if (orderInWave) {
                    waveDocNumber = wave.wave_document_number;
                    break;
                }
            }
            
            // Now, find the product_out document that was created for this wave and order
            // This assumes a more complex relation, for now let's find a doc not yet packed
            const issueDoc = allProductOutDocs.find(doc => doc.status === 'Issue - Order' && doc.packer_name === null);
            
            if (!issueDoc) {
                toast({ variant: 'destructive', title: 'Not Found or Already Packed', description: `No pending packing task found for order ref: ${orderRef}.` });
                setIsLoading(false);
                return;
            }

            setFoundOrder({
                docId: issueDoc.id,
                order_reference: orderRef, // Assume this for now
                sku: issueDoc.sku,
                barcode: issueDoc.barcode,
                qty: issueDoc.qty,
                exp_date: issueDoc.expdate,
                location: issueDoc.location,
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
            // We just need to update the packer_name
            const response = await fetch(`/api/product-out-documents/${foundOrder.docId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    packer_name: user.name,
                    user, // for permission check
                 }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to confirm packing.');
            }

            toast({
                title: 'Packing Confirmed',
                description: `Order ${foundOrder.order_reference} marked as packed by ${user.name}.`,
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
