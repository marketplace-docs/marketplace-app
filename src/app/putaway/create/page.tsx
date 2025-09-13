
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
import { useAuth } from '@/hooks/use-auth';

type NewPutawayDocument = {
    no_document: string;
    qty: string;
    status: 'Done' | 'Pending';
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    check_by: string;
};

export default function CreatePutawayPage() {
  const { user } = useAuth();
  const [newDocument, setNewDocument] = React.useState<NewPutawayDocument>({
    no_document: '',
    qty: '',
    status: 'Pending',
    sku: '',
    barcode: '',
    brand: '',
    exp_date: '',
    location: '',
    check_by: '',
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
    setNewDocument(prev => ({ ...prev, [name]: value as 'Done' | 'Pending' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.no_document || !newDocument.qty || !newDocument.sku || !newDocument.barcode || !newDocument.brand || !newDocument.exp_date || !newDocument.check_by || !newDocument.location) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
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
                user: { name: user.name, email: user.email }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create document');
        }

        toast({
            title: 'Success',
            description: 'New putaway document has been created.',
        });
        router.push('/putaway/monitoring-document');

    } catch (error) {
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
                  <Label htmlFor="no_document">No. Document</Label>
                  <Input
                    id="no_document"
                    name="no_document"
                    placeholder="Enter document number"
                    value={newDocument.no_document}
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
                  <Label htmlFor="exp_date">EXP Date</Label>
                  <Input
                    id="exp_date"
                    name="exp_date"
                    type="date"
                    value={newDocument.exp_date}
                    onChange={handleInputChange}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Enter location"
                    value={newDocument.location}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_by">Check By</Label>
                  <Input
                    id="check_by"
                    name="check_by"
                    placeholder="Checked by name"
                    value={newDocument.check_by}
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
