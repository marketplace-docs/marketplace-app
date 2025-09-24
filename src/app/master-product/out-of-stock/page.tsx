
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft, ChevronRight, PackageSearch, AlertCircle, Send, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/types/order';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function OutOfStockManagementPage() {
    const [oosOrders, setOosOrders] = useState<Order[]>([]);
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

    const fetchOosOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/manual-orders?status=Out of Stock');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch Out of Stock orders');
            }
            const data: Order[] = await response.json();
            setOosOrders(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOosOrders();
    }, [fetchOosOrders]);

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
    
    const handleSendToPacking = async (orderId: string) => {
        if (!user || !canManage) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/manual-orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Payment Accepted', user })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update order status');
            }
            
            toast({ title: "Success", description: "Order has been sent back to My Orders for packing." });
            await fetchOosOrders();

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
            await fetchOosOrders();

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
                    <CardContent>
                       <div className="border rounded-lg">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order Reference</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Last Location</TableHead>
                                        <TableHead>Qty</TableHead>
                                        {canManage && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.reference}</TableCell>
                                                <TableCell>{order.sku}</TableCell>
                                                <TableCell>{order.customer}</TableCell>
                                                <TableCell>{order.location}</TableCell>
                                                <TableCell>{order.qty}</TableCell>
                                                {canManage && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => handleSendToPacking(order.id)} disabled={isSubmitting}>
                                                                <Send className="mr-2 h-4 w-4" /> Send to Packing
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => { setSelectedOrder(order); setReturnDialogOpen(true); }} disabled={isSubmitting}>
                                                                <Undo2 className="mr-2 h-4 w-4" /> Return to Product
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                     <PackageSearch className="h-8 w-8" />
                                                     <span>No out-of-stock orders found.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                       </div>
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
                            <DialogTitle>Confirm Return to Product</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove order <span className="font-bold">{selectedOrder?.reference}</span>? This action cannot be undone and the order will need to be re-uploaded if this was a mistake.
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
