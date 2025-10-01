
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
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BatchProduct } from '@/types/batch-product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransferItem = {
    sku: string;
    name: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
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
  const [docDetails, setDocDetails] = useState({
    reference: '',
    creator_by: '',
    vendor_name: '',
  });

  // State for the item adding process
  const [barcode, setBarcode] = useState('');
  const [foundBatches, setFoundBatches] = useState<BatchProduct[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [quantity, setQuantity] = useState('');

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
        if (user) {
          setDocDetails(prev => ({...prev, creator_by: user.name}));
        }
    }
  }, [canCreate, generateDocNumber, user]);


 const handleSearchProduct = useCallback(async () => {
    if (!barcode) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a barcode to search.' });
        return;
    }
    setIsProductLoading(true);
    setFoundBatches([]);
    setSelectedLocation('');
    setQuantity('');
    try {
        const res = await fetch('/api/master-product/batch-products');
        if (!res.ok) throw new Error('Failed to fetch stock data.');
        const allBatches: BatchProduct[] = await res.json();
        
        const matchingBatches = allBatches.filter(b => b.barcode === barcode && b.stock > 0);

        if (matchingBatches.length === 0) {
            toast({ variant: 'destructive', title: 'Not Found', description: `No available stock found for barcode ${barcode}.` });
            return;
        }

        setFoundBatches(matchingBatches);
        toast({ title: 'Product Found', description: `Found ${matchingBatches.length} location(s) with stock.` });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProductLoading(false);
    }
 }, [barcode, toast]);


  const handleAddItem = () => {
    const qty = parseInt(quantity, 10);
    const selectedBatch = foundBatches.find(b => b.location === selectedLocation);

    if (!selectedBatch || !selectedLocation || isNaN(qty) || qty <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a location and enter a valid quantity.' });
        return;
    }
     if (qty > selectedBatch.stock) {
        toast({ variant: 'destructive', title: 'Error', description: `Quantity (${qty}) exceeds available stock (${selectedBatch.stock}) at this location.` });
        return;
    }
    
    const newItem: TransferItem = {
        sku: selectedBatch.sku,
        name: selectedBatch.name,
        barcode: selectedBatch.barcode,
        brand: selectedBatch.brand,
        exp_date: selectedBatch.exp_date,
        location: selectedBatch.location,
        qty: qty,
    };

    setStagedItems(prev => [...prev, newItem]);
    
    // Reset item form
    setBarcode('');
    setFoundBatches([]);
    setSelectedLocation('');
    setQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmitDocument = async () => {
    if (stagedItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item to the document.' });
        return;
    }
    if (!docDetails.reference || !docDetails.creator_by || !docDetails.vendor_name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out Reference, Vendor Name, and Creator By fields.' });
        return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        document: {
          reference: docDetails.reference,
          received_by: docDetails.creator_by,
          notes: `Transfer from Vendor: ${docDetails.vendor_name}`,
          date: new Date().toISOString(),
        },
        items: stagedItems.map(item => ({...item, location: 'Staging Area Inbound'})),
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

  const selectedBatchInfo = foundBatches.find(b => b.location === selectedLocation);

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Transfer From Vendor</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Vendor Transfer Document</CardTitle>
            <CardDescription>
              Record items being transferred into the warehouse from an external vendor. The stock will initially be placed in the 'Staging Area Inbound' and must be moved using the 'Go-Putaway' feature.
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
                        <Label htmlFor="creator_by">Creator By</Label>
                        <Input id="creator_by" placeholder="Creator's name" value={docDetails.creator_by} onChange={(e) => setDocDetails(prev => ({ ...prev, creator_by: e.target.value }))} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg">
                <h3 className="text-lg font-medium">Add Item to Document</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="barcode">1. Barcode</Label>
                        <Input id="barcode" name="barcode" placeholder="Scan or enter barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchProduct()} />
                    </div>
                     <div className="flex items-end">
                        <Button onClick={handleSearchProduct} disabled={isProductLoading || !barcode} className="w-full">
                           {isProductLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Find Product
                        </Button>
                    </div>

                    {foundBatches.length > 0 && (
                        <>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="location">2. Select Location</Label>
                                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                    <SelectTrigger id="location">
                                        <SelectValue placeholder="Select location to take stock from..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {foundBatches.map(batch => (
                                            <SelectItem key={batch.id} value={batch.location}>
                                                {batch.location} (Stock: {batch.stock}, Exp: {format(new Date(batch.exp_date), 'dd/MM/yyyy')})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                           
                            <div className="space-y-2">
                                <Label htmlFor="exp_date">Exp Date</Label>
                                <Input id="exp_date" name="exp_date" value={selectedBatchInfo ? format(new Date(selectedBatchInfo.exp_date), 'yyyy-MM-dd') : ''} readOnly disabled className="bg-muted"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="qty">3. QTY</Label>
                                <Input id="qty" name="qty" type="number" placeholder="Enter quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
                            </div>
                            <div className="flex items-end">
                              <Button type="button" onClick={handleAddItem} disabled={!canCreate} className="w-full">
                                  <Plus className="mr-2 h-4 w-4" /> Add Item
                              </Button>
                            </div>
                        </>
                    )}
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
                                <TableHead>Location</TableHead>
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
                                        <TableCell>{item.location}</TableCell>
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
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No items added yet.</TableCell>
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
