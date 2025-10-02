

'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, PackageSearch, RefreshCw, Printer, List, X, Check, UserCheck, PackageCheck as PackageCheckIcon, Send, CheckCheck, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { BatchProduct } from '@/types/batch-product';
import type { ProductOutDocument } from '@/types/product-out-document';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { PickLabel } from '@/components/pick-label';
import { createRoot } from 'react-dom/client';

type WaveStatus = 'Wave Progress' | 'Wave Done';

type Wave = {
    id: number;
    created_at: string;
    wave_document_number: string;
    wave_type: string;
    status: WaveStatus;
    total_orders: number;
    created_by: string;
    picked_orders_count?: number; 
};

type WaveOrder = {
    id: number;
    order_reference: string;
    sku: string;
    qty: number;
    from: string;
    location: string;
    status: 'Assigned' | 'Picked' | 'Packed' | 'Shipped' | 'Delivered';
};

function MonitoringOrdersContent() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [allWaves, setAllWaves] = useState<Wave[]>([]);
    const [filteredWaves, setFilteredWaves] = useState<Wave[]>([]);
    const [statusFilter, setStatusFilter] = useState<WaveStatus | 'All'>('Wave Progress');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPrinting, setIsPrinting] = useState<number | null>(null);

    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [isRemoveOrderDialogOpen, setRemoveOrderDialogOpen] = useState(false);
    const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<WaveOrder | null>(null);
    const [waveOrders, setWaveOrders] = useState<WaveOrder[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsSearchTerm, setDetailsSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchWaves = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [wavesRes, productOutRes] = await Promise.all([
                fetch('/api/waves'),
                fetch('/api/product-out-documents')
            ]);
            
            if (!wavesRes.ok) throw new Error("Failed to fetch waves.");
            if (!productOutRes.ok) throw new Error("Failed to fetch product out documents.");
            
            const wavesData: Wave[] = await wavesRes.json();
            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();

            // Create a set of all picked order references for quick lookup
            const allPickedOrderRefs = new Set(
                allProductOutDocs
                    .filter(doc => doc.status === 'Issue - Order')
                    .map(doc => doc.order_reference)
                    .filter((ref): ref is string => !!ref)
            );

            const wavesWithProgress = await Promise.all(wavesData.map(async (wave) => {
                const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                if (!waveDetailsRes.ok) {
                    console.warn(`Could not fetch details for wave ${wave.id}`);
                    return { ...wave, picked_orders_count: 0 };
                }
                const waveDetails = await waveDetailsRes.json();
                const ordersInWaveRefs = new Set(waveDetails.orders.map((o: any) => o.order_reference));

                const pickedCount = Array.from(ordersInWaveRefs).filter(ref => allPickedOrderRefs.has(ref)).length;

                // Auto-update status if all orders are picked
                if (wave.status === 'Wave Progress' && wave.total_orders > 0 && pickedCount === wave.total_orders) {
                    if (user) {
                        fetch(`/api/waves/${wave.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'update_status', status: 'Wave Done', user })
                        }).catch(e => console.error("Failed to auto-update wave status:", e));
                    }
                    return { ...wave, picked_orders_count: pickedCount, status: 'Wave Done' as WaveStatus };
                }

                return {
                    ...wave,
                    picked_orders_count: pickedCount,
                };
            }));
            
            setAllWaves(wavesWithProgress);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);


    useEffect(() => {
        if (statusFilter === 'All') {
            setFilteredWaves(allWaves);
        } else {
            setFilteredWaves(allWaves.filter(w => w.status === statusFilter));
        }
    }, [statusFilter, allWaves]);

    const totalPages = Math.ceil(filteredWaves.length / rowsPerPage);
    const paginatedWaves = filteredWaves.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, statusFilter]);


    const fetchWaveOrders = useCallback(async (waveId: number): Promise<WaveOrder[]> => {
        const [waveDetailsRes, allBatchesRes, productOutRes] = await Promise.all([
            fetch(`/api/waves/${waveId}`),
            fetch('/api/master-product/batch-products'),
            fetch('/api/product-out-documents')
        ]);
        
        if (!waveDetailsRes.ok) throw new Error('Failed to fetch wave details.');
        if (!allBatchesRes.ok) throw new Error('Failed to fetch product stock data.');
        if (!productOutRes.ok) throw new Error('Failed to fetch product out documents.');

        const waveDetails = await waveDetailsRes.json();
        const allBatches: BatchProduct[] = await allBatchesRes.json();
        const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
        
        const ordersWithLocationAndStatus = waveDetails.orders.map((order: any) => {
            const availableBatch = allBatches
                .filter(b => b.sku === order.sku && b.stock > 0)
                .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime())
                [0];
            
            const productOutDoc = allProductOutDocs.find(
                doc => doc.order_reference === order.order_reference && doc.status === 'Issue - Order'
            );

            let status: WaveOrder['status'] = 'Assigned';
            if (productOutDoc) {
                if (productOutDoc.shipping_status === 'Delivered') {
                    status = 'Delivered';
                } else if (productOutDoc.shipping_status === 'Shipped') {
                    status = 'Shipped';
                } else if (productOutDoc.packer_name) {
                    status = 'Packed';
                } else {
                    status = 'Picked';
                }
            }

            return {
                id: order.id,
                order_reference: order.order_reference,
                sku: order.sku,
                qty: order.qty,
                from: order.from,
                location: availableBatch ? availableBatch.location : 'N/A - OOS?',
                status: status,
            };
        });
        return ordersWithLocationAndStatus;
    }, []);

    const handleViewDetails = useCallback(async (wave: Wave) => {
        setSelectedWave(wave);
        setDetailsDialogOpen(true);
        setLoadingDetails(true);
        try {
            const orders = await fetchWaveOrders(wave.id);
            setWaveOrders(orders);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoadingDetails(false);
        }
    }, [toast, fetchWaveOrders]);

    useEffect(() => {
        fetchWaves();
    }, [fetchWaves]);
    
    const handleCancelWave = async () => {
        if (!selectedWave || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/waves/${selectedWave.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': user.name,
                    'X-User-Email': user.email,
                    'X-User-Role': user.role,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel wave.');
            }
            toast({ title: 'Success', description: 'Wave has been cancelled.', variant: 'destructive' });
            fetchWaves();
            setCancelDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
     const handlePrintWave = async (wave: Wave) => {
        if (wave.wave_type === 'Bulk') {
            const url = `/ecommerce/monitoring-orders/print-wave?waveId=${wave.id}`;
            window.open(url, '_blank');
        } else {
            // For Mix wave, fetch all order IDs and pass them
            setIsPrinting(wave.id);
            try {
                const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                if (!waveDetailsRes.ok) throw new Error('Could not fetch wave details to print.');
                const waveDetails = await waveDetailsRes.json();
                const orderIds = waveDetails.orders.map((o: any) => o.id).join(',');
                
                if (!orderIds) {
                    toast({ variant: 'destructive', title: 'No Orders', description: 'This wave has no orders to print.' });
                    return;
                }

                const url = `/ecommerce/monitoring-orders/print?orderIds=${orderIds}`;
                window.open(url, '_blank');
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Print Error', description: error.message });
            } finally {
                setIsPrinting(null);
            }
        }
    };


    const handlePrintOrder = (order: WaveOrder) => {
        const url = `/ecommerce/monitoring-orders/print?orderIds=${order.id}`;
        window.open(url, '_blank');
    };

    const handleRemoveOrder = async () => {
        if (!selectedOrder || !selectedWave || !user) return;
        
        setIsSubmitting(true);
        try {
             const response = await fetch(`/api/waves/${selectedWave.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'remove_order', 
                    orderId: selectedOrder.order_reference, 
                    user 
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove order from wave.');
            }
            
            toast({ title: 'Success', description: `Order ${selectedOrder.order_reference} has been returned to the queue.` });
            
            // Refresh details in dialog
            const updatedOrders = await fetchWaveOrders(selectedWave.id);
            setWaveOrders(updatedOrders);
            // Also refresh main wave list to update counts
            fetchWaves();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
            setRemoveOrderDialogOpen(false);
        }
    };


    const filteredDialogOrders = waveOrders.filter(order =>
        order.order_reference.toLowerCase().includes(detailsSearchTerm.toLowerCase()) ||
        order.sku.toLowerCase().includes(detailsSearchTerm.toLowerCase())
    );


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Orders</h1>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Wave Monitoring</CardTitle>
                                <CardDescription>A list of all order waves.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 no-print">
                                 <Select value={statusFilter} onValueChange={(value: WaveStatus | 'All') => setStatusFilter(value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Statuses</SelectItem>
                                        <SelectItem value="Wave Progress">Wave Progress</SelectItem>
                                        <SelectItem value="Wave Done">Wave Done</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" onClick={() => fetchWaves()}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document Number</TableHead>
                                        <TableHead>Wave Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Partial</TableHead>
                                        <TableHead className="text-right no-print">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedWaves.length > 0 ? (
                                        paginatedWaves.map(wave => {
                                            const isDelayed = wave.status === 'Wave Progress' && differenceInHours(new Date(), new Date(wave.created_at)) > 5;
                                            return (
                                            <TableRow key={wave.id}>
                                                <TableCell className="font-medium">{wave.wave_document_number}</TableCell>
                                                <TableCell>{wave.wave_type}</TableCell>
                                                <TableCell>{format(new Date(wave.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-white", 
                                                        wave.status === 'Wave Progress' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                                                    )}>
                                                        {wave.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-gray-300">
                                                            <span className="text-xs font-semibold">{wave.picked_orders_count ?? 0}/{wave.total_orders}</span>
                                                        </div>
                                                        {isDelayed && (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                Delayed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right no-print">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 h-8 w-8" onClick={() => handlePrintWave(wave)} disabled={isPrinting === wave.id}>
                                                            {isPrinting === wave.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                                        </Button>
                                                         <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600 h-8 w-8" onClick={() => handleViewDetails(wave)}>
                                                            <List className="h-4 w-4" />
                                                        </Button>
                                                        <div className="border-l h-5 mx-1" />
                                                         <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8" onClick={() => { setSelectedWave(wave); setCancelDialogOpen(true); }}>
                                                            <X className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )})
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <PackageSearch className="h-8 w-8" />
                                                    <span>No waves found for the selected status.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredWaves.length > 0 ? currentPage : 0} of {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                        setRowsPerPage(Number(value));
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={rowsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 25, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
            
            <Dialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Wave</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel wave <span className="font-bold">{selectedWave?.wave_document_number}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>No</Button>
                        <Button variant="destructive" onClick={handleCancelWave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isDetailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-7xl">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <DialogTitle>Wave of {selectedWave?.wave_document_number}</DialogTitle>
                            <Input 
                                placeholder="Search Order Code or SKU..."
                                className="w-72"
                                value={detailsSearchTerm}
                                onChange={(e) => setDetailsSearchTerm(e.target.value)}
                            />
                        </div>
                        <DialogDescription>
                             Total: {filteredDialogOrders.length} orders
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        {loadingDetails ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-h-[65vh] overflow-y-auto border rounded-lg">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-muted z-10">
                                            <TableRow>
                                                <TableHead>ORDER CODE</TableHead>
                                                <TableHead>ORDER TYPE</TableHead>
                                                <TableHead>ASSIGN TO</TableHead>
                                                <TableHead>STATUS</TableHead>
                                                <TableHead>PRODUCTS</TableHead>
                                                <TableHead>BOX CODE</TableHead>
                                                <TableHead className="text-right no-print">ACTION</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDialogOrders.length > 0 ? filteredDialogOrders.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-mono">{order.order_reference}</TableCell>
                                                    <TableCell>{order.from}</TableCell>
                                                    <TableCell>{selectedWave?.created_by}</TableCell>
                                                    <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                                    <TableCell>
                                                        <div className="border rounded-md p-2 bg-slate-50">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="text-xs p-1">SKU</TableHead>
                                                                        <TableHead className="text-xs p-1">Qty</TableHead>
                                                                        <TableHead className="text-xs p-1">Source</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    <TableRow>
                                                                        <TableCell className="text-xs p-1">{order.sku}</TableCell>
                                                                        <TableCell className="text-xs p-1"><Badge variant="outline">{order.qty}</Badge></TableCell>
                                                                        <TableCell className="text-xs p-1">{order.location}</TableCell>
                                                                    </TableRow>
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell className="text-right no-print">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => handlePrintOrder(order)}>
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setRemoveOrderDialogOpen(true); }}>
                                                                <X className="h-5 w-5 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No orders found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            
             <Dialog open={isRemoveOrderDialogOpen} onOpenChange={setRemoveOrderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Order from Wave?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove order <span className="font-bold">{selectedOrder?.order_reference}</span> from this wave? It will be returned to the 'My Orders' queue.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveOrderDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemoveOrder} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </MainLayout>
    );
}

export default function MonitoringOrdersPage() {
    return (
        <Suspense fallback={<MainLayout><Loader2 className="h-8 w-8 animate-spin" /></MainLayout>}>
            <MonitoringOrdersContent />
        </Suspense>
    );
}
