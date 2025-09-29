
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Check, Send, Search, X, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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


const InboundDetailDialog = ({ document }: { document: InboundDocument }) => {
    const [isExpanded, setIsExpanded] = useState(true);

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
                                <TableRow>
                                    <TableCell>{document.barcode}</TableCell>
                                    <TableCell>{document.sku}</TableCell>
                                    <TableCell>{document.received_by}</TableCell>
                                    <TableCell>
                                        <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80">On Progress</Badge>
                                    </TableCell>
                                    <TableCell>00:00:00</TableCell>
                                    <TableCell>{document.qty}</TableCell>
                                    <TableCell>0</TableCell>
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
                                                <div><p className="font-semibold">Putaway</p><p>0</p></div>
                                                <div><p className="font-semibold">Outstanding</p><p>{document.qty}</p></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-right text-sm text-muted-foreground mt-2">1-1 of 1</div>
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
                            <Button variant="ghost" size="icon"><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon"><Send className="h-4 w-4 text-blue-600" /></Button>
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
