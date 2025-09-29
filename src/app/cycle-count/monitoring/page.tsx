
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Pencil, Trash2, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import type { CycleCountDoc } from '@/types/cycle-count-doc';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { BatchProduct } from '@/types/batch-product';
import Link from 'next/link';

const statusVariantMap: { [key in CycleCountDoc['status']]: "default" | "secondary" | "destructive" | "outline" } = {
    'Pending': 'secondary',
    'In Progress': 'default',
    'Completed': 'default',
    'Cancelled': 'destructive',
};

const CountItemsDetail: React.FC<{ doc: CycleCountDoc }> = ({ doc }) => {
    const [isProductsDialogOpen, setProductsDialogOpen] = useState(false);
    const [productsInLocation, setProductsInLocation] = useState<BatchProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const { toast } = useToast();

    const locationName = doc.count_type === 'By Location' ? doc.items_to_count.split(',')[0].trim() : null;

    const handleViewProducts = async () => {
        if (!locationName) return;
        setIsLoadingProducts(true);
        setProductsDialogOpen(true);
        try {
            const response = await fetch('/api/master-product/batch-products');
            if (!response.ok) throw new Error('Failed to fetch product data.');
            
            const allProducts: BatchProduct[] = await response.json();
            const products = allProducts.filter(p => p.location.toLowerCase() === locationName.toLowerCase() && p.stock > 0);
            setProductsInLocation(products);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            setProductsDialogOpen(false);
        } finally {
            setIsLoadingProducts(false);
        }
    };


    if (doc.count_type === 'By Location' && locationName) {
        return (
            <Dialog open={isProductsDialogOpen} onOpenChange={setProductsDialogOpen}>
                <div className="flex items-center gap-2">
                    <span className="font-medium">{locationName}</span>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={handleViewProducts} className="h-7 w-7">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Products</span>
                        </Button>
                    </DialogTrigger>
                </div>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Products at Location: {locationName}</DialogTitle>
                        <DialogDescription>List of products with stock at this location according to the system.</DialogDescription>
                    </DialogHeader>
                    {isLoadingProducts ? (
                        <div className="h-48 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : productsInLocation.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Exp Date</TableHead>
                                        <TableHead>Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productsInLocation.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.sku}</TableCell>
                                            <TableCell>{p.barcode}</TableCell>
                                            <TableCell>{format(new Date(p.exp_date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell><Badge>{p.stock}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="py-4 text-center text-muted-foreground">No products with stock found at this location.</p>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

    return <span className="max-w-xs truncate">{doc.items_to_count}</span>;
};


export default function MonitoringCycleCountPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [docs, setDocs] = useState<CycleCountDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<CycleCountDoc | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const canUpdate = user?.role && ['Super Admin', 'Manager', 'Supervisor'].includes(user.role);
    const canDelete = user?.role === 'Super Admin';

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/cycle-count-docs');
            if (!response.ok) {
                throw new Error('Failed to fetch cycle count documents');
            }
            const data = await response.json();
            setDocs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);
    
    const filteredDocs = useMemo(() => {
        return docs.filter(doc =>
            doc.no_doc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.counter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.items_to_count.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [docs, searchTerm]);

    const totalPages = Math.ceil(filteredDocs.length / rowsPerPage);
    const paginatedDocs = filteredDocs.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm]);

    const handleOpenEditDialog = (doc: CycleCountDoc) => {
        setSelectedDoc({ ...doc });
        setEditDialogOpen(true);
    };

    const handleOpenDeleteDialog = (doc: CycleCountDoc) => {
        setSelectedDoc(doc);
        setDeleteDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        toast({ title: "Note", description: "Save functionality is not yet implemented." });
        setEditDialogOpen(false);
    };

    const handleDeleteDoc = async () => {
        if (!selectedDoc || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/cycle-count-docs/${selectedDoc.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': user.name,
                    'X-User-Email': user.email,
                    'X-User-Role': user.role,
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete document.');
            }
            toast({ title: 'Success', description: 'Cycle count document has been deleted.', variant: 'destructive'});
            fetchDocs();
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
                <h1 className="text-2xl font-bold">Monitoring Cycle Count</h1>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Cycle Count Documents</CardTitle>
                            <CardDescription>A list of all assigned cycle count tasks.</CardDescription>
                        </div>
                        <div className="w-full md:w-auto">
                             <Input 
                                placeholder="Search document, counter, items..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-80"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Document</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Counter Name</TableHead>
                                        <TableHead>Count Type</TableHead>
                                        <TableHead>Items to Count</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedDocs.length > 0 ? (
                                        paginatedDocs.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">{doc.no_doc}</TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{doc.counter_name}</TableCell>
                                                <TableCell>{doc.count_type}</TableCell>
                                                <TableCell>
                                                   <CountItemsDetail doc={doc} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariantMap[doc.status] || 'default'}>{doc.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={`/cycle-count/monitoring/${doc.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                                <span className="sr-only">View</span>
                                                            </Link>
                                                        </Button>
                                                        {canUpdate && (
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(doc)}>
                                                                <Pencil className="h-4 w-4" />
                                                                <span className="sr-only">Edit</span>
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(doc)}>
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No documents found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredDocs.length > 0 ? currentPage : 0} of {totalPages}
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
                                        {[5, 20, 50, 100].map((pageSize) => (
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

            <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Cycle Count Document</DialogTitle>
                    </DialogHeader>
                    {selectedDoc && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-counter_name">Counter Name</Label>
                                <Input id="edit-counter_name" value={selectedDoc.counter_name} onChange={(e) => setSelectedDoc({ ...selectedDoc, counter_name: e.target.value })} />
                            </div>
                             <div className="space-y-2">
                               <Label htmlFor="edit-count_type">Count Type</Label>
                                <Select value={selectedDoc.count_type} onValueChange={(value: 'By Location' | 'By SKU') => setSelectedDoc({ ...selectedDoc, count_type: value })}>
                                   <SelectTrigger id="edit-count_type"><SelectValue placeholder="Select Count Type" /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="By Location">By Location</SelectItem>
                                       <SelectItem value="By SKU">By SKU</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="edit-items_to_count">Locations / SKUs</Label>
                               <Textarea id="edit-items_to_count" value={selectedDoc.items_to_count} onChange={(e) => setSelectedDoc({ ...selectedDoc, items_to_count: e.target.value })}/>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="edit-status">Status</Label>
                                <Select value={selectedDoc.status} onValueChange={(value: CycleCountDoc['status']) => setSelectedDoc({ ...selectedDoc, status: value })}>
                                   <SelectTrigger id="edit-status"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="Pending">Pending</SelectItem>
                                       <SelectItem value="In Progress">In Progress</SelectItem>
                                       <SelectItem value="Completed">Completed</SelectItem>
                                       <SelectItem value="Cancelled">Cancelled</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                             <div className="space-y-2">
                               <Label htmlFor="edit-notes">Notes</Label>
                               <Textarea id="edit-notes" value={selectedDoc.notes || ''} onChange={(e) => setSelectedDoc({ ...selectedDoc, notes: e.target.value })}/>
                           </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the document <span className="font-semibold">{selectedDoc?.no_doc}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteDoc} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
