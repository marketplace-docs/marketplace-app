
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { PutawayDocument } from '@/types/putaway-document';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    qty: number;
    status: 'Done' | 'Pending';
};

const statusVariantMap: { [key in PutawayDocument['status']]: "default" | "secondary" } = {
    'Done': 'default',
    'Pending': 'secondary',
};

export default function ProductInPage() {
    const [putawayDocs] = useLocalStorage<PutawayDocument[]>('putaway-documents', []);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const aggregatedData = useMemo(() => {
        const productMap = new Map<string, AggregatedProduct>();
        
        // Sort documents by date to ensure the latest data is used for non-qty fields
        const sortedDocs = [...putawayDocs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        sortedDocs.forEach(doc => {
            if (productMap.has(doc.sku)) {
                // SKU exists, just add quantity
                const existing = productMap.get(doc.sku)!;
                existing.qty += doc.qty;
            } else {
                // New SKU, add to map
                productMap.set(doc.sku, {
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: doc.brand,
                    expDate: doc.expDate,
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
        // Simulate initial loading
        setTimeout(() => setLoading(false), 500);
    }, []);
    
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
                <h1 className="text-2xl font-bold">Product In</h1>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>Penerimaan Barang</CardTitle>
                                <CardDescription>Data stok barang masuk agregat dari hasil putaway.</CardDescription>
                            </div>
                             <Input 
                                placeholder="Cari SKU atau Barcode..." 
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
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>EXP</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((product) => (
                                            <TableRow key={product.sku}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                                <TableCell>{format(new Date(product.expDate), 'dd/MM/yyyy')}</TableCell>
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
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data produk masuk.
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
