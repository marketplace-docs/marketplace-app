

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, PackageSearch, RefreshCw, Printer, List, X, Check, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { BatchProduct } from '@/types/batch-product';

type Wave = {
    id: number;
    created_at: string;
    wave_document_number: string;
    wave_type: string;
    status: 'Wave Progress' | 'Wave Done';
    total_orders: number;
    created_by: string;
}

type WaveOrder = {
    id: number;
    order_reference: string;
    sku: string;
    qty: number;
    location: string;
    status: 'Assigned' | 'Picked';
};

function MonitoringOrdersContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [waves, setWaves] = useState<Wave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
    const [waveOrders, setWaveOrders] = useState<WaveOrder[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchWaves = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/waves');
            if (!response.ok) {
                throw new Error("Failed to fetch waves.");
            }
            const data: Wave[] = await response.json();
            setWaves(data);
            return data; // Return data for chaining
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        return [];
    }, []);

    const handleViewDetails = useCallback(async (wave: Wave) => {
        setSelectedWave(wave);
        setDetailsDialogOpen(true);
        setLoadingDetails(true);
        try {
            const [waveDetailsRes, allBatchesRes] = await Promise.all([
                fetch(`/api/waves/${wave.id}`),
                fetch('/api/master-product/batch-products')
            ]);
            
            if (!waveDetailsRes.ok) throw new Error('Failed to fetch wave details.');
            if (!allBatchesRes.ok) throw new Error('Failed to fetch product stock data.');

            const waveDetails = await waveDetailsRes.json();
            const allBatches: BatchProduct[] = await allBatchesRes.json();
            
            const ordersWithLocation = waveDetails.orders.map((order: any) => {
                const availableBatch = allBatches
                    .filter(b => b.sku === order.sku && b.stock > 0)
                    .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime())
                    [0];
                
                return {
                    id: order.id,
                    order_reference: order.order_reference,
                    sku: order.sku,
                    qty: order.qty,
                    location: availableBatch ? availableBatch.location : 'N/A - OOS?',
                    status: wave.status === 'Wave Progress' ? 'Assigned' : 'Picked',
                };
            });

            setWaveOrders(ordersWithLocation);
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
    
    const handlePrint = () => {
        const printableContent = document.getElementById('picklist-content');
        const printWindow = window.open('', '', 'height=600,width=800');

        if (printWindow && printableContent) {
            printWindow.document.write('<html><head><title>Print Picklist</title>');
            // You can add styles here for printing
            printWindow.document.write('<style> body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } .no-print { display: none; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printableContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    }


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
                                <CardDescription>A list of all order waves created.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 no-print">
                                <Button variant="outline" size="icon" onClick={() => fetchWaves()}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg" id="printable-content">
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
                                    ) : waves.length > 0 ? (
                                        waves.map(wave => (
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
                                                    <span>No waves have been created yet.</span>
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Details for Wave: {selectedWave?.wave_document_number}</DialogTitle>
                    </DialogHeader>
                    <div id="picklist-content">
                        {loadingDetails ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                            <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order Ref.</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waveOrders.length > 0 ? waveOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell>{order.order_reference}</TableCell>
                                                <TableCell>{order.sku}</TableCell>
                                                <TableCell>{order.qty}</TableCell>
                                                <TableCell>{order.location}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn('gap-1', order.status === 'Assigned' ? 'bg-orange-400' : 'bg-green-500')}>
                                                        {order.status === 'Assigned' ? <UserCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                             <TableRow><TableCell colSpan={5} className="text-center h-24">No orders found for this wave.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                             <div className="flex justify-end mt-4 no-print">
                                <Button onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Print Picklist
                                </Button>
                            </div>
                            </>
                        )}
                    </div>
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
