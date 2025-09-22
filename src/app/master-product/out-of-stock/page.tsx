
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, PackageSearch, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

type BatchProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

export default function OutOfStockPage() {
    const [inventoryData, setInventoryData] = useState<BatchProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();

    const fetchInventoryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/master-product/batch-products');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch inventory data');
            }
            const data: BatchProduct[] = await response.json();
            setInventoryData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventoryData();
    }, [fetchInventoryData]);

    const outOfStockData = useMemo(() => {
        const productMap = new Map<string, { sku: string; barcode: string; brand: string; totalStock: number; lastLocation: string }>();

        inventoryData.forEach(product => {
            if (!productMap.has(product.sku)) {
                productMap.set(product.sku, {
                    sku: product.sku,
                    barcode: product.barcode,
                    brand: product.brand,
                    totalStock: 0,
                    lastLocation: product.location,
                });
            }
            const existing = productMap.get(product.sku)!;
            existing.totalStock += product.stock;
            existing.lastLocation = product.location;
        });

        return Array.from(productMap.values()).filter(p => p.totalStock <= 0);
    }, [inventoryData]);

    const filteredData = useMemo(() => {
        return outOfStockData.filter(product =>
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [outOfStockData, searchTerm]);

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
            toast({ variant: "destructive", title: "No Data", description: "There is no out-of-stock data to export." });
            return;
        }
        const headers = ["SKU", "Barcode", "Brand", "Last Known Location"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.sku.replace(/"/g, '""')}"`,
                `"${item.barcode.replace(/"/g, '""')}"`,
                `"${item.brand.replace(/"/g, '""')}"`,
                `"${item.lastLocation.replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("download", `out_of_stock_report_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Out of stock data exported." });
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Out of Stock Report</h1>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total SKU Out of Stock</CardTitle>
                            <PackageSearch className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{outOfStockData.length.toLocaleString()}</div>}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>Out of Stock Products</CardTitle>
                                <CardDescription>List of all products with a total stock of zero or less.</CardDescription>
                            </div>
                             <div className="flex w-full md:w-auto items-center gap-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
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
                                        <TableHead>Last Known Location</TableHead>
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
                                            <TableRow key={product.sku}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                                <TableCell>{product.lastLocation}</TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive">{product.totalStock.toLocaleString()}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                     <PackageSearch className="h-8 w-8" />
                                                     <span>No out-of-stock products found.</span>
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
