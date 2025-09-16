
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import marketplaceProductData from '@/lib/marketplace-product-data.json';

type MarketplaceProduct = {
    sku: string;
    barcode: string;
    brand: string;
};

export default function MarketplaceProductPage() {
    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        // Simulate fetching data
        setProducts(marketplaceProductData as MarketplaceProduct[]);
        setLoading(false);
    }, []);

    const filteredData = useMemo(() => {
        return products.filter(product =>
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

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
                <h1 className="text-2xl font-bold">Marketplace Product</h1>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>Product Database</CardTitle>
                                <CardDescription>A central database of all products available in the marketplace.</CardDescription>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <Input 
                                    placeholder="Search SKU, Barcode, or Brand..." 
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((product, index) => (
                                            <TableRow key={`${product.barcode}-${index}`}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                     <Package className="h-8 w-8" />
                                                     <span>No product data found.</span>
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
