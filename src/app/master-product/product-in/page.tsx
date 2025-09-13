
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type PutawayDocument = {
    id: string;
    no_document: string;
    date: string;
    qty: number;
    status: 'Done' | 'Pending';
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    check_by: string;
};

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    qty: number;
    status: 'Done' | 'Pending';
};

const statusVariantMap: { [key in PutawayDocument['status']]: "default" | "secondary" } = {
    'Done': 'default',
    'Pending': 'secondary',
};

export default function ProductInPage() {
    const [putawayDocs, setPutawayDocs] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    
    const fetchPutawayDocs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) throw new Error('Failed to fetch putaway documents');
            const data = await response.json();
            setPutawayDocs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPutawayDocs();
    }, [fetchPutawayDocs]);


    const aggregatedData = useMemo(() => {
        const productMap = new Map<string, AggregatedProduct>();
        
        const sortedDocs = [...putawayDocs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        sortedDocs.forEach(doc => {
            if (productMap.has(doc.sku)) {
                const existing = productMap.get(doc.sku)!;
                existing.qty += doc.qty;
            } else {
                productMap.set(doc.sku, {
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: doc.brand,
                    exp_date: doc.exp_date,
                    location: doc.location,
                    qty: doc.qty,
                    status: doc.status,
                });
            }
        });

        return Array.from(productMap.values());
    }, [putawayDocs]);

    const filteredData = useMemo(() => {
        return aggregatedData.filter(product =>
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [aggregatedData, searchTerm]);
    
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
    
    const handleExport = () => {
        if (filteredData.length === 0) {
            toast({
                variant: "destructive",
                title: "No Data",
                description: "There is no data to export.",
            });
            return;
        }
        const headers = ["SKU", "Barcode", "Brand", "EXP Date", "Location", "Quantity", "Status"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.sku.replace(/"/g, '""')}"`,
                `"${item.barcode.replace(/"/g, '""')}"`,
                `"${item.brand.replace(/"/g, '""')}"`,
                `"${format(new Date(item.exp_date), "yyyy-MM-dd")}"`,
                `"${item.location.replace(/"/g, '""')}"`,
                item.qty,
                item.status
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `goods_receipt_data_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Goods receipt data exported." });
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Goods Receipt</h1>
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
                                <CardTitle>Goods Receipt</CardTitle>
                                <CardDescription>Aggregate stock data of received items from putaway.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                                <Input 
                                    placeholder="Search SKU or Barcode..." 
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
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>EXP</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((product) => (
                                            <TableRow key={product.sku}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                                <TableCell>{format(new Date(product.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{product.location}</TableCell>
                                                <TableCell>{product.qty.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariantMap[product.status] || 'default'}>
                                                        {product.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No incoming product data.
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
