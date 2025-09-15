
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, AlertCircle, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isValid, isBefore } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ProductOutStatus = 
    | 'Issue - Order' 
    | 'Issue - Internal Transfer' 
    | 'Issue - Adjustment Manual'
    | 'Adjusment - Loc'
    | 'Adjustment - SKU'
    | 'Issue - Putaway'
    | 'Receipt - Putaway'
    | 'Issue - Return'
    | 'Issue - Return Putaway';

type ProductOutDocument = {
    id: string;
    nodocument: string;
    sku: string;
    barcode: string;
    expdate: string;
    location: string;
    qty: number;
    status: ProductOutStatus;
    date: string; // ISO String
    validatedby: string;
};

type AggregatedProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

export default function ProductOutPage() {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [documents, setDocuments] = useState<ProductOutDocument[]>([]);
    const [productInStock, setProductInStock] = useState<AggregatedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    
    const [newDocument, setNewDocument] = useState({
        nodocument: '',
        sku: '',
        barcode: '',
        expdate: '',
        location: '',
        qty: '',
        status: 'Issue - Order' as ProductOutStatus,
    });
    const [availableStock, setAvailableStock] = useState<AggregatedProduct | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'].includes(user.role);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [outDocsRes, stockRes] = await Promise.all([
                fetch('/api/product-out-documents'),
                fetch('/api/master-product/batch-products')
            ]);
            
            if (!outDocsRes.ok) throw new Error('Failed to fetch product out documents');
            if (!stockRes.ok) throw new Error('Failed to fetch product stock');
            
            const outDocsData = await outDocsRes.json();
            const stockData = await stockRes.json();
            
            setDocuments(outDocsData);
            setProductInStock(stockData);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalPages = Math.ceil(documents.length / rowsPerPage);
    const paginatedDocuments = documents.slice(
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
    }, [rowsPerPage]);


    const generateDocNumber = useCallback(async (status: ProductOutStatus) => {
        const year = new Date().getFullYear();
        let prefix = 'MP-ORD'; // Default
        
        if (status.startsWith('Issue - Order')) {
            prefix = `MP-ORD-${year}`;
        } else if (status.startsWith('Adjusment') || status.startsWith('Adjustment')) {
            prefix = `MP-ADJ-${year}`;
        } else if (status.startsWith('Issue - Internal Transfer')) {
            prefix = `MP-TRSF-${year}`;
        } else if (status.startsWith('Issue - Return')) {
            prefix = `MP-RTN-${year}`;
        } else {
             prefix = `MP-GEN-${year}`; // Generic prefix for others
        }
        
        // This is a simplified client-side estimation. The real unique number is generated by the backend.
        const nextId = (documents.length + 1).toString().padStart(5, '0');
        return `${prefix}-${nextId}`;
    }, [documents]);

    useEffect(() => {
        if (isAddDialogOpen) {
            generateDocNumber(newDocument.status).then(docNumber => {
                setNewDocument(prev => ({ ...prev, nodocument: docNumber }));
            });
        }
    }, [isAddDialogOpen, newDocument.status, generateDocNumber]);
    
    useEffect(() => {
        if (newDocument.barcode) {
            const allBatchesForBarcode = productInStock.filter(p => p.barcode === newDocument.barcode && p.stock > 0);
            
            if (allBatchesForBarcode.length > 0) {
                 // FEFO logic: sort by nearest expiration date
                const sortedBatches = allBatchesForBarcode.sort((a, b) => 
                    new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime()
                );
                const bestBatch = sortedBatches[0];
                setAvailableStock(bestBatch);
                setNewDocument(prev => ({ ...prev, sku: bestBatch.sku, expdate: bestBatch.exp_date, location: bestBatch.location }));
            } else {
                setAvailableStock(null);
                setNewDocument(prev => ({ ...prev, sku: '', expdate: '', location: '' }));
            }
        } else {
            setAvailableStock(null);
            setNewDocument(prev => ({ ...prev, sku: '', expdate: '', location: '' }));
        }
    }, [newDocument.barcode, productInStock]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewDocument(prev => ({...prev, [name]: value}));
    };
    
    const handleSelectChange = (value: ProductOutStatus) => {
        setNewDocument(prev => ({ ...prev, status: value }));
        generateDocNumber(value).then(docNumber => {
            setNewDocument(prev => ({ ...prev, nodocument: docNumber }));
        });
    };

    const resetForm = () => {
        setNewDocument({ nodocument: '', sku: '', barcode: '', expdate: '', location: '', qty: '', status: 'Issue - Order' });
        setAvailableStock(null);
    };

    const handleAddDocument = async () => {
        const qtyToTake = parseInt(newDocument.qty, 10);
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
            return;
        }
        if (!newDocument.nodocument || !newDocument.barcode || !newDocument.qty) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Document No, Barcode and Quantity are required.',
            });
            return;
        }
        if (!availableStock) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Product not found in stock or has no available quantity.',
            });
            return;
        }
         if (availableStock.stock <= 0) {
            toast({
                variant: "destructive",
                title: "Stock is Zero",
                description: `This batch has 0 stock. Please re-book to another location with available stock.`
            });
            return;
        }
        if (qtyToTake <= 0) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Quantity must be greater than zero.',
            });
            return;
        }
         if (qtyToTake > availableStock.stock) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Quantity exceeds available stock of ${availableStock.stock.toLocaleString()}.`,
            });
            return;
        }

        setIsSubmitting(true);
        
        const docToAdd = {
            sku: newDocument.sku,
            barcode: newDocument.barcode,
            expdate: newDocument.expdate,
            location: newDocument.location,
            qty: qtyToTake,
            status: newDocument.status,
            date: new Date().toISOString(),
            validatedby: user.name,
        };

        try {
            const response = await fetch('/api/product-out-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: [docToAdd], user }),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save document to database.');
            }

            await fetchData();
            
            setIsSubmitting(false);
            setAddDialogOpen(false);
            resetForm();
            toast({
                title: 'Success',
                description: 'Product out document has been created.',
            });
        } catch (error: any) {
            setIsSubmitting(false);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const handleExport = () => {
        if (documents.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to export." });
            return;
        }
        const headers = ["nodocument", "date", "sku", "barcode", "expdate", "location", "qty", "status", "validatedby"];
        const csvContent = [
            headers.join(","),
            ...documents.map(doc => [
                `"${doc.nodocument}"`,
                `"${format(new Date(doc.date), "yyyy-MM-dd HH:mm:ss")}"`,
                `"${doc.sku}"`,
                `"${doc.barcode}"`,
                `"${doc.expdate ? format(new Date(doc.expdate), "yyyy-MM-dd") : ''}"`,
                `"${doc.location}"`,
                doc.qty,
                `"${doc.status}"`,
                `"${doc.validatedby}"`
            ].join(","))
        ].join("\n");
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `goods_issue_data_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Goods issue data exported." });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsSubmitting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length <= 1) throw new Error("CSV is empty or has only a header.");
    
                const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
                const requiredHeaders = ['nodocument', 'sku', 'barcode', 'qty', 'status'];
                if (!requiredHeaders.every(h => header.includes(h))) {
                    throw new Error(`Invalid CSV. Required headers: ${requiredHeaders.join(', ')}`);
                }
    
                const docsToUpload = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const entry: { [key: string]: string } = {};
                    header.forEach((h, i) => entry[h] = values[i]?.trim().replace(/"/g, ''));
                    
                    const foundStock = productInStock.find(p => p.barcode === entry.barcode);
                    
                    return {
                        nodocument: entry.nodocument,
                        sku: entry.sku,
                        barcode: entry.barcode,
                        expdate: foundStock?.exp_date || new Date().toISOString(),
                        location: foundStock?.location || 'N/A',
                        qty: parseInt(entry.qty, 10),
                        status: entry.status as ProductOutStatus,
                        date: new Date().toISOString(),
                        validatedby: user.name,
                    };
                }).filter(Boolean);
    
                const response = await fetch('/api/product-out-documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documents: docsToUpload, user })
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload data');
                }
    
                await fetchData();
                setUploadDialogOpen(false);
                toast({ title: "Success", description: `${docsToUpload.length} documents uploaded.` });
    
            } catch (error: any) {
                toast({ variant: "destructive", title: "Upload Failed", description: error.message });
            } finally {
                setIsSubmitting(false);
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Goods Issue</h1>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Goods Issue</CardTitle>
                            <CardDescription>Stock data of issued items. This feature deducts stock from Product In.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                           {canCreate && (
                            <>
                              <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                  <DialogTrigger asChild>
                                      <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                      <DialogHeader>
                                          <DialogTitle>Upload Goods Issue CSV</DialogTitle>
                                          <DialogDescription>
                                              Select a CSV file to bulk upload documents. Required headers: nodocument, sku, barcode, qty, status.
                                          </DialogDescription>
                                      </DialogHeader>
                                      <div className="py-4">
                                         <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                         <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                                         </Button>
                                      </div>
                                  </DialogContent>
                              </Dialog>
                               <Button variant="outline" onClick={handleExport}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Export
                              </Button>
                              <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if(!open) resetForm(); }}>
                                  <DialogTrigger asChild>
                                      <Button>
                                          <Plus className="mr-2 h-4 w-4" /> Add Goods Issue
                                      </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                      <DialogHeader>
                                          <DialogTitle>Add Goods Issue</DialogTitle>
                                           <DialogDescription>The system automatically selects the batch with the nearest expiration date (FEFO).</DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                           <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="nodocument" className="text-right">No. Document</Label>
                                              <Input id="nodocument" name="nodocument" value={newDocument.nodocument} className="col-span-3 bg-muted" readOnly />
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="barcode" className="text-right">Barcode</Label>
                                              <Input id="barcode" name="barcode" value={newDocument.barcode} onChange={handleInputChange} className="col-span-3" placeholder="Scan or enter barcode" />
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="sku" className="text-right">SKU</Label>
                                              <Input id="sku" name="sku" value={newDocument.sku} className="col-span-3 bg-muted" readOnly />
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="expdate" className="text-right">EXP Date</Label>
                                              <Input id="expdate" name="expdate" value={newDocument.expdate ? format(new Date(newDocument.expdate), 'yyyy-MM-dd') : ''} className="col-span-3 bg-muted" readOnly />
                                          </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="location" className="text-right">Location</Label>
                                              <Input id="location" name="location" value={newDocument.location} className="col-span-3 bg-muted" readOnly />
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="qty" className="text-right">Quantity</Label>
                                              <div className="col-span-3">
                                                  <Input id="qty" name="qty" type="number" value={newDocument.qty} onChange={handleInputChange} placeholder="0" />
                                                  {availableStock && <p className="text-xs text-muted-foreground mt-1">Available Stock: {availableStock.stock.toLocaleString()}</p>}
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                              <Label htmlFor="status" className="text-right">Status</Label>
                                              <Select value={newDocument.status} onValueChange={handleSelectChange}>
                                                  <SelectTrigger className="col-span-3">
                                                      <SelectValue placeholder="Select status" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="Issue - Order">Issue - Order</SelectItem>
                                                      <SelectItem value="Issue - Internal Transfer">Issue - Internal Transfer</SelectItem>
                                                      <SelectItem value="Issue - Adjustment Manual">Issue - Adjustment Manual</SelectItem>
                                                      <SelectItem value="Adjusment - Loc">Adjusment - Loc</SelectItem>
                                                      <SelectItem value="Adjustment - SKU">Adjustment - SKU</SelectItem>
                                                      <SelectItem value="Issue - Putaway">Issue - Putaway</SelectItem>
                                                      <SelectItem value="Receipt - Putaway">Receipt - Putaway</SelectItem>
                                                      <SelectItem value="Issue - Return">Issue - Return</SelectItem>
                                                      <SelectItem value="Issue - Return Putaway">Issue - Return Putaway</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                      </div>
                                      <DialogFooter>
                                          <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                                          <Button onClick={handleAddDocument} disabled={isSubmitting || !newDocument.nodocument}>
                                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                              Submit
                                          </Button>
                                      </DialogFooter>
                                  </DialogContent>
                              </Dialog>
                            </>
                           )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>EXP Date</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Validate By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedDocuments.length > 0 ? (
                                        paginatedDocuments.map((doc) => (
                                             <TableRow key={doc.id}>
                                                <TableCell>{doc.nodocument}</TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{doc.sku}</TableCell>
                                                <TableCell>{doc.barcode}</TableCell>
                                                <TableCell>{doc.expdate ? format(new Date(doc.expdate), 'dd/MM/yyyy') : '-'}</TableCell>
                                                <TableCell>{doc.location}</TableCell>
                                                <TableCell>{doc.qty.toLocaleString()}</TableCell>
                                                <TableCell>{doc.status}</TableCell>
                                                <TableCell>{doc.validatedby}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No goods issue data available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <div className="flex items-center justify-end space-x-2 py-4 w-full">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {documents.length > 0 ? currentPage : 0} of {totalPages}
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
                                        {[10, 30, 50, 100].map((pageSize) => (
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
                    </CardFooter>
                </Card>
            </div>
        </MainLayout>
    );
}
