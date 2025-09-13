
'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, AlertCircle, Upload, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';

const statusVariantMap: { [key in ReturnDocument['status']]: "default" | "secondary" | "destructive" | "outline" } = {
    'Processed': 'default',
    'Pending': 'secondary',
    'Canceled': 'destructive',
};

export default function MonitoringReturnPage() {
  const [documents, setDocuments] = useState<ReturnDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ReturnDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [searchDocument, setSearchDocument] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');

   const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/return-documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
  }, [rowsPerPage, searchDocument, searchBarcode]);

  const handleOpenEditDialog = (doc: ReturnDocument) => {
    setSelectedDoc({ ...doc });
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (doc: ReturnDocument) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedDoc || !user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/return-documents/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedDoc, userName: user.name, userEmail: user.email })
      });
      if (!response.ok) throw new Error('Failed to update document');
      
      await fetchDocuments();
      setEditDialogOpen(false);
      setSelectedDoc(null);
      toast({ title: "Success", description: "Document has been updated successfully." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not update document." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!selectedDoc || !user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/return-documents/${selectedDoc.id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Name': user.name,
          'X-User-Email': user.email,
        }
      });
      if (!response.ok) throw new Error('Failed to delete document');

      await fetchDocuments();
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
      toast({ title: "Success", description: "Document has been deleted.", variant: "destructive" });

      if (paginatedDocs.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not delete document." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExport = () => {
    if (filteredDocuments.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "There is no data to export." });
      return;
    }
    const headers = ["noDocument", "date", "sku", "barcode", "brand", "reason", "receivedBy", "qty", "status"];
    const csvContent = [
      headers.join(","),
      ...filteredDocuments.map(doc => [
        `"${doc.noDocument.replace(/"/g, '""')}"`,
        `"${format(new Date(doc.date), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}"`,
        `"${doc.sku.replace(/"/g, '""')}"`,
        `"${doc.barcode.replace(/"/g, '""')}"`,
        `"${doc.brand.replace(/"/g, '""')}"`,
        `"${doc.reason.replace(/"/g, '""')}"`,
        `"${doc.receivedBy.replace(/"/g, '""')}"`,
        doc.qty,
        doc.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `return_documents_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Data has been exported." });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines.shift()?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
        const requiredHeaders = ["noDocument", "sku", "barcode", "brand", "reason", "receivedBy", "qty", "status"];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error(`Invalid CSV headers. Required: ${requiredHeaders.join(', ')}`);
        }
        
        const newDocs = lines.map(line => {
          const values = line.split(',');
          const docData: Record<string, string> = {};
          headers.forEach((header, index) => {
            docData[header] = values[index]?.trim().replace(/"/g, '');
          });
          
          return {
            noDocument: docData.noDocument,
            sku: docData.sku,
            barcode: docData.barcode,
            brand: docData.brand,
            reason: docData.reason,
            receivedBy: docData.receivedBy,
            qty: parseInt(docData.qty, 10),
            status: docData.status,
          };
        });

        const response = await fetch('/api/return-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: newDocs, user: { name: user.name, email: user.email } }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload documents.");
        }
        
        await fetchDocuments();
        toast({ title: "Success", description: `${newDocs.length} documents uploaded.` });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
      } finally {
        setIsSubmitting(false);
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Monitoring Document</h1>
        {error && (
            <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
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
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                    <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" /> Export
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
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                  ) : paginatedDocs.length > 0 ? (
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
                  <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
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
                  <Button variant="destructive" onClick={handleDeleteDoc} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
