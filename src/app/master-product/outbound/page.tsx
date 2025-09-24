
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
            // This logic needs to be robust. We assume the picker created a `product_out_documents` entry
            // with status 'Issue - Order'. We need to find that document.
            // The link between the original manual_order.reference and product_out_documents.nodocument
            // is not direct. A better way would be to store the order_reference in product_out_documents.
            // For now, we'll try to find a match based on what we have.

            const productOutRes = await fetch('/api/product-out-documents');
            if (!productOutRes.ok) throw new Error('Could not fetch outbound documents.');
            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
            
            // The most reliable way to find the picked order is to search for a document that
            // has been issued for an order but not yet packed.
            const issueDoc = allProductOutDocs.find(
                doc => doc.status === 'Issue - Order' && 
                       doc.packer_name === null &&
                       // We need a reliable field to search by. Let's assume for now that the picker's
                       // `validatedby` field is linked to an order reference or similar.
                       // A better search would be on a dedicated `order_reference` field in the table.
                       // Let's broaden the search to barcode or SKU for now as a fallback.
                       (doc.barcode === orderRef || doc.sku === orderRef || doc.nodocument.toLowerCase().includes(orderRef.toLowerCase()))
            );
            
            if (!issueDoc) {
                toast({ variant: 'destructive', title: 'Not Found or Already Packed', description: `No pending packing task found for order ref: ${orderRef}.` });
                setIsLoading(false);
                return;
            }

            setFoundOrder({
                docId: issueDoc.id,
                order_reference: orderRef, // Use the scanned reference
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
            const response = await fetch(`/api/product-out-documents/${foundOrder.docId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    packer_name: user.name,
                    user, 
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
                            Scan the picked order to verify details and finalize for shipment. This action marks the order as complete and adjusts stock levels.
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

    