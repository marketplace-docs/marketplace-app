

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, PackageSearch, AlertCircle, Send, Undo2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/types/order';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { BatchProduct } from '@/types/batch-product';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const OosOrderItem = ({ order, allBatches, onSendToPacking, onReturnToProduct }: { order: Order, allBatches: BatchProduct[], onSendToPacking: (order: Order, selectedBatchId: string) => void, onReturnToProduct: (order: Order) => void }) => {
    const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>();
    
    const availableBatches = useMemo(() => {
        return allBatches.filter(b => b.sku === order.sku && b.stock > 0);
    }, [allBatches, order.sku]);

    const handleSendClick = () => {
        if (!selectedBatchId) {
            alert('Please select a location to source the stock from.');
            return;
        }
        onSendToPacking(order, selectedBatchId);
    }

    return (
        <AccordionItem value={order.reference}>
            <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50 rounded-t-lg">
                <div className="flex justify-between items-center w-full">
                    <div className="flex-1 text-left">
                        <p className="font-mono font-bold text-primary text-lg"># {order.reference}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>[{order.sku}]</span>
                            <span>{order.barcode}</span>
                            <Badge variant="destructive">OOS</Badge>
                        </div>
                    </div>
                     <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                        <p>{format(new Date(order.order_date), 'EEE, dd/MMM/yyyy HH:mm')}</p>
                        <p>Qty: <span className="font-bold">{order.qty}</span></p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">Available Stock Locations</h4>
                        {availableBatches.length > 0 ? (
                            <RadioGroup value={selectedBatchId} onValueChange={setSelectedBatchId} className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {availableBatches.map(batch => (
                                    <Label key={batch.id} htmlFor={batch.id} className="flex justify-between items-center p-3 rounded-md border has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value={batch.id} id={batch.id} />
                                            <div>
                                                <p className="font-mono text-sm font-semibold">{batch.location}</p>
                                                <p className="text-xs text-muted-foreground">EXP: {format(new Date(batch.exp_date), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                        <Badge variant={batch.stock >= order.qty ? "default" : "destructive"}>Stock: {batch.stock}</Badge>
                                    </Label>
                                ))}
                            </RadioGroup>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No other available stock found for this SKU.</p>
                        )}
                    </div>
                    <div className="flex flex-col justify-between items-end">
                         <div className="flex items-center gap-2">
                            <Input type="number" defaultValue={0} readOnly className="w-20 text-center font-bold" />
                            <span>/ {order.qty}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                           <Button size="sm" variant="outline" onClick={() => onReturnToProduct(order)}>
                                <Undo2 className="mr-2 h-4 w-4" /> Report to CS & Remove
                            </Button>
                             <Button size="sm" variant="default" onClick={handleSendClick} disabled={!selectedBatchId}>
                                <Send className="mr-2 h-4 w-4" /> Send to Packing
                            </Button>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

export default function OutOfStockManagementPage() {
    const [oosOrders, setOosOrders] = useState<Order[]>([]);
    const [allBatches, setAllBatches] = useState<BatchProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isReturnDialogOpen, setReturnDialogOpen] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();

    const canManage = user?.role && ['Super Admin', 'Manager', 'Supervisor'].includes(user.role);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [oosRes, batchesRes] = await Promise.all([
                 fetch('/api/manual-orders?status=Out of Stock'),
                 fetch('/api/master-product/batch-products')
            ]);
            
            if (!oosRes.ok) {
                const errorData = await oosRes.json();
                throw new Error(errorData.error || 'Failed to fetch Out of Stock orders');
            }
             if (!batchesRes.ok) throw new Error('Failed to fetch batch products.');
            
            const oosData: Order[] = await oosRes.json();
            const batchesData: BatchProduct[] = await batchesRes.json();
            
            setOosOrders(oosData);
            setAllBatches(batchesData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        return oosOrders.filter(order =>
            order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [oosOrders, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    const handlePrevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    
    const handleSendToPacking = async (order: Order, selectedBatchId: string) => {
        if (!user || !canManage) return;

        const selectedBatch = allBatches.find(b => b.id === selectedBatchId);

        if (!selectedBatch) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected stock location not found.' });
            return;
        }

        if (selectedBatch.stock < order.qty) {
            toast({ variant: 'destructive', title: 'Insufficient Stock', description: `Stock at ${selectedBatch.location} is only ${selectedBatch.stock}, but order requires ${order.qty}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/manual-orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'Payment Accepted',
                    location: selectedBatch.location, // Update the location
                    user 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update order status');
            }
            
            toast({ title: "Success", description: "Order has been sent back to My Orders for packing from the new location." });
            await fetchData();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReturnToProduct = async () => {
        if (!selectedOrder || !user || !canManage) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/manual-orders/${selectedOrder.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': user.name,
                    'X-User-Email': user.email,
                    'X-User-Role': user.role
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove the order.');
            }

            toast({ title: "Order Removed", description: "The out of stock order has been removed.", variant: 'destructive' });
            setReturnDialogOpen(false);
            await fetchData();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Out of Stock Orders</h1>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>OOS Management</CardTitle>
                                <CardDescription>Orders that were not found during picking. Decide to re-process or remove them.</CardDescription>
                            </div>
                             <div className="flex w-full md:w-auto items-center gap-2">
                                <Input 
                                    placeholder="Search Reference, SKU, Customer..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-auto md:max-w-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {loading ? (
                           <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                       ) : paginatedData.length > 0 ? (
                           <Accordion type="single" collapsible className="w-full space-y-4">
                               {paginatedData.map((order) => (
                                   <OosOrderItem 
                                       key={order.id} 
                                       order={order} 
                                       allBatches={allBatches}
                                       onSendToPacking={handleSendToPacking}
                                       onReturnToProduct={() => { setSelectedOrder(order); setReturnDialogOpen(true); }}
                                   />
                               ))}
                           </Accordion>
                       ) : (
                           <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                                <PackageSearch className="h-12 w-12 mb-4" />
                                <h3 className="text-xl font-semibold">All Clear!</h3>
                                <p>No out-of-stock orders found.</p>
                            </div>
                       )}

                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredData.length > 0 ? currentPage : 0} of {totalPages}
                            </div>
                             <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select value={`${rowsPerPage}`} onValueChange={(value) => { setRowsPerPage(Number(value)); }}>
                                    <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={rowsPerPage} /></SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 25, 50, 100].map((pageSize) => (<SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>

                 <Dialog open={isReturnDialogOpen} onOpenChange={setReturnDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Report & Remove</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to report and remove order <span className="font-bold">{selectedOrder?.reference}</span>? This action cannot be undone and the order will need to be re-uploaded if this was a mistake.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleReturnToProduct} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Yes, Remove Order
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </MainLayout>
    );
}
