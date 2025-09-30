'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Upload, Download, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

type MasterProduct = {
    id: number;
    sku: string;
    name: string; // Assuming 'name' field exists
    barcode: string;
    brand: string;
    created_at: string;
};

export default function MasterProductManagementPage() {
    const [products, setProducts] = useState<MasterProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/master-products');
            if (!response.ok) throw new Error('Failed to fetch master product data');
            const data: MasterProduct[] = await response.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        return products.filter(product =>
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
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
    
    const handleExport = () => {
        if (filteredData.length === 0) {
          toast({ variant: "destructive", title: "No Data", description: "There is no data to export." });
          return;
        }
        const headers = ["sku", "name", "barcode", "brand"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.sku.replace(/"/g, '""')}"`,
                `"${item.name.replace(/"/g, '""')}"`,
                `"${item.barcode.replace(/"/g, '""')}"`,
                `"${item.brand.replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `master_products_data_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Master products data exported." });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user', JSON.stringify(user));

        try {
            const response = await fetch('/api/master-products', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'An unknown error occurred during upload.');
            }
            
            await fetchData();
            setUploadDialogOpen(false);
            
            const { successCount, errorCount, errors } = result;

            if (errorCount > 0) {
                 toast({
                    variant: "destructive",
                    title: "Partial Upload Success",
                    description: `${successCount} products uploaded. ${errorCount} rows failed. Check console for details.`
                });
                console.error("Failed CSV Rows:", errors);
            } else {
                 toast({ title: "Success", description: `${successCount} products uploaded successfully.` });
            }

        } catch (error: any) {
             toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Master Product Database</h1>
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
                                <CardTitle>Product List</CardTitle>
                                <CardDescription>Database pusat untuk semua data master produk.</CardDescription>
                            </div>
                             <div className="flex w-full md:w-auto items-center gap-2">
                                <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Upload Master Product CSV</DialogTitle>
                                            <DialogDescription>
                                                Pilih file CSV untuk mengunggah data produk secara massal. Header yang dibutuhkan: `sku`, `name`, `barcode`, `brand`.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                           <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                                           </Button>
                                           <p className="text-xs text-muted-foreground mt-2">
                                                Tidak punya template? <a href="/templates/master_products_template.csv" download className="underline text-primary">Unduh template CSV</a>
                                           </p>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                                <Input 
                                    placeholder="Search SKU, Name, Barcode, or Brand..." 
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
                                        <TableHead>Name Product</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Brand</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((product, index) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.sku}</TableCell>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell>{product.barcode}</TableCell>
                                                <TableCell>{product.brand}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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
