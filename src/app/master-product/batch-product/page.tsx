
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { PutawayDocument } from '@/types/putaway-document';

type ProductOutDocument = {
    id: string;
    sku: string;
    barcode: string;
    expDate: string;
    qty: number;
    status: 'Issue - Order' | 'Issue - Internal Transfer' | 'Issue - Adjustment Manual';
    date: string;
    validatedBy: string;
};

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    stock: number;
};

export default function BatchProductPage() {
    const [putawayDocs] = useLocalStorage<PutawayDocument[]>('putaway-documents', []);
    const [productOutDocs] = useLocalStorage<ProductOutDocument[]>('product-out-documents', []);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const inventoryData = useMemo(() => {
        const stockMap = new Map<string, AggregatedProduct>();

        // Process stock in from putaway documents
        putawayDocs.forEach(doc => {
            const key = doc.barcode;
            if (stockMap.has(key)) {
                stockMap.get(key)!.stock += doc.qty;
            } else {
                stockMap.set(key, {
                    sku: doc.sku,
                    barcode: doc.barcode,
                    brand: doc.brand,
                    expDate: doc.expDate,
                    stock: doc.qty,
                });
            }
        });
        
        // Process stock out from product out documents
        productOutDocs.forEach(doc => {
             const key = doc.barcode;
             if (stockMap.has(key)) {
                stockMap.get(key)!.stock -= doc.qty;
             }
        });

        return Array.from(stockMap.values());
    }, [putawayDocs, productOutDocs]);

    const filteredData = useMemo(() => {
        return inventoryData.filter(product =>
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventoryData, searchTerm]);

    useEffect(() => {
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
                <h1 className="text-2xl font-bold">Batch Product</h1>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>Current Stock</CardTitle>
                                <CardDescription>Data stok inventaris terkini berdasarkan barang masuk dan keluar.</CardDescription>
                            </div>
                             <Input 
                                placeholder="Search SKU, Barcode, or Brand..." 
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
                                        <TableHead>EXP Date</TableHead>
                                        <TableHead>Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((product) => (
                                            <TableRow key={product.barcode}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                                <TableCell>{format(new Date(product.expDate), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>
                                                     <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="font-semibold">
                                                        {product.stock.toLocaleString()}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <PackageSearch className="h-8 w-8" />
                                                    <span>No inventory data found.</span>
                                                </div>
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
