
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
import type { ReturnDocument } from '@/types/return-document';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';
import { Upload, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CreateReturnPage() {
  const [documents, setDocuments] = useLocalStorage<ReturnDocument[]>('returnDocuments', []);
  const [newDocument, setNewDocument] = React.useState({
    noDocument: '',
    qty: '',
    status: 'Pending',
    sku: '',
    barcode: '',
    brand: '',
    reason: '',
    receivedBy: '',
  });
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewDocument((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewDocument(prev => ({ ...prev, [name]: value as 'Processed' | 'Pending' | 'Canceled' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.noDocument || !newDocument.qty || !newDocument.sku || !newDocument.barcode || !newDocument.brand || !newDocument.receivedBy) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all required fields.',
      });
      return;
    }

    const newId = documents.length > 0 ? String(Math.max(...documents.map(t => parseInt(t.id))) + 1) : '1';
    const docToAdd: ReturnDocument = {
      id: newId,
      noDocument: newDocument.noDocument,
      date: new Date().toISOString(),
      qty: parseInt(newDocument.qty, 10),
      status: newDocument.status as 'Processed' | 'Pending' | 'Canceled',
      sku: newDocument.sku,
      barcode: newDocument.barcode,
      brand: newDocument.brand,
      reason: newDocument.reason,
      receivedBy: newDocument.receivedBy,
    };

    setDocuments([...documents, docToAdd]);
    toast({
      title: 'Success',
      description: 'New return document has been created.',
    });
    // Reset form
    setNewDocument({ noDocument: '', qty: '', status: 'Pending', sku: '', barcode: '', brand: '', reason: '', receivedBy: '' });
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const newDocs: ReturnDocument[] = [];
            let maxId = documents.length > 0 ? Math.max(...documents.map(s => parseInt(s.id))) : 0;
            
            const headerLine = lines[0] || '';
            const header = headerLine.toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
            const requiredHeaders = ['no. document', 'sku', 'barcode', 'brand', 'reason', 'received by', 'qty', 'status'];
            
            if (!requiredHeaders.every(h => header.includes(h))) {
              throw new Error('CSV file is missing required headers. Required headers are: ' + requiredHeaders.join(', '));
            }

            lines.slice(1).forEach((line, index) => {
              if (!line.trim()) return;

              const values = line.split(',').map(s => s.trim());
              
              if(values.length < header.length) {
                console.warn(`Skipping incomplete line ${index + 2}: ${line}`);
                return;
              }

              const docData = header.reduce((obj, h, i) => {
                const keyMap: { [key: string]: keyof ReturnDocument } = { 
                    'no. document': 'noDocument', 
                    'received by': 'receivedBy',
                    'sku': 'sku',
                    'barcode': 'barcode',
                    'brand': 'brand',
                    'reason': 'reason',
                    'qty': 'qty',
                    'status': 'status'
                };
                const key = keyMap[h as keyof typeof keyMap] || h;
                if (key) {
                  (obj as any)[key] = values[i];
                }
                return obj;
              }, {} as Partial<ReturnDocument>);
              
              if (!docData.noDocument || !docData.sku || !docData.qty) {
                 console.warn(`Skipping line with missing required fields ${index + 2}: ${line}`);
                 return;
              }

              newDocs.push({
                  id: String(++maxId),
                  noDocument: docData.noDocument,
                  date: new Date().toISOString(),
                  qty: parseInt(String(docData.qty), 10) || 0,
                  status: (docData.status || 'Pending') as 'Processed' | 'Pending' | 'Canceled',
                  sku: docData.sku,
                  barcode: docData.barcode || '',
                  brand: docData.brand || '',
                  reason: docData.reason || '',
                  receivedBy: docData.receivedBy || '',
              });
            });

            setDocuments(prevDocs => [...prevDocs, ...newDocs]);
            toast({
                title: "Success",
                description: `${newDocs.length} documents uploaded successfully.`,
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.message || "An error occurred while parsing the CSV file.",
            });
        }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const handleExport = () => {
    const headers = ["No. Document", "SKU", "Barcode", "Brand", "Reason", "Received By", "QTY", "Status"];
    
    const rows = documents.length > 0
      ? documents.map(d => [d.noDocument, d.sku, d.barcode, d.brand, d.reason, d.receivedBy, d.qty, d.status].map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      : [];
    
    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `return_docs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Return documents exported as CSV.",
    });
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
                  <Label htmlFor="receivedBy">Received By</Label>
                  <Input
                    id="receivedBy"
                    name="receivedBy"
                    placeholder="Received by name"
                    value={newDocument.receivedBy}
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
                      <SelectItem value="Processed">Processed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
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
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                <Button variant="outline" type="button" onClick={handleUploadClick}>
                    <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
                <Button variant="outline" type="button" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
