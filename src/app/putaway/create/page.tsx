
'use client';

import React from 'react';
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

type NewPutawayDocument = {
    noDocument: string;
    qty: string;
    status: string;
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    checkBy: string;
};

export default function CreatePutawayPage() {
  const [newDocument, setNewDocument] = React.useState<NewPutawayDocument>({
    noDocument: '',
    qty: '',
    status: 'Pending',
    sku: '',
    barcode: '',
    brand: '',
    expDate: '',
    checkBy: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewDocument((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.noDocument || !newDocument.qty || !newDocument.sku || !newDocument.barcode || !newDocument.brand || !newDocument.expDate || !newDocument.checkBy) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/putaway-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDocument,
          qty: parseInt(newDocument.qty, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create document');
      }

      toast({
        title: 'Success',
        description: 'New putaway document has been created.',
      });
      // Reset form and navigate to monitoring page
      setNewDocument({ noDocument: '', qty: '', status: 'Pending', sku: '', barcode: '', brand: '', expDate: '', checkBy: '' });
      router.push('/putaway/monitoring-document');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error creating document',
        description: error.message,
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
              Fill out the form below to create a new putaway document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noDocument">No. Document</Label>
                  <Input
                    id="noDocument"
                    name="noDocument"
                    placeholder="Enter document number"
                    value={newDocument.noDocument}
                    onChange={handleInputChange}
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
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="Enter SKU"
                    value={newDocument.sku}
                    onChange={handleInputChange}
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
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="Enter brand"
                    value={newDocument.brand}
                    onChange={handleInputChange}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="expDate">EXP Date</Label>
                  <Input
                    id="expDate"
                    name="expDate"
                    type="date"
                    value={newDocument.expDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkBy">Check By</Label>
                  <Input
                    id="checkBy"
                    name="checkBy"
                    placeholder="Checked by name"
                    value={newDocument.checkBy}
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4 space-x-2">
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Submit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
