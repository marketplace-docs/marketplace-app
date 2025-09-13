
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format, differenceInMonths } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, PackageSearch, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { BatchProduct } from '@/types/batch-product';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type ProductStatus = 'Sellable' | 'Expiring' | 'Expired';

const getProductStatus = (expDate: string): ProductStatus => {
    const today = new Date();
    const expiryDate = new Date(expDate);
    const monthsUntilExpiry = differenceInMonths(expiryDate, today);

    if (monthsUntilExpiry < 3) {
        return 'Expired';
    }
    if (monthsUntilExpiry <= 9) {
        return 'Expiring';
    }
    return 'Sellable';
};

const statusVariantMap: Record<ProductStatus, 'default' | 'secondary' | 'destructive'> = {
    'Sellable': 'default',
    'Expiring': 'secondary',
    'Expired': 'destructive',
};


export default function BatchProductPage() {
    const [inventoryData, setInventoryData] = useState<BatchProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchInventoryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/master-product/batch-products');
            if (!response.ok) {
                throw new Error('Failed to fetch inventory data');
            }
            const data: Omit<BatchProduct, 'status'>[] = await response.json();
            const dataWithStatus = data.map(product => ({
                ...product,
                status: getProductStatus(product.exp_date)
            }));
            setInventoryData(dataWithStatus);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventoryData();
    }, [fetchInventoryData]);


    const filteredData = useMemo(() => {
        return inventoryData.filter(product =>
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [inventoryData, searchTerm]);

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
                                <CardTitle>Stock Overview</CardTitle>
                                <CardDescription>Up-to-date stock information from goods received and issued.</CardDescription>
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
                                        <TableHead>Location</TableHead>
                                        <TableHead>Stock</TableHead>
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
                                            <TableRow key={product.barcode}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                                <TableCell>{format(new Date(product.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{product.location}</TableCell>
                                                <TableCell>
                                                     <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="font-semibold">
                                                        {product.stock.toLocaleString()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariantMap[product.status]}
                                                        className={cn({
                                                            'bg-green-500 hover:bg-green-500/80': product.status === 'Sellable',
                                                            'bg-yellow-500 hover:bg-yellow-500/80 text-black': product.status === 'Expiring',
                                                        })}
                                                    >
                                                        {product.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
