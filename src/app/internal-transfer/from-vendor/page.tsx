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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TransferItem = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
    exp_date: string;
    qty: number;
};

type ProductMaster = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
};

export default function TransferFromVendorPage() {
  const { user } = useAuth();
  const [stagedItems, setStagedItems] = useState<TransferItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<TransferItem, 'qty'> & { qty: string }>({
    sku: '', name: '', barcode: '', brand: '', exp_date: '', qty: ''
  });
  const [docDetails, setDocDetails] = useState({
    reference: '',
    received_by: '',
    vendor_name: '',
  });
  
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(user.role);
  
  const generateDocNumber = useCallback(async () => {
    try {
        const response = await fetch('/api/internal-transfer/generate-vendor-number');
        if (!response.ok) throw new Error('Failed to generate document number.');
        const data = await response.json();
        setDocDetails(prev => ({ ...prev, reference: data.newDocNumber }));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate document number.' });
    }
  }, [toast]);

  useEffect(() => {
    if (canCreate) {
        generateDocNumber();
    }
  }, [canCreate, generateDocNumber]);


  const handleItemInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));

    if (name === 'barcode' && value) {
        setIsProductLoading(true);
        try {
            const response = await fetch(`/api/master-products/${value}`);
            if (response.ok) {
                const product: ProductMaster = await response.json();
                setNewItem(prev => ({
                    ...prev,
                    sku: product.sku,
                    name: product.name,
                    barcode: product.barcode,
                    brand: product.brand,
                }));
            } else {
                 setNewItem(prev => ({ ...prev, sku: '', name: '', brand: '' }));
            }
        } catch (error) {
            console.error("Failed to fetch product data", error);
            setNewItem(prev => ({ ...prev, sku: '', name: '', brand: '' }));
        } finally {
            setIsProductLoading(false);
        }
    }
  }, []);

  const handleAddItem = () => {
    const qty = parseInt(newItem.qty, 10);
    if (!newItem.sku || !newItem.barcode || !newItem.exp_date || isNaN(qty) || qty <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all item fields with valid data.' });
        return;
    }
    
    setStagedItems(prev => [...prev, { ...newItem, qty }]);
    setNewItem({ sku: '', name: '', barcode: '', brand: '', exp_date: '', qty: '' }); // Reset form
  };

  const handleRemoveItem = (index: number) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmitDocument = async () => {
    if (stagedItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item to the document.' });
        return;
    }
    if (!docDetails.reference || !docDetails.received_by || !docDetails.vendor_name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out Reference, Vendor Name, and Received By fields.' });
        return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Re-using inbound API as the process is identical
      const payload = {
        document: {
          reference: docDetails.reference,
          received_by: docDetails.received_by,
          // We can use a field like 'notes' or a custom column for vendor name if DB supports it.
          // For now, it's just for display and logging.
          notes: `Transfer from Vendor: ${docDetails.vendor_name}`,
          date: new Date().toISOString(),
        },
        items: stagedItems,
        user
      };

      const response = await fetch('/api/inbound-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit transfer document.');
      }
        
      toast({
          title: 'Success',
          description: `Document ${docDetails.reference} for vendor ${docDetails.vendor_name} has been submitted.`,
      });
      router.push('/inbound/monitoring');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Something went wrong while creating the document.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Transfer From Vendor</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Vendor Transfer Document</CardTitle>
            <CardDescription>
              Record items being transferred into the warehouse from an external vendor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg">
                <h3 className="text-lg font-medium">Document Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input id="reference" value={docDetails.reference} readOnly className="bg-muted" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="vendor_name">Vendor Name</Label>
                        <Input id="vendor_name" placeholder="Vendor's name" value={docDetails.vendor_name} onChange={(e) => setDocDetails(prev => ({ ...prev, vendor_name: e.target.value }))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="received_by">Received By</Label>
                        <Input id="received_by" placeholder="Receiver's name" value={docDetails.received_by} onChange={(e) => setDocDetails(prev => ({ ...prev, received_by: e.target.value }))} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg">
                <h3 className="text-lg font-medium">Add Item to Document</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input id="barcode" name="barcode" placeholder="Scan or enter barcode" value={newItem.barcode} onChange={handleItemInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="exp_date">Exp Date</Label>
                        <Input id="exp_date" name="exp_date" type="date" value={newItem.exp_date} onChange={handleItemInputChange}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="qty">QTY</Label>
                        <Input id="qty" name="qty" type="number" placeholder="Enter quantity" value={newItem.qty} onChange={handleItemInputChange}/>
                    </div>
                    <div className="space-y-2 relative col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU</Label>
                            <Input id="sku" name="sku" placeholder="Auto-filled" value={newItem.sku} className="bg-muted" readOnly />
                            {isProductLoading && <Loader2 className="absolute right-2 top-8 h-4 w-4 animate-spin" />}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" placeholder="Auto-filled" value={newItem.name} className="bg-muted" readOnly />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input id="brand" name="brand" placeholder="Auto-filled" value={newItem.brand} className="bg-muted" readOnly />
                        </div>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" onClick={handleAddItem} disabled={!canCreate} className="w-full">
                          <Plus className="mr-2 h-4 w-4" /> Add Item
                      </Button>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Items ({stagedItems.length})</h3>
                <div className="border-2 border-primary/20 rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Brand</TableHead>
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
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.barcode}</TableCell>
                                        <TableCell>{item.brand}</TableCell>
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
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No items added yet.</TableCell>
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
