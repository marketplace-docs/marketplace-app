
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Check, Send, Search, X, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PutawayDocument } from '@/types/putaway-document';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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

const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};


const InboundDetailDialog = ({ document: initialDoc }: { document: InboundDocument }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [document, setDocument] = useState(initialDoc);
    const [totalPutaway, setTotalPutaway] = useState(0);
    const [duration, setDuration] = useState('00:00:00');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const outstandingQty = document.qty - totalPutaway;

    useEffect(() => {
        setIsLoading(true);
        const fetchPutawayData = async () => {
            try {
                const response = await fetch('/api/putaway-documents');
                if (!response.ok) throw new Error('Failed to fetch putaway documents.');
                const allPutawayDocs: PutawayDocument[] = await response.json();
                
                const relatedPutaway = allPutawayDocs.filter(p => p.no_document === document.reference && p.sku === document.sku);
                const putawaySum = relatedPutaway.reduce((sum, current) => sum + current.qty, 0);
                setTotalPutaway(putawaySum);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPutawayData();
    }, [document.reference, document.sku, toast]);
    
     useEffect(() => {
        const calculateDuration = () => {
            if (document.main_status === 'Done') {
                // If you add an `updated_at` field for 'Done' status, you can calculate the final duration here.
                // For now, we stop the timer.
                return;
            }
            const startTime = new Date(document.date).getTime();
            const now = new Date().getTime();
            const diff = now - startTime;
            setDuration(formatDuration(diff));
        };

        calculateDuration(); // Initial calculation
        const intervalId = setInterval(calculateDuration, 1000);

        return () => clearInterval(intervalId);
    }, [document.date, document.main_status]);


    const handleStatusUpdate = async (newStatus: 'In Progress' | 'Done') => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/inbound-documents/${document.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ main_status: newStatus, user }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update status.');
            }
            const updatedDoc = await response.json();
            setDocument(updatedDoc); // Update local state to reflect change
            toast({ title: "Status Updated", description: `Task status changed to ${newStatus}` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Putaway Task List of {document.reference}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex justify-end mb-4">
                        <div className="relative w-64">
                            <Input placeholder="Search..." />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
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
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                 ) : (
                                <>
                                <TableRow>
                                    <TableCell>{document.barcode}</TableCell>
                                    <TableCell>{document.sku}</TableCell>
                                    <TableCell>{document.received_by}</TableCell>
                                    <TableCell>
                                        <Badge variant={document.main_status === 'Assign' ? 'secondary' : (document.main_status === 'In Progress' ? 'default' : 'default')}
                                          className={
                                            document.main_status === 'In Progress' ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80' : 
                                            document.main_status === 'Done' ? 'bg-green-500 hover:bg-green-600/80' : ''
                                          }
                                        >
                                          {document.main_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{duration}</TableCell>
                                    <TableCell>{document.qty}</TableCell>
                                    <TableCell>{totalPutaway}</TableCell>
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
                                                <div><p className="font-semibold">Exp Date</p><p>{format(new Date(document.exp_date), 'yyyy-MM-dd')}</p></div>
                                                <div><p className="font-semibold">Condition</p><p>Normal</p></div>
                                                <div><p className="font-semibold">Received</p><p>{document.qty}</p></div>
                                                <div><p className="font-semibold">Putaway</p><p>{totalPutaway}</p></div>
                                                <div><p className="font-semibold">Outstanding</p><p>{outstandingQty}</p></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-right text-sm text-muted-foreground mt-2">1-1 of 1</div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => handleStatusUpdate('Done')} disabled={isLoading || document.main_status === 'Done'}>
                           <Check className="h-4 w-4 mr-2"/> Mark as Done
                        </Button>
                         <Button variant="outline" onClick={() => handleStatusUpdate('In Progress')} disabled={isLoading || document.main_status !== 'Assign'}>
                           <Send className="h-4 w-4 mr-2" /> Start Task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const InboundMonitoringTable = ({ data, loading, onUpdate }: { data: InboundDocument[], loading: boolean, onUpdate: () => void }) => {
    return (
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
                            <Badge variant={item.main_status === 'Done' ? 'default' : (item.main_status === 'In Progress' ? 'default' : 'secondary')}
                                className={item.main_status === 'In Progress' ? 'bg-yellow-400 text-yellow-900' : (item.main_status === 'Done' ? 'bg-green-500' : '')}
                            >
                                {item.main_status}
                            </Badge>
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
};


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
                        <InboundMonitoringTable data={documents} loading={loading} onUpdate={fetchDocuments} />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
