
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
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import type { ReturnDocument } from '@/types/return-document';
import { useAuth } from '@/hooks/use-auth';

type NewReturnDocument = Omit<ReturnDocument, 'id' | 'date'>;
type ProductMaster = {
    sku: string;
    barcode: string;
    brand: string;
};


export default function CreateReturnPage() {
  const [newDocument, setNewDocument] = React.useState<Omit<NewReturnDocument, 'qty'> & { qty: string }>({
    no_document: '',
    qty: '',
    status: 'Pending',
    sku: '',
    barcode: '',
    brand: '',
    reason: '',
    received_by: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const canCreate = user?.role === 'Super Admin';

  useEffect(() => {
    // Generate document number on component mount
    const generateDocNumber = async () => {
        try {
            const response = await fetch('/api/return-documents/generate-number');
            if (!response.ok) throw new Error('Failed to generate document number.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setNewDocument(prev => ({ ...prev, no_document: data.newDocNumber }));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not generate document number.' });
        }
    };
    if (canCreate) {
        generateDocNumber();
    }
  }, [canCreate, toast]);


 const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDocument((prev) => ({ ...prev, [name]: value }));

    if ((name === 'barcode' || name === 'sku') && value) {
        setIsProductLoading(true);
        try {
            const response = await fetch(`/api/master-products/${value}`);
            if (response.ok) {
                const product: ProductMaster = await response.json();
                setNewDocument(prev => ({
                    ...prev,
                    sku: product.sku,
                    barcode: product.barcode,
                    brand: product.brand,
                }));
            } else {
                 setNewDocument(prev => ({ ...prev, brand: '' }));
            }
        } catch (error) {
            console.error("Failed to fetch product data", error);
            setNewDocument(prev => ({ ...prev, brand: '' }));
        } finally {
            setIsProductLoading(false);
        }
    }
  }, []);
  
  const handleSelectChange = (name: string, value: string) => {
    setNewDocument(prev => ({ ...prev, [name]: value as 'Done' | 'Pending' | 'Cancelled' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.no_document || !newDocument.qty || !newDocument.sku || !newDocument.barcode || !newDocument.brand || !newDocument.received_by) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all required fields.',
      });
      return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a document.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/return-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...newDocument,
            qty: parseInt(newDocument.qty, 10),
            user,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create return document');
      }
      
      toast({
          title: 'Success',
          description: 'New return document has been created.',
      });
      setNewDocument({ no_document: '', qty: '', status: 'Pending', sku: '', barcode: '', brand: '', reason: '', received_by: '' });
      router.push('/return/monitoring-document');

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
        <h1 className="text-2xl font-bold">Return</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Document</CardTitle>
            <CardDescription>
              Fill out the form below to create a new return document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="no_document">No. Document</Label>
                  <Input
                    id="no_document"
                    name="no_document"
                    value={newDocument.no_document}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    value={format(new Date(), "dd/MM/yyyy HH:mm")}
                    disabled
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    placeholder="Enter barcode"
                    value={newDocument.barcode}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="Enter SKU"
                    value={newDocument.sku}
                    onChange={handleInputChange}
                  />
                </div>
                 <div className="space-y-2 relative">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="Product brand"
                    value={newDocument.brand}
                    className="bg-muted"
                    readOnly
                  />
                  {isProductLoading && <Loader2 className="absolute right-2 top-8 h-4 w-4 animate-spin" />}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_by">Received By</Label>
                  <Input
                    id="received_by"
                    name="received_by"
                    placeholder="Received by name"
                    value={newDocument.received_by}
                    onChange={handleInputChange}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="qty">QTY</Label>
                  <Input
                    id="qty"
                    name="qty"
                    type="number"
                    placeholder="Enter quantity"
                    value={newDocument.qty}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" value={newDocument.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-4">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Enter return reason"
                    value={newDocument.reason}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 space-x-2">
                {canCreate && (
                <Button type="submit" disabled={isSubmitting || !newDocument.no_document}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
