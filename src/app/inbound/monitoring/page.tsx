

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Search, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceStrict } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PutawayDocument } from '@/types/putaway-document';
import { useToast } from '@/hooks/use-toast';

type InboundDocument = {
    id: number;
    reference: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    qty: number;
    date: string;
    received_by: string;
    main_status: 'Assign' | 'In Progress' | 'Done';
};


const InboundDetailDialog = ({ document: initialDoc }: { document: InboundDocument }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [putawayDocs, setPutawayDocs] = useState<PutawayDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [duration, setDuration] = useState('Calculating...');
    const { toast } = useToast();

    const totalPutaway = useMemo(() => {
        return putawayDocs.reduce((acc, doc) => acc + doc.qty, 0);
    }, [putawayDocs]);
    
    const outstandingQty = initialDoc.qty - totalPutaway;
    
    const currentStatus = useMemo(() => {
        if (outstandingQty <= 0) return 'Done';
        if (totalPutaway > 0) return 'On Progress';
        return 'Assign';
    }, [outstandingQty, totalPutaway]);

    useEffect(() => {
        const fetchPutawayData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/putaway-documents');
                if (!response.ok) throw new Error('Failed to fetch putaway history.');
                const allDocs: PutawayDocument[] = await response.json();
                
                const relatedDocs = allDocs.filter(doc => doc.no_document === initialDoc.reference);
                setPutawayDocs(relatedDocs);

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPutawayData();

    }, [initialDoc, toast]);
    
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        const calculateDuration = () => {
            const startTime = new Date(initialDoc.date);
            
            if (currentStatus === 'Done' && putawayDocs.length > 0) {
                 // Find the latest putaway document date
                const lastPutawayDate = putawayDocs.reduce((latest, doc) => {
                    const docDate = new Date(doc.date);
                    return docDate > latest ? docDate : latest;
                }, new Date(0));

                if (lastPutawayDate > new Date(0)) {
                    setDuration(formatDistanceStrict(lastPutawayDate, startTime));
                } else {
                     setDuration('N/A');
                }
                if(interval) clearInterval(interval);
            } else {
                // If not done, calculate from start time to now and update every second
                 setDuration(formatDistanceStrict(new Date(), startTime));
                 interval = setInterval(() => {
                    setDuration(formatDistanceStrict(new Date(), startTime));
                }, 1000);
            }
        };
        
        if (!isLoading) {
            calculateDuration();
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [initialDoc.date, currentStatus, putawayDocs, isLoading]);
    

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Putaway Task List of {initialDoc.reference}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Assign to</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Received Qty</TableHead>
                                    <TableHead>Total Putaway</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                <>
                                <TableRow>
                                    <TableCell>{initialDoc.barcode}</TableCell>
                                    <TableCell>{initialDoc.sku}</TableCell>
                                    <TableCell>{initialDoc.received_by}</TableCell>
                                    <TableCell>
                                        <Badge className={currentStatus === 'Done' ? 'bg-green-500' : 'bg-yellow-400 text-yellow-900'}>
                                          {currentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{duration}</TableCell>
                                    <TableCell>{initialDoc.qty.toLocaleString()}</TableCell>
                                    <TableCell>{totalPutaway.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {isExpanded && (
                                     <TableRow className="bg-muted/50">
                                        <TableCell colSpan={8} className="p-0">
                                            <div className="p-4 grid grid-cols-5 gap-4 text-sm">
                                                <div><p className="font-semibold">Exp Date</p><p>{format(new Date(initialDoc.exp_date), 'yyyy-MM-dd')}</p></div>
                                                <div><p className="font-semibold">Condition</p><p>Normal</p></div>
                                                <div><p className="font-semibold">Received</p><p>{initialDoc.qty.toLocaleString()}</p></div>
                                                <div><p className="font-semibold">Putaway</p><p>{totalPutaway.toLocaleString()}</p></div>
                                                <div><p className="font-semibold text-red-600">Outstanding</p><p className="font-bold text-red-600">{outstandingQty.toLocaleString()}</p></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const InboundMonitoringTable = ({ data, loading }: { data: InboundDocument[], loading: boolean }) => (
    <div className="border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Exp Date</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Main Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : data.length > 0 ? data.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.reference}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{format(new Date(item.exp_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{item.received_by}</TableCell>
                        <TableCell>{format(new Date(item.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        <TableCell>
                            <Badge variant={item.main_status === 'Done' ? 'default' : 'secondary'}>{item.main_status}</Badge>
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end">
                           <InboundDetailDialog document={item} />
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">No data available.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
);


export default function InboundMonitoringPage() {
    const [documents, setDocuments] = useState<InboundDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/inbound-documents');
            if (!response.ok) throw new Error('Failed to fetch inbound documents.');
            const data = await response.json();
            setDocuments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Inbound Monitoring</h1>
                 <Card>
                    <CardHeader>
                        <CardTitle>Inbound Monitoring</CardTitle>
                        <CardDescription>Monitor the status and perform actions on inbound items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <InboundMonitoringTable data={documents} loading={loading} />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
