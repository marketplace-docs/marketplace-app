

'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageCheck, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ProductOutDocument } from '@/types/product-out-document';
import { format } from 'date-fns';

type OrderToProcess = {
    docIds: number[];
    sku: string;
    barcode: string;
    qty: number;
    exp_date: string;
    locations: string[];
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
            const productOutRes = await fetch('/api/product-out-documents');
            if (!productOutRes.ok) throw new Error('Could not fetch outbound documents.');
            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
            
            // Find all 'Issue - Order' documents for this reference that have not been packed yet
            const issueDocs = allProductOutDocs.filter(
                doc => doc.status === 'Issue - Order' && 
                       doc.packer_name === null &&
                       doc.order_reference === orderRef
            );
            
            if (issueDocs.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found or Already Packed', description: `No pending packing task found for order ref: ${orderRef}.` });
                setIsLoading(false);
                return;
            }
            
            // Aggregate data from all found documents
            const aggregatedOrder: OrderToProcess = issueDocs.reduce((acc, doc) => {
                acc.docIds.push(doc.id);
                acc.qty += doc.qty;
                if (!acc.locations.includes(doc.location)) {
                    acc.locations.push(doc.location);
                }
                return acc;
            }, {
                docIds: [] as number[],
                order_reference: issueDocs[0].order_reference || orderRef,
                sku: issueDocs[0].sku,
                barcode: issueDocs[0].barcode,
                qty: 0,
                exp_date: issueDocs[0].expdate, // Assume same exp_date for simplicity of display
                locations: [] as string[],
            });


            setFoundOrder(aggregatedOrder);

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
            const updatePromises = foundOrder.docIds.map(docId =>
                fetch(`/api/product-out-documents/${docId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        packer_name: user.name,
                        user, 
                     }),
                })
            );
            
            const results = await Promise.all(updatePromises);
            
            const failedUpdates = results.filter(res => !res.ok);
            if (failedUpdates.length > 0) {
                throw new Error(`Failed to confirm packing for ${failedUpdates.length} parts of the order.`);
            }


            toast({
                title: 'Packing Confirmed',
                description: `Order ${foundOrder.order_reference} marked as packed by ${user.name}.`,
            });
            
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
                            <PackageCheck className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Packing Information Station</CardTitle>
                        <CardDescription className="text-center">
                            Scan the picked order to verify details and finalize for shipment. This action marks the order as complete.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-end gap-2">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="orderRef">Scan Order</Label>
                                    <Input id="orderRef" name="orderRef" placeholder="Scan or type order reference..." value={orderRef} onChange={e => setOrderRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchOrder()} disabled={isLoading || isSubmitting}/>
                                </div>
                                <Button onClick={handleSearchOrder} disabled={isLoading || isSubmitting || !orderRef}>
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
                                            <p className="font-semibold">{foundOrder.qty.toLocaleString()}</p>
                                        </div>
                                         <div>
                                            <p className="font-medium text-muted-foreground">From Locations</p>
                                            <p className="font-semibold">{foundOrder.locations.join(', ')}</p>
                                        </div>
                                         <div>
                                            <p className="font-medium text-muted-foreground">EXP Date</p>
                                            <p className="font-semibold">{format(new Date(foundOrder.exp_date), 'dd MMMM yyyy')}</p>
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
