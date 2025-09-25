
'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Handshake, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ProductOutDocument } from '@/types/product-out-document';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type OrderToHandover = {
    docIds: string[];
    order_reference: string;
    sku: string;
    qty: number;
    packer_name: string;
    weight: number | null;
}

export default function Handover3PLPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderRef, setOrderRef] = useState('');
    const [foundOrder, setFoundOrder] = useState<OrderToHandover | null>(null);

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
            
            const relatedDocs = allProductOutDocs.filter(
                doc => doc.order_reference === orderRef && doc.shipping_status === 'Shipped'
            );
            
            if (relatedDocs.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found', description: `No shipped order found for ref: ${orderRef}. It might be delivered or not yet shipped.` });
                setIsLoading(false);
                return;
            }
            
            const aggregatedOrder: OrderToHandover = relatedDocs.reduce((acc, doc) => {
                acc.docIds.push(doc.id);
                acc.qty += doc.qty;
                if (doc.weight) {
                    acc.weight = doc.weight;
                }
                return acc;
            }, {
                docIds: [],
                order_reference: relatedDocs[0].order_reference || orderRef,
                sku: relatedDocs[0].sku,
                qty: 0,
                packer_name: relatedDocs[0].packer_name || 'Unknown',
                weight: null
            });

            setFoundOrder(aggregatedOrder);
            toast({ title: "Order Ready", description: `Order ${aggregatedOrder.order_reference} ready for handover.` });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmHandover = async () => {
        if (!foundOrder || !user) return;
        
        setIsSubmitting(true);
        try {
            const updatePromises = foundOrder.docIds.map(docId =>
                fetch(`/api/product-out-documents/${docId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shipping_status: 'Delivered', user }),
                })
            );
            
            const results = await Promise.all(updatePromises);
            
            for(const res of results) {
                 if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Failed to update status for one or more document parts.`);
                }
            }

            toast({ title: 'Success', description: `Order ${foundOrder.order_reference} status updated to Delivered.` });
            setOrderRef('');
            setFoundOrder(null);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Handover to 3PL</h1>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <Handshake className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Confirm Handover</CardTitle>
                        <CardDescription className="text-center">
                            Scan a shipped order to confirm its handover to the third-party logistics (3PL) provider. This will mark the order as "Delivered".
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                             <div className="flex items-end gap-2">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="orderRef">Scan Order Reference</Label>
                                    <Input id="orderRef" name="orderRef" placeholder="Scan reference of shipped order..." value={orderRef} onChange={e => setOrderRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchOrder()} disabled={isLoading || isSubmitting}/>
                                </div>
                                <Button onClick={handleSearchOrder} disabled={isLoading || isSubmitting || !orderRef}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Find Order
                                </Button>
                            </div>
                            
                            {foundOrder && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Order: {foundOrder.order_reference}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                            <div><p className="font-medium text-muted-foreground">SKU</p><p className="font-semibold">{foundOrder.sku}</p></div>
                                            <div><p className="font-medium text-muted-foreground">QTY</p><p className="font-semibold">{foundOrder.qty.toLocaleString()}</p></div>
                                            <div><p className="font-medium text-muted-foreground">Packed By</p><p className="font-semibold">{foundOrder.packer_name}</p></div>
                                            <div><p className="font-medium text-muted-foreground">Weight</p><p className="font-semibold">{foundOrder.weight ? `${foundOrder.weight} kg` : 'N/A'}</p></div>
                                            <div><p className="font-medium text-muted-foreground">Current Status</p><p><Badge variant="secondary">Shipped</Badge></p></div>
                                        </CardContent>
                                    </Card>

                                    <Button onClick={handleConfirmHandover} disabled={isSubmitting} className="w-full h-12 bg-green-600 hover:bg-green-700">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                                        Confirm Handover (Set to Delivered)
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
