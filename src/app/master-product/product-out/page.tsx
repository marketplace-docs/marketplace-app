
'use client';

import React, { useState } from 'react';
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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';

type ProductOutStatus = 'Issue - Order' | 'Issue - Internal Transfer' | 'Issue - Adjustment Manual';

type ProductOutDocument = {
    id: string;
    sku: string;
    barcode: string;
    expDate: string;
    qty: number;
    status: ProductOutStatus;
    date: string; // ISO String
};

export default function ProductOutPage() {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const [documents, setDocuments] = useLocalStorage<ProductOutDocument[]>('product-out-documents', []);
    const [newDocument, setNewDocument] = useState({
        sku: '',
        barcode: '',
        expDate: '',
        qty: '',
        status: 'Issue - Order' as ProductOutStatus,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewDocument(prev => ({...prev, [name]: value}));
    };
    
    const handleSelectChange = (value: ProductOutStatus) => {
        setNewDocument(prev => ({ ...prev, status: value }));
    };

    const handleAddDocument = async () => {
        if (!newDocument.sku || !newDocument.barcode || !newDocument.qty) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'SKU, Barcode, and Quantity are required.',
            });
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

        const docToAdd: ProductOutDocument = {
            id: Date.now().toString(),
            ...newDocument,
            qty: parseInt(newDocument.qty, 10),
            date: new Date().toISOString(),
        };
        
        setDocuments([...documents, docToAdd]);

        setIsSubmitting(false);
        setAddDialogOpen(false);
        setNewDocument({ sku: '', barcode: '', expDate: '', qty: '', status: 'Issue - Order' });
        toast({
            title: 'Success',
            description: 'Product out document has been created locally.',
        });
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
                        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
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
                                        <Label htmlFor="sku" className="text-right">SKU</Label>
                                        <Input id="sku" name="sku" value={newDocument.sku} onChange={handleInputChange} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="barcode" className="text-right">Barcode</Label>
                                        <Input id="barcode" name="barcode" value={newDocument.barcode} onChange={handleInputChange} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="expDate" className="text-right">EXP Date</Label>
                                        <Input id="expDate" name="expDate" type="date" value={newDocument.expDate} onChange={handleInputChange} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="qty" className="text-right">Quantity</Label>
                                        <Input id="qty" name="qty" type="number" value={newDocument.qty} onChange={handleInputChange} className="col-span-3" />
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
                                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
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
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
