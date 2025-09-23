
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, PackageSearch, RefreshCw, Printer, List, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
    customer: string;
    city: string;
};


export default function MonitoringOrdersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWaves();
    }, [fetchWaves]);
    
    const handlePrint = () => {
        window.print();
    };
    
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
    
    const handleViewDetails = async (wave: Wave) => {
        setSelectedWave(wave);
        setDetailsDialogOpen(true);
        setLoadingDetails(true);
        try {
            const response = await fetch(`/api/waves/${wave.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch wave details.');
            }
            const data = await response.json();
            setWaveOrders(data.orders);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoadingDetails(false);
        }
    };


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
                                <Button variant="outline" size="icon" onClick={fetchWaves}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handlePrint}>
                                    <Printer className="h-4 w-4" />
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
                    {loadingDetails ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order Ref.</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>City</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {waveOrders.length > 0 ? waveOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>{order.order_reference}</TableCell>
                                            <TableCell>{order.sku}</TableCell>
                                            <TableCell>{order.qty}</TableCell>
                                            <TableCell>{order.customer}</TableCell>
                                            <TableCell>{order.city}</TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={5} className="text-center h-24">No orders found for this wave.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                @media print {
                  body > * {
                    visibility: hidden;
                  }
                  #printable-content, #printable-content * {
                    visibility: visible;
                  }
                   #printable-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none;
                  }
                  .no-print {
                    display: none !important;
                  }
                   @page {
                    size: auto;
                    margin: 0.5in;
                  }
                }
            `}</style>
        </MainLayout>
    );
}
