
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type InboundItem = {
    sku: string;
    barcode: string;
    brand: string;
    name: string;
    exp_date: string;
    qty: number;
};

type ProductMaster = {
    sku: string;
    barcode: string;
    brand: string;
};

export default function CreateInboundPage() {
  const { user } = useAuth();
  const [stagedItems, setStagedItems] = useState<InboundItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<InboundItem, 'qty'> & { qty: string }>({
    sku: '', barcode: '', brand: '', name: '', exp_date: '', qty: ''
  });
  const [docDetails, setDocDetails] = useState({
    reference: '',
    received_by: '',
  });
  
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(user.role);
  
  const handleItemInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));

    if ((name === 'barcode' || name === 'sku') && value) {
        setIsProductLoading(true);
        try {
            const response = await fetch(`/api/master-products/${value}`);
            if (response.ok) {
                const product: ProductMaster = await response.json();
                setNewItem(prev => ({
                    ...prev,
                    sku: product.sku,
                    barcode: product.barcode,
                    brand: product.brand,
                }));
            } else {
                 setNewItem(prev => ({ ...prev, brand: '' }));
            }
        } catch (error) {
            console.error("Failed to fetch product data", error);
            setNewItem(prev => ({ ...prev, brand: '' }));
        } finally {
            setIsProductLoading(false);
        }
    }
  }, []);

  const handleAddItem = () => {
    const qty = parseInt(newItem.qty, 10);
    if (!newItem.sku || !newItem.barcode || !newItem.name || !newItem.exp_date || isNaN(qty) || qty <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all item fields with valid data.' });
        return;
    }
    
    setStagedItems(prev => [...prev, { ...newItem, qty }]);
    setNewItem({ sku: '', barcode: '', brand: '', name: '', exp_date: '', qty: '' }); // Reset form
  };

  const handleRemoveItem = (index: number) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmitDocument = async () => {
    if (stagedItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item to the document.' });
        return;
    }
    if (!docDetails.reference || !docDetails.received_by) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out Reference and Received By fields.' });
        return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    setIsSubmitting(true);
    // This is a placeholder for the actual API call
    // In a real scenario, you would send docDetails and stagedItems to your backend
    try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        toast({
            title: 'Success (Simulation)',
            description: `Document ${docDetails.reference} with ${stagedItems.length} items has been submitted.`,
        });
        router.push('/inbound/monitoring');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Something went wrong while creating the document.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Inbound</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Inbound Document</CardTitle>
            <CardDescription>
              Add one or more items to an inbound document and submit them all at once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Document Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input id="reference" placeholder="e.g., PO-12345" value={docDetails.reference} onChange={(e) => setDocDetails(prev => ({...prev, reference: e.target.value}))}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" value={format(new Date(), "dd/MM/yyyy HH:mm")} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="received_by">Received By</Label>
                        <Input id="received_by" placeholder="Receiver's name" value={docDetails.received_by} onChange={(e) => setDocDetails(prev => ({ ...prev, received_by: e.target.value }))} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Add Item to Document</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input id="barcode" name="barcode" placeholder="Enter barcode" value={newItem.barcode} onChange={handleItemInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" name="sku" placeholder="Enter SKU" value={newItem.sku} onChange={handleItemInputChange} />
                    </div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="brand">Brand</Label>
                        <Input id="brand" name="brand" placeholder="Product brand" value={newItem.brand} className="bg-muted" readOnly />
                        {isProductLoading && <Loader2 className="absolute right-2 top-8 h-4 w-4 animate-spin" />}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="Product name" value={newItem.name} onChange={handleItemInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="exp_date">Exp Date</Label>
                        <Input id="exp_date" name="exp_date" type="date" value={newItem.exp_date} onChange={handleItemInputChange}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="qty">QTY</Label>
                        <Input id="qty" name="qty" type="number" placeholder="Enter quantity" value={newItem.qty} onChange={handleItemInputChange}/>
                    </div>
                    <div className="flex">
                      <Button type="button" onClick={handleAddItem} disabled={!canCreate} className="w-full">
                          <Plus className="mr-2 h-4 w-4" /> Add Item
                      </Button>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Items ({stagedItems.length})</h3>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Exp Date</TableHead>
                                <TableHead>QTY</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stagedItems.length > 0 ? (
                                stagedItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell>{item.barcode}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{format(new Date(item.exp_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{item.qty.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No items added yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

             <div className="flex justify-end pt-4">
                {canCreate && (
                <Button size="lg" onClick={handleSubmitDocument} disabled={isSubmitting || stagedItems.length === 0}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Submit Document
                </Button>
                )}
              </div>

          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
