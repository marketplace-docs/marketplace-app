

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format, differenceInMonths, isBefore } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, PackageSearch, AlertCircle, ShoppingCart, Clock, Ban, Trash2, ChevronDown, ChevronUp, ShieldQuestion, HeartCrack, Store, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type ProductStatus = 'All' | 'Sellable' | 'Expiring' | 'Expired' | 'Out of Stock' | 'Quarantine' | 'Damaged' | 'Marketplace' | 'Sensitive MP';

type BatchProduct = {
    id: string;
    sku: string;
    name: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
    status: ProductStatus;
};

type AggregatedBySku = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
    totalStock: number;
    batches: BatchProduct[];
};

const statusVariantMap: Record<Omit<ProductStatus, 'All'>, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Sellable': 'default',
    'Expiring': 'secondary',
    'Expired': 'destructive',
    'Out of Stock': 'outline',
    'Quarantine': 'outline',
    'Damaged': 'destructive',
    'Marketplace': 'default',
    'Sensitive MP': 'secondary',
};

const KpiCard = ({ title, value, icon: Icon, className, isLoading }: { title: string; value: number; icon: React.ElementType, className?: string, isLoading: boolean }) => (
    <Card className={cn("border-l-4", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{value.toLocaleString()}</div>}
        </CardContent>
    </Card>
);


export default function BatchProductPage() {
    const [inventoryData, setInventoryData] = useState<BatchProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProductStatus>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { user } = useAuth();
    const { toast } = useToast();

    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBatchToDelete, setSelectedBatchToDelete] = useState<BatchProduct | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [openAccordion, setOpenAccordion] = useState<string[]>([]);

    const isSuperAdmin = user?.role === 'Super Admin';

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

    const aggregatedAndFilteredData = useMemo(() => {
        const productMap = new Map<string, AggregatedBySku>();

        inventoryData.forEach(product => {
            if (!productMap.has(product.sku)) {
                productMap.set(product.sku, {
                    sku: product.sku,
                    name: product.name,
                    barcode: product.barcode,
                    brand: product.brand,
                    totalStock: 0,
                    batches: [],
                });
            }
            const existing = productMap.get(product.sku)!;
            existing.totalStock += product.stock;
            existing.batches.push(product);
        });

        const allAggregated = Array.from(productMap.values());
        
        return allAggregated.filter(product => {
             const matchesSearch = product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'All' || product.batches.some(batch => batch.status === statusFilter);
            
            return matchesSearch && matchesStatus;
        }).map(product => {
            if (statusFilter !== 'All') {
                return {
                    ...product,
                    batches: product.batches.filter(batch => batch.status === statusFilter),
                };
            }
            return product;
        });

    }, [inventoryData, searchTerm, statusFilter]);


    const kpiData = useMemo(() => {
        return inventoryData.reduce((acc, product) => {
            if (product.status === 'Sellable') acc.sellable += 1;
            if (product.status === 'Expiring') acc.expiring += 1;
            if (product.status === 'Out of Stock') acc.outOfStock += 1;
            return acc;
        }, { sellable: 0, expiring: 0, outOfStock: 0 });
    }, [inventoryData]);


    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm, statusFilter]);

    const totalPages = Math.ceil(aggregatedAndFilteredData.length / rowsPerPage);
    const paginatedData = aggregatedAndFilteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleOpenDeleteDialog = (batch: BatchProduct) => {
        setSelectedBatchToDelete(batch);
        setDeleteDialogOpen(true);
    };

    const handleDeleteAnomaly = async () => {
        if (!selectedBatchToDelete || !user || !isSuperAdmin) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/master-product/batch-products/delete-anomaly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    batch: selectedBatchToDelete,
                    user,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete anomaly');
            }
            toast({ title: "Success", description: "Stock anomaly has been resolved." });
            await fetchInventoryData();
            setDeleteDialogOpen(false);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
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
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProductStatus)}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Statuses</SelectItem>
                                        <SelectItem value="Sellable">Sellable</SelectItem>
                                        <SelectItem value="Expiring">Expiring</SelectItem>
                                        <SelectItem value="Expired">Expired</SelectItem>
                                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                        <SelectItem value="Quarantine">Quarantine</SelectItem>
                                        <SelectItem value="Damaged">Damaged</SelectItem>
                                        <SelectItem value="Marketplace">Marketplace</SelectItem>
                                        <SelectItem value="Sensitive MP">Sensitive MP</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} asChild>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Name Product</TableHead>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Brand</TableHead>
                                            <TableHead>Total Stock</TableHead>
                                            <TableHead className="w-12 text-right"></TableHead>
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
                                            <AccordionItem value={product.sku} key={product.sku}>
                                                <React.Fragment>
                                                <TableRow>
                                                    <TableCell className="font-medium">{product.sku}</TableCell>
                                                    <TableCell>{product.name}</TableCell>
                                                    <TableCell>{product.barcode}</TableCell>
                                                    <TableCell>{product.brand}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={product.totalStock > 0 ? 'default' : 'destructive'} className="font-semibold text-base">
                                                            {product.totalStock.toLocaleString()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="w-12 text-right">
                                                        <AccordionTrigger className="p-2 -mr-2 [&[data-state=open]>svg]:rotate-180">
                                                            <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                                                        </AccordionTrigger>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={6} className="p-0 border-0">
                                                        <AccordionContent>
                                                            <div className="p-4 bg-muted/50">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Location</TableHead>
                                                                            <TableHead>EXP Date</TableHead>
                                                                            <TableHead>Stock</TableHead>
                                                                            <TableHead>Status</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {product.batches.map((batch) => (
                                                                            <TableRow key={`${batch.id}-${batch.location}-${batch.exp_date}`}>
                                                                                <TableCell>{batch.location}</TableCell>
                                                                                <TableCell>{format(new Date(batch.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                                                <TableCell>
                                                                                    <Badge variant={batch.stock > 0 ? 'secondary' : 'destructive'}>
                                                                                        {batch.stock.toLocaleString()}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Badge variant={statusVariantMap[batch.status]}
                                                                                            className={cn({
                                                                                                'bg-green-500 hover:bg-green-500/80': batch.status === 'Sellable',
                                                                                                'bg-yellow-500 hover:bg-yellow-500/80 text-black': batch.status === 'Expiring',
                                                                                                'bg-gray-500 hover:bg-gray-500/80': batch.status === 'Quarantine',
                                                                                                'border-red-500 text-red-500': batch.status === 'Damaged',
                                                                                                'bg-blue-500 hover:bg-blue-500/80': batch.status === 'Marketplace',
                                                                                                'bg-purple-500 hover:bg-purple-500/80': batch.status === 'Sensitive MP',
                                                                                            })}
                                                                                        >
                                                                                            {batch.status}
                                                                                        </Badge>
                                                                                        {isSuperAdmin && batch.stock < 0 && (
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="h-6 w-6 text-destructive hover:text-destructive/90"
                                                                                                onClick={() => handleOpenDeleteDialog(batch)}
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </AccordionContent>
                                                    </TableCell>
                                                </TableRow>
                                                </React.Fragment>
                                            </AccordionItem>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                         <PackageSearch className="h-8 w-8" />
                                                         <span>No inventory data found.</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Accordion>
                       </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {aggregatedAndFilteredData.length > 0 ? currentPage : 0} of {totalPages}
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
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Stock Anomaly?</DialogTitle>
                        <DialogDescription>
                            This will delete the outgoing transaction documents that caused the negative stock for barcode <span className="font-bold">{selectedBatchToDelete?.barcode}</span> at location <span className="font-bold">{selectedBatchToDelete?.location}</span>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteAnomaly} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Resolve Anomaly
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </MainLayout>
    );
}
