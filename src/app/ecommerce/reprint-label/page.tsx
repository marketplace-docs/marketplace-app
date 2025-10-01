
'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Printer, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/types/order';

export default function ReprintLabelPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [orderRef, setOrderRef] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);

    const handleSearchOrder = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan or enter an order reference.' });
            return;
        }
        
        setIsLoading(true);
        setFoundOrder(null);
        try {
            // This is a simplified search. A real-world scenario would search across multiple tables
            // (waves, product_out_documents, etc.) or a dedicated 'orders' table.
            // For now, we'll assume the order is in the `manual_orders` table for simplicity.
            const response = await fetch('/api/manual-orders');
            if (!response.ok) throw new Error('Could not fetch orders to find the reference.');
            const allOrders: Order[] = await response.json();

            const order = allOrders.find(o => o.reference === orderRef);
            
            if (order) {
                setFoundOrder(order);
                toast({ title: 'Order Found', description: 'Ready to reprint label.' });
            } else {
                 toast({ variant: 'destructive', title: 'Not Found', description: `Order ${orderRef} not found.` });
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    const handleReprint = () => {
        if (!foundOrder) return;
        
        // This would open a new window with a specific print component.
        // For simplicity, we'll just show a toast message.
        // In a real app: window.open(`/print/shipping-label?orderId=${foundOrder.id}`, '_blank');
        
        toast({
            title: 'Reprinting Label',
            description: `A new shipping label for order ${foundOrder.reference} is being generated.`,
        });
    };

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Reprint Label</h1>
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <Printer className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Reprint Shipping Label</CardTitle>
                        <CardDescription className="text-center">
                            Scan an order reference to find the order and reprint its shipping label.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="orderRef" className="text-lg">Order Reference</Label>
                                <Input 
                                    id="orderRef" 
                                    name="orderRef" 
                                    placeholder="Scan or type order reference..." 
                                    value={orderRef} 
                                    onChange={(e) => setOrderRef(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                                    className="text-center text-xl h-12"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button onClick={handleSearchOrder} disabled={isLoading || !orderRef} className="h-12">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Search
                            </Button>
                        </div>
                        
                        {foundOrder && (
                             <div className="space-y-4 pt-6 border-t-2 border-dashed">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Found: {foundOrder.reference}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-base">
                                         <p><span className="font-semibold text-muted-foreground">Customer:</span> {foundOrder.customer}</p>
                                         <p><span className="font-semibold text-muted-foreground">SKU:</span> {foundOrder.sku}</p>
                                         <p><span className="font-semibold text-muted-foreground">QTY:</span> {foundOrder.qty}</p>
                                    </CardContent>
                                </Card>
                                <Button onClick={handleReprint} className="w-full h-12 text-lg">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Reprint Label
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
