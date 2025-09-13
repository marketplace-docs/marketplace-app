
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

type ProductOutStatus = 'Issue - Order' | 'Issue - Internal Transfer' | 'Issue - Adjustment Manual';

type ProductOutDocument = {
    id: string;
    noDocument: string;
    sku: string;
    barcode: string;
    expDate: string;
    qty: number;
    status: ProductOutStatus;
    date: string; // ISO String
    validatedBy: string;
};

type AggregatedProduct = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    qty: number;
};

export default function ProductOutPage() {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [documents, setDocuments] = useState<ProductOutDocument[]>([]);
    const [productInStock, setProductInStock] = useState<AggregatedProduct[]>([]);
    
    const [newDocument, setNewDocument] = useState({
        noDocument: '',
        sku: '',
        barcode: '',
        expDate: '',
        qty: '',
        status: 'Issue - Order' as ProductOutStatus,
    });
    const [availableStock, setAvailableStock] = useState<AggregatedProduct | null>(null);

    const fetchProductOutDocs = useCallback(async () => {
        try {
            const response = await fetch('/api/product-out-documents');
            if (!response.ok) throw new Error('Failed to fetch product out documents');
            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchProductInStock = useCallback(async () => {
        try {
            // This API gives the final aggregated stock.
            const response = await fetch('/api/master-product/batch-products');
            if (!response.ok) throw new Error('Failed to fetch product stock');
            const data = await response.json();
            setProductInStock(data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        fetchProductOutDocs();
        fetchProductInStock();
    }, [fetchProductOutDocs, fetchProductInStock]);


    useEffect(() => {
        if (isAddDialogOpen) {
            const currentYear = new Date().getFullYear();
            const nextId = (documents.length + 1).toString().padStart(5, '0');
            const newDocNumber = `PB-OUT-${currentYear}-${nextId}`;
            setNewDocument(prev => ({ ...prev, noDocument: newDocNumber }));
        }
    }, [isAddDialogOpen, documents]);

    useEffect(() => {
        if (newDocument.barcode) {
            const foundStock = productInStock.find(p => p.barcode === newDocument.barcode);
            if (foundStock) {
                setAvailableStock(foundStock);
                setNewDocument(prev => ({ ...prev, sku: foundStock.sku, expDate: foundStock.expDate }));
            } else {
                setAvailableStock(null);
                setNewDocument(prev => ({ ...prev, sku: '', expDate: '' }));
            }
        } else {
            setAvailableStock(null);
            setNewDocument(prev => ({ ...prev, sku: '', expDate: '' }));
        }
    }, [newDocument.barcode, productInStock]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewDocument(prev => ({...prev, [name]: value}));
    };
    
    const handleSelectChange = (value: ProductOutStatus) => {
        setNewDocument(prev => ({ ...prev, status: value }));
    };

    const resetForm = () => {
        setNewDocument({ noDocument: '', sku: '', barcode: '', expDate: '', qty: '', status: 'Issue - Order' });
        setAvailableStock(null);
    };

    const handleAddDocument = async () => {
        const qtyToTake = parseInt(newDocument.qty, 10);
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
            return;
        }
        if (!newDocument.noDocument || !newDocument.barcode || !newDocument.qty || !newDocument.sku) {
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
                description: 'Product not found in stock.',
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
         if (qtyToTake > availableStock.qty) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Quantity exceeds available stock of ${availableStock.qty}.`,
            });
            return;
        }

        setIsSubmitting(true);
        
        const docToAdd = {
            ...newDocument,
            qty: qtyToTake,
            date: new Date().toISOString(),
            validatedBy: user.name,
            user: { name: user.name, email: user.email }
        };

        try {
            const response = await fetch('/api/product-out-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docToAdd),
            });

            if (!response.ok) {
                throw new Error('Failed to save document to database.');
            }

            await fetchProductOutDocs();
            await fetchProductInStock(); // Refresh stock
            
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

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Product Out</h1>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pengeluaran Barang</CardTitle>
                            <CardDescription>Data stok barang keluar. Fitur ini akan memotong stok dari Product In.</CardDescription>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if(!open) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Add Product Out
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Product Out</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="noDocument" className="text-right">No. Document</Label>
                                        <Input id="noDocument" name="noDocument" value={newDocument.noDocument} className="col-span-3 bg-muted" readOnly />
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
                                        <Label htmlFor="expDate" className="text-right">EXP Date</Label>
                                        <Input id="expDate" name="expDate" value={newDocument.expDate ? format(new Date(newDocument.expDate), 'yyyy-MM-dd') : ''} className="col-span-3 bg-muted" readOnly />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="qty" className="text-right">Quantity</Label>
                                        <div className="col-span-3">
                                            <Input id="qty" name="qty" type="number" value={newDocument.qty} onChange={handleInputChange} placeholder="0" />
                                            {availableStock && <p className="text-xs text-muted-foreground mt-1">Available Stock: {availableStock.qty.toLocaleString()}</p>}
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
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                                    <Button onClick={handleAddDocument} disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>EXP Date</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.length > 0 ? (
                                        documents.map((doc) => (
                                             <TableRow key={doc.id}>
                                                <TableCell>{doc.sku}</TableCell>
                                                <TableCell>{doc.barcode}</TableCell>
                                                <TableCell>{doc.expDate ? format(new Date(doc.expDate), 'dd/MM/yyyy') : '-'}</TableCell>
                                                <TableCell>{doc.qty.toLocaleString()}</TableCell>
                                                <TableCell>{doc.status}</TableCell>
                                                <TableCell>{doc.noDocument}</TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Belum ada data pengeluaran barang.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    {documents.length > 0 && (
                        <CardFooter className="justify-end pt-4">
                            <p className="text-sm text-muted-foreground">
                                Total {documents.length} documents.
                            </p>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
}
