'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Handshake, CheckCheck, Package, ListVideo } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ProductOutDocument } from '@/types/product-out-document';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderRef, setOrderRef] = useState('');
    const [scannedOrders, setScannedOrders] = useState<OrderToHandover[]>([]);
    const orderInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        orderInputRef.current?.focus();
    }, []);

    const handleAddOrderToList = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan an order reference.' });
            return;
        }

        if (scannedOrders.some(o => o.order_reference === orderRef)) {
            toast({ variant: 'destructive', title: 'Duplicate', description: `Order ${orderRef} is already in the list.` });
            setOrderRef('');
            return;
        }
        
        setIsLoading(true);

        try {
            const productOutRes = await fetch('/api/product-out-documents');
            if (!productOutRes.ok) throw new Error('Could not fetch outbound documents.');
            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
            
            const relatedDocs = allProductOutDocs.filter(
                doc => doc.order_reference === orderRef && doc.shipping_status === 'Shipped'
            );
            
            if (relatedDocs.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found', description: `No shipped order found for ref: ${orderRef}.` });
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

            setScannedOrders(prev => [aggregatedOrder, ...prev]);
            toast({ title: "Added to List", description: `Order ${aggregatedOrder.order_reference} is ready for handover.` });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
            setOrderRef('');
            orderInputRef.current?.focus();
        }
    };
    
    const handleConfirmAllHandovers = async () => {
        if (scannedOrders.length === 0 || !user) return;
        
        setIsSubmitting(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const order of scannedOrders) {
            try {
                const updatePromises = order.docIds.map(docId =>
                    fetch(`/api/product-out-documents/${docId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shipping_status: 'Delivered', user }),
                    })
                );
                
                const results = await Promise.all(updatePromises);
                if (results.some(res => !res.ok)) {
                    throw new Error(`Failed to update status for order ${order.order_reference}`);
                }
                successCount++;
            } catch (error) {
                console.error(`Failed to process order ${order.order_reference}:`, error);
                failCount++;
            }
        }
        
        if (failCount > 0) {
             toast({ variant: 'destructive', title: 'Partial Success', description: `${successCount} orders confirmed. ${failCount} orders failed.` });
        } else {
             toast({ title: 'All Handovers Confirmed', description: `${successCount} orders have been successfully marked as Delivered.` });
        }

        setIsSubmitting(false);
        setScannedOrders([]);
    }
    
    const handleRemoveOrder = (orderReference: string) => {
        setScannedOrders(prev => prev.filter(o => o.order_reference !== orderReference));
    };


    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Handover to 3PL</h1>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <Handshake className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Confirm Bulk Handover</CardTitle>
                        <CardDescription className="text-center">
                            Scan all shipped orders to add them to the list, then confirm all at once.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                             <div className="flex items-end gap-2">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="orderRef">Scan Order Reference</Label>
                                    <Input ref={orderInputRef} id="orderRef" name="orderRef" placeholder="Scan reference to add to list..." value={orderRef} onChange={e => setOrderRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrderToList()} disabled={isLoading || isSubmitting}/>
                                </div>
                                <Button onClick={handleAddOrderToList} disabled={isLoading || isSubmitting || !orderRef}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Add to List
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {scannedOrders.length > 0 && (
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <ListVideo /> Ready for Handover ({scannedOrders.length})
                                </CardTitle>
                                 <Button onClick={handleConfirmAllHandovers} disabled={isSubmitting} className="h-10 bg-green-600 hover:bg-green-700">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                                    Confirm All ({scannedOrders.length}) Handovers
                                </Button>
                            </div>
                        </CardHeader>
                         <CardContent>
                            <div className="border rounded-lg max-h-[50vh] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted">
                                        <TableRow>
                                            <TableHead>Order Ref</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Packed By</TableHead>
                                            <TableHead>Weight</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scannedOrders.map(order => (
                                            <TableRow key={order.order_reference}>
                                                <TableCell className="font-medium">{order.order_reference}</TableCell>
                                                <TableCell>{order.sku}</TableCell>
                                                <TableCell><Badge variant="outline">{order.qty}</Badge></TableCell>
                                                <TableCell>{order.packer_name}</TableCell>
                                                <TableCell>{order.weight ? `${order.weight} kg` : 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveOrder(order.order_reference)}>Remove</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                         </CardContent>
                     </Card>
                 )}
            </div>
        </MainLayout>
    );
}
