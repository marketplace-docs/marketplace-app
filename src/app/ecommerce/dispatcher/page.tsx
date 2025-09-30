
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageCheck, Search, Send, CheckCheck, Weight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ProductOutDocument } from '@/types/product-out-document';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type OrderToDispatch = {
    docIds: number[];
    order_reference: string;
    sku: string;
    qty: number;
    packer_name: string;
    current_status: string;
    weight: number | null;
}

export default function DispatcherPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderRef, setOrderRef] = useState('');
    const [weight, setWeight] = useState('');
    const [foundOrder, setFoundOrder] = useState<OrderToDispatch | null>(null);

    const handleSearchOrder = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan an order reference.' });
            return;
        }
        
        setIsLoading(true);
        setFoundOrder(null);
        setWeight('');

        try {
            const productOutRes = await fetch('/api/product-out-documents');
            if (!productOutRes.ok) throw new Error('Could not fetch outbound documents.');
            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
            
            const relatedDocs = allProductOutDocs.filter(
                doc => doc.order_reference === orderRef && doc.status === 'Issue - Order'
            );
            
            if (relatedDocs.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found', description: `No order found for ref: ${orderRef}. It might not be picked yet.` });
                setIsLoading(false);
                return;
            }
            
            const isFullyPacked = relatedDocs.every(doc => doc.packer_name !== null);
            
            if (!isFullyPacked) {
                toast({ variant: 'destructive', title: 'Not Ready', description: `Order ${orderRef} has not been fully packed yet.` });
                setIsLoading(false);
                return;
            }
            
            const aggregatedOrder: OrderToDispatch = relatedDocs.reduce((acc, doc) => {
                acc.docIds.push(doc.id);
                acc.qty += doc.qty;
                if (doc.weight !== null && doc.weight !== undefined) {
                    acc.weight = doc.weight;
                }
                if (doc.shipping_status === 'Delivered') {
                    acc.current_status = 'Delivered';
                } else if (doc.shipping_status === 'Shipped' && acc.current_status !== 'Delivered') {
                    acc.current_status = 'Shipped';
                }
                return acc;
            }, {
                docIds: [] as number[],
                order_reference: relatedDocs[0].order_reference || orderRef,
                sku: relatedDocs[0].sku,
                qty: 0,
                packer_name: relatedDocs[0].packer_name || 'Unknown',
                current_status: 'Packed',
                weight: null
            });

            setFoundOrder(aggregatedOrder);
            if (aggregatedOrder.weight) {
                setWeight(aggregatedOrder.weight.toString());
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateStatus = async (newStatus: 'Shipped' | 'Delivered') => {
        if (!foundOrder || !user) return;

        const packageWeight = parseFloat(weight);
        if (newStatus === 'Shipped' && (isNaN(packageWeight) || packageWeight <= 0)) {
            toast({ variant: 'destructive', title: 'Invalid Weight', description: 'Please enter a valid package weight before shipping.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const updatePromises = foundOrder.docIds.map(docId =>
                fetch(`/api/product-out-documents/${docId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shipping_status: newStatus, weight: packageWeight, user }),
                })
            );
            
            const results = await Promise.all(updatePromises);
            
            for(const res of results) {
                 if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Failed to update status for one or more document parts.`);
                }
            }

            toast({ title: 'Success', description: `Order ${foundOrder.order_reference} status updated to ${newStatus}.` });
            router.push('/ecommerce/shipment-monitoring');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Dispatcher Logistic</h1>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <Send className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Shipment & Delivery Confirmation</CardTitle>
                        <CardDescription className="text-center">
                            Scan a packed order to update its shipping status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="orderRef">Scan Order Reference</Label>
                                    <Input id="orderRef" name="orderRef" placeholder="Scan reference to find packed order..." value={orderRef} onChange={e => setOrderRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchOrder()} disabled={isLoading || isSubmitting}/>
                                </div>
                                <Button onClick={handleSearchOrder} disabled={isLoading || isSubmitting || !orderRef}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Find Order
                                </Button>
                            </div>
                            
                            {foundOrder && (
                                <div className="space-y-4 pt-4 border-t">
                                     <div className="space-y-2">
                                        <Label htmlFor="weight" className="flex items-center gap-2">
                                            <Weight className="h-4 w-4" /> Package Weight (kg)
                                        </Label>
                                        <Input
                                            id="weight"
                                            name="weight"
                                            type="number"
                                            placeholder="Enter package weight in kg"
                                            value={weight}
                                            onChange={e => setWeight(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Order: {foundOrder.order_reference}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                            <div><p className="font-medium text-muted-foreground">SKU</p><p className="font-semibold">{foundOrder.sku}</p></div>
                                            <div><p className="font-medium text-muted-foreground">QTY</p><p className="font-semibold">{foundOrder.qty.toLocaleString()}</p></div>
                                            <div><p className="font-medium text-muted-foreground">Packed By</p><p className="font-semibold">{foundOrder.packer_name}</p></div>
                                            <div><p className="font-medium text-muted-foreground">Current Status</p><p><Badge>{foundOrder.current_status}</Badge></p></div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Button onClick={() => handleUpdateStatus('Shipped')} disabled={isSubmitting || foundOrder.current_status === 'Shipped' || foundOrder.current_status === 'Delivered'} className="h-12 bg-blue-600 hover:bg-blue-700">
                                            <Send className="mr-2 h-4 w-4" /> Confirm Shipment
                                        </Button>
                                         <Button onClick={() => handleUpdateStatus('Delivered')} disabled={isSubmitting || foundOrder.current_status === 'Delivered'} className="h-12 bg-green-600 hover:bg-green-700">
                                            <CheckCheck className="mr-2 h-4 w-4" /> Confirm Delivered
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
