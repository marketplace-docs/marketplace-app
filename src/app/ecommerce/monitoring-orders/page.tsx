
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, PackageSearch, RefreshCw, Printer, List, X, Check, UserCheck, PackageCheck as PackageCheckIcon, Send, CheckCheck, Search } from "lucide-react";
import { format } from "date-fns";
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
import { PickLabel } from '@/components/pick-label';
import { createRoot } from 'react-dom/client';
import { Input } from '@/components/ui/input';

type WaveStatus = 'Wave Progress' | 'Wave Done';

type Wave = {
    id: number;
    created_at: string;
    wave_document_number: string;
    wave_type: string;
    status: WaveStatus;
    total_orders: number;
    created_by: string;
}

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
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [allWaves, setAllWaves] = useState<Wave[]>([]);
    const [filteredWaves, setFilteredWaves] = useState<Wave[]>([]);
    const [statusFilter, setStatusFilter] = useState<WaveStatus | 'All'>('Wave Progress');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
    const [waveOrders, setWaveOrders] = useState<WaveOrder[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsSearchTerm, setDetailsSearchTerm] = useState('');

    const fetchWaves = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/waves');
            if (!response.ok) {
                throw new Error("Failed to fetch waves.");
            }
            const data: Wave[] = await response.json();
            setAllWaves(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (statusFilter === 'All') {
            setFilteredWaves(allWaves);
        } else {
            setFilteredWaves(allWaves.filter(w => w.status === statusFilter));
        }
    }, [statusFilter, allWaves]);

    const handleViewDetails = useCallback(async (wave: Wave) => {
        setSelectedWave(wave);
        setDetailsDialogOpen(true);
        setLoadingDetails(true);
        try {
            const [waveDetailsRes, allBatchesRes, productOutRes] = await Promise.all([
                fetch(`/api/waves/${wave.id}`),
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

            setWaveOrders(ordersWithLocationAndStatus);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoadingDetails(false);
        }
    }, [toast]);

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

    const handlePrintOrder = (order: WaveOrder) => {
        const printContainer = document.getElementById('print-container');
        if (printContainer) {
            const root = createRoot(printContainer);
            root.render(<PickLabel order={order} />);
            setTimeout(() => {
                window.print();
                root.unmount();
            }, 500); 
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
                        <div className="border rounded-lg" id="main-table-content">
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
                                    ) : filteredWaves.length > 0 ? (
                                        filteredWaves.map(wave => (
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
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-gray-300">
                                                        <span className="text-xs font-semibold">{wave.status === 'Wave Done' ? `${wave.total_orders}/${wave.total_orders}` : `0/${wave.total_orders}`}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right no-print">
                                                    <div className="flex items-center justify-end gap-1">
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
                                        ))
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
                                                            <Button variant="ghost" size="icon" disabled>
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

            {/* Hidden container for printing */}
            <div id="print-container" className="hidden print:block"></div>
             <style jsx global>{`
                @media print {
                  body > *:not(#print-container) {
                    visibility: hidden;
                    display: none;
                  }
                  #print-container, #print-container * {
                    visibility: visible;
                  }
                  #print-container {
                    display: block;
                    position: absolute;
                    left: 0;
                    top: 0;
                  }
                   @page {
                    size: 80mm 100mm;
                    margin: 0;
                  }
                }
            `}</style>
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
