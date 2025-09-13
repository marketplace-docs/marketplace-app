
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PutawayDocument = {
  id: string; noDocument: string; date: string; qty: number; status: 'Done' | 'Pending'; sku: string; barcode: string; brand: string; expDate: string; location: string; checkBy: string;
};

type ProductOutDocument = {
  id: string; noDocument: string; sku: string; barcode: string; expDate: string; qty: number; status: 'Issue - Order' | 'Issue - Internal Transfer' | 'Issue - Adjustment Manual'; date: string; location: string; validatedBy: string;
};

type StockLogEntry = {
    id: string;
    date: string;
    noDocument: string;
    barcode: string;
    location: string;
    qty_before: number;
    qty_change: number;
    qty_after: number;
    status: string;
    validated_by: string;
    type: 'IN' | 'OUT';
};

export default function StockLogPage() {
    const [putawayDocs, setPutawayDocs] = useState<PutawayDocument[]>([]);
    const [productOutDocs, setProductOutDocs] = useState<ProductOutDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [putawayRes, productOutRes] = await Promise.all([
                fetch('/api/putaway-documents'),
                fetch('/api/product-out-documents')
            ]);
            if (!putawayRes.ok || !productOutRes.ok) {
                throw new Error('Failed to fetch stock data');
            }
            const putawayData = await putawayRes.json();
            const productOutData = await productOutRes.json();
            setPutawayDocs(putawayData);
            setProductOutDocs(productOutData);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stockLogData = useMemo(() => {
        const combinedDocs = [
            ...putawayDocs.map(doc => ({ ...doc, type: 'IN' as const, originalDate: new Date(doc.date) })),
            ...productOutDocs.map(doc => ({ ...doc, type: 'OUT' as const, originalDate: new Date(doc.date) })),
        ].sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());

        const stockLevels = new Map<string, number>();
        const logEntries: StockLogEntry[] = [];

        combinedDocs.forEach(doc => {
            const barcode = doc.barcode;
            const currentStock = stockLevels.get(barcode) || 0;
            const change = doc.qty;

            if (doc.type === 'IN') {
                const putawayDoc = doc as PutawayDocument;
                logEntries.push({
                    id: `in-${putawayDoc.id}`,
                    date: putawayDoc.date,
                    noDocument: putawayDoc.noDocument,
                    barcode: barcode,
                    location: putawayDoc.location,
                    qty_before: currentStock,
                    qty_change: change,
                    qty_after: currentStock + change,
                    status: 'Putaway',
                    validated_by: putawayDoc.checkBy,
                    type: 'IN',
                });
                stockLevels.set(barcode, currentStock + change);
            } else { // type === 'OUT'
                const outDoc = doc as ProductOutDocument;
                logEntries.push({
                    id: `out-${outDoc.id}`,
                    date: outDoc.date,
                    noDocument: outDoc.noDocument,
                    barcode: barcode,
                    location: outDoc.location,
                    qty_before: currentStock,
                    qty_change: -change,
                    qty_after: currentStock - change,
                    status: outDoc.status,
                    validated_by: outDoc.validatedBy,
                    type: 'OUT',
                });
                stockLevels.set(barcode, currentStock - change);
            }
        });

        // Sort descending by date for display
        return logEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [putawayDocs, productOutDocs]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return stockLogData;
        return stockLogData.filter(log =>
            log.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.noDocument.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stockLogData, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Stock Log</h1>
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
                                <CardTitle>Stock History</CardTitle>
                                <CardDescription>Stores historical data of incoming and outgoing items.</CardDescription>
                            </div>
                             <Input 
                                placeholder="Search Barcode or Document No..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-auto md:max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>No. Document</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Qty Before</TableHead>
                                        <TableHead>Qty Change</TableHead>
                                        <TableHead>Qty After</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Validate By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{format(new Date(log.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{log.noDocument}</TableCell>
                                                <TableCell className="font-medium">{log.barcode}</TableCell>
                                                <TableCell>{log.location}</TableCell>
                                                <TableCell>{log.qty_before.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={log.type === 'IN' ? 'default' : 'destructive'} className="gap-1">
                                                        {log.type === 'IN' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                                        {log.qty_change.toLocaleString()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{log.qty_after.toLocaleString()}</TableCell>
                                                <TableCell>{log.status}</TableCell>
                                                <TableCell>{log.validated_by}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No stock history.
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
        </MainLayout>
    );
}
