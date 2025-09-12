
'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import type { ReturnDocument } from '@/types/return-document';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const statusVariantMap: { [key in ReturnDocument['status']]: "default" | "secondary" | "destructive" | "outline" } = {
    'Processed': 'default',
    'Pending': 'secondary',
    'Canceled': 'destructive',
};

export default function MonitoringReturnPage() {
  const [documents, setDocuments] = useLocalStorage<ReturnDocument[]>('returnDocuments', []);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ReturnDocument | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchDocument, setSearchDocument] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => 
      doc.noDocument.toLowerCase().includes(searchDocument.toLowerCase()) &&
      doc.barcode.toLowerCase().includes(searchBarcode.toLowerCase())
    );
  }, [documents, searchDocument, searchBarcode]);


  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedDocs = filteredDocuments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, documents, searchDocument, searchBarcode]);

  const handleOpenEditDialog = (doc: ReturnDocument) => {
    setSelectedDoc({ ...doc });
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (doc: ReturnDocument) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedDoc) return;
    setDocuments(documents.map(d => d.id === selectedDoc.id ? selectedDoc : d));
    setEditDialogOpen(false);
    setSelectedDoc(null);
    toast({ title: "Success", description: "Document has been updated successfully." });
  };

  const handleDeleteDoc = () => {
    if (!selectedDoc) return;
    setDocuments(documents.filter(d => d.id !== selectedDoc.id));
    setDeleteDialogOpen(false);
    setSelectedDoc(null);
    toast({ title: "Success", description: "Document has been deleted.", variant: "destructive" });
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
        <h1 className="text-2xl font-bold">Monitoring Document</h1>
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
            <div className="flex-1">
              <CardTitle>Return Documents</CardTitle>
              <CardDescription>A list of all return documents.</CardDescription>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
                <Input 
                    placeholder="Search document..." 
                    value={searchDocument}
                    onChange={(e) => setSearchDocument(e.target.value)}
                    className="flex-1 md:flex-auto md:w-auto"
                />
                <Input 
                    placeholder="Search barcode..." 
                    value={searchBarcode}
                    onChange={(e) => setSearchBarcode(e.target.value)}
                    className="flex-1 md:flex-auto md:w-auto"
                />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                <Button variant="outline" size="icon" onClick={handleUploadClick}>
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Import</span>
                </Button>
                <Button variant="outline" size="icon" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Export</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg" id="printable-content">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Document</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>QTY</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocs.length > 0 ? (
                    paginatedDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.noDocument}</TableCell>
                        <TableCell>{format(new Date(doc.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        <TableCell>{doc.sku}</TableCell>
                        <TableCell>{doc.barcode}</TableCell>
                        <TableCell>{doc.brand}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{doc.reason}</TableCell>
                        <TableCell>{doc.receivedBy}</TableCell>
                        <TableCell>{doc.qty}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariantMap[doc.status] || 'default'}>{doc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(doc)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(doc)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No documents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {filteredDocuments.length > 0 ? currentPage : 0} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={`${rowsPerPage}`}
                        onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                        }}
                        >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 25, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle>Edit Document</DialogTitle>
                  <DialogDescription>
                      Make changes to the document here. Click save when you're done.
                  </DialogDescription>
              </DialogHeader>
              {selectedDoc && (
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="noDocument" className="text-right">No. Document</Label>
                          <Input id="noDocument" value={selectedDoc.noDocument} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, noDocument: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sku" className="text-right">SKU</Label>
                          <Input id="sku" value={selectedDoc.sku} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, sku: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="barcode" className="text-right">Barcode</Label>
                          <Input id="barcode" value={selectedDoc.barcode} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, barcode: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="brand" className="text-right">Brand</Label>
                          <Input id="brand" value={selectedDoc.brand} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, brand: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="receivedBy" className="text-right">Received By</Label>
                          <Input id="receivedBy" value={selectedDoc.receivedBy} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, receivedBy: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qty" className="text-right">QTY</Label>
                            <Input id="qty" type="number" value={selectedDoc.qty} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, qty: parseInt(e.target.value, 10) || 0 })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <Select value={selectedDoc.status} onValueChange={(value: 'Processed' | 'Pending' | 'Canceled') => setSelectedDoc({ ...selectedDoc, status: value })}>
                                <SelectTrigger id="status" className="col-span-3">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Processed">Processed</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Canceled">Canceled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="reason" className="text-right pt-2">Reason</Label>
                             <Textarea id="reason" value={selectedDoc.reason} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, reason: e.target.value })} />
                        </div>
                  </div>
              )}
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                      This action cannot be undone. This will permanently delete the document <span className="font-semibold">{selectedDoc?.noDocument}</span>.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteDoc}>Delete</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
