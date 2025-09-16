
'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type PutawayItem = {
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    qty: number;
};

export default function CreatePutawayPage() {
  const { user } = useAuth();
  const [stagedItems, setStagedItems] = useState<PutawayItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<PutawayItem, 'qty'> & { qty: string }>({
    sku: '', barcode: '', brand: '', exp_date: '', location: '', qty: ''
  });
  const [docDetails, setDocDetails] = useState({
    no_document: '',
    date: new Date(),
    check_by: '',
    status: 'Pending' as 'Done' | 'Pending',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const canCreate = user?.role === 'Super Admin';

  const generateDocNumber = useCallback(async () => {
    try {
        const response = await fetch('/api/putaway-documents/generate-number');
        if (!response.ok) throw new Error('Failed to generate document number.');
        const data = await response.json();
        setDocDetails(prev => ({ ...prev, no_document: data.newDocNumber }));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate document number.' });
    }
  }, [toast]);


  useEffect(() => {
    if (canCreate) {
        generateDocNumber();
    }
  }, [canCreate, generateDocNumber]);
  
  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    const qty = parseInt(newItem.qty, 10);
    if (!newItem.sku || !newItem.barcode || !newItem.location || !newItem.exp_date || isNaN(qty) || qty <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all item fields with valid data.' });
        return;
    }
    setStagedItems(prev => [...prev, { ...newItem, qty }]);
    setNewItem({ sku: '', barcode: '', brand: '', exp_date: '', location: '', qty: '' }); // Reset form
  };

  const handleRemoveItem = (index: number) => {
    setStagedItems(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmitDocument = async () => {
    if (stagedItems.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item to the document.' });
        return;
    }
    if (!docDetails.check_by) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter who checked the document.' });
        return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
        const documentsToCreate = stagedItems.map(item => ({
            ...item,
            no_document: docDetails.no_document,
            status: docDetails.status,
            check_by: docDetails.check_by,
        }));

        const response = await fetch('/api/putaway-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documents: documentsToCreate,
                user: { name: user.name, email: user.email, role: user.role }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create document');
        }

        toast({
            title: 'Success',
            description: `Document ${docDetails.no_document} with ${stagedItems.length} items has been created.`,
        });
        router.push('/putaway/monitoring-document');

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
        <h1 className="text-2xl font-bold">Putaway</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Document</CardTitle>
            <CardDescription>
              Add one or more items to a document and submit them all at once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* Document Details Form */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Document Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="no_document">No. Document</Label>
                        <Input id="no_document" value={docDetails.no_document} readOnly className="bg-muted"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" value={format(docDetails.date, "dd/MM/yyyy HH:mm")} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="check_by">Check By</Label>
                        <Input id="check_by" placeholder="Checked by name" value={docDetails.check_by} onChange={(e) => setDocDetails(prev => ({ ...prev, check_by: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={docDetails.status} onValueChange={(value) => setDocDetails(prev => ({ ...prev, status: value as 'Done' | 'Pending' }))}>
                            <SelectTrigger id="status"><SelectValue placeholder="Select Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Done">Done</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Add Item Form */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Add Item to Document</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" name="sku" placeholder="Enter SKU" value={newItem.sku} onChange={handleItemInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="barcode">Barcode</Label><Input id="barcode" name="barcode" placeholder="Enter barcode" value={newItem.barcode} onChange={handleItemInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="brand">Brand</Label><Input id="brand" name="brand" placeholder="Enter brand" value={newItem.brand} onChange={handleItemInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="exp_date">EXP Date</Label><Input id="exp_date" name="exp_date" type="date" value={newItem.exp_date} onChange={handleItemInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" placeholder="Enter location" value={newItem.location} onChange={handleItemInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="qty">QTY</Label><Input id="qty" name="qty" type="number" placeholder="Enter quantity" value={newItem.qty} onChange={handleItemInputChange}/></div>
                    <Button type="button" onClick={handleAddItem} disabled={!canCreate} className="w-full lg:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
                </div>
            </div>
            
            {/* Staged Items Table */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Items ({stagedItems.length})</h3>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>EXP Date</TableHead>
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
