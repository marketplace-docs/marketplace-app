'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ProductOutDocument } from '@/types/product-out-document';
import type { InboundDocument } from '@/types/inbound-document';

type TransferDocument = (ProductOutDocument & { doc_type: 'product_out' }) | (InboundDocument & { doc_type: 'inbound' });

const transferStatuses = [
    'Issue - Internal Transfer Out From Warehouse',
    'Receipt - Internal Transfer In to Warehouse',
    'Issue - Internal Transfer out B2B',
    'Receipt - Internal Transfer In to B2B',
    'Issue - Internal Transfer out B2C',
    'Receipt - Internal Transfer In to B2C',
    'Receipt - Inbound',
];

const getStatusType = (status: string) => {
    if (status.startsWith('Issue')) return 'OUT';
    if (status.startsWith('Receipt')) return 'IN';
    return 'UNKNOWN';
}

export default function InternalTransferMonitoringPage() {
    const [documents, setDocuments] = useState<TransferDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [productOutRes, inboundRes] = await Promise.all([
                fetch('/api/product-out-documents'),
                fetch('/api/inbound-documents')
            ]);
            
            if (!productOutRes.ok) throw new Error('Failed to fetch product out documents');
            if (!inboundRes.ok) throw new Error('Failed to fetch inbound documents');
            
            const productOutData: ProductOutDocument[] = await productOutRes.json();
            const inboundData: InboundDocument[] = await inboundRes.json();

            const productOutTransfers = productOutData
                .filter(doc => transferStatuses.includes(doc.status))
                .map(doc => ({...doc, doc_type: 'product_out' as const }));

            const vendorTransfers = inboundData
                .filter(doc => doc.reference.startsWith('DOC-TRSF-VNR-'))
                .map(doc => ({ ...doc, status: 'Receipt - Inbound', doc_type: 'inbound' as const, location: 'Staging Area Inbound' }));

            const combinedData = [...productOutTransfers, ...vendorTransfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setDocuments(combinedData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const filteredData = useMemo(() => {
        return documents.filter(doc =>
            (('nodocument' in doc && doc.nodocument.toLowerCase().includes(searchTerm.toLowerCase())) ||
            ('reference' in doc && doc.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
            doc.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (statusFilter === 'All' || doc.status === statusFilter)
        );
    }, [documents, searchTerm, statusFilter]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    const handlePrevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Internal Transfer Monitoring</h1>
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
                                <CardTitle>Transfer History</CardTitle>
                                <CardDescription>A log of all internal stock movements, including from vendors.</CardDescription>
                            </div>
                             <div className="flex w-full md:w-auto items-center gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[280px]">
                                        <SelectValue placeholder="Filter by transfer type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Transfer Types</SelectItem>
                                        {transferStatuses.map(status => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input 
                                    placeholder="Search..." 
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
                                        <TableHead>Date</TableHead>
                                        <TableHead>No. Document</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((doc) => (
                                            <TableRow key={`${doc.id}-${doc.doc_type}`}>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell className="font-medium">
                                                    {'nodocument' in doc ? doc.nodocument : doc.reference}
                                                </TableCell>
                                                <TableCell>{doc.sku}</TableCell>
                                                <TableCell>{doc.barcode}</TableCell>
                                                <TableCell>{doc.location}</TableCell>
                                                <TableCell><Badge variant="outline">{doc.qty}</Badge></TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusType(doc.status) === 'IN' ? 'default' : 'destructive'} className="gap-1">
                                                        {getStatusType(doc.status) === 'IN' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                                        {getStatusType(doc.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {'main_status' in doc ? doc.main_status : doc.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No transfer documents found for the selected filters.
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
