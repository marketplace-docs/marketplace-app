
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
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const [searchDocument, setSearchDocument] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
        setLoading(true);
        const response = await fetch('/api/return-documents');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
        setError(null);
    } catch (e: any) {
        setError(e.message);
        toast({
            variant: "destructive",
            title: "Error fetching data",
            description: e.message,
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

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
    if (!selectedDoc) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/return-documents/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedDoc),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update document');
      }

      await fetchDocuments(); 
      setEditDialogOpen(false);
      setSelectedDoc(null);
      toast({ title: "Success", description: "Document has been updated successfully." });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: e.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!selectedDoc) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/return-documents/${selectedDoc.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete document');
        }
        
        await fetchDocuments();
        setDeleteDialogOpen(false);
        setSelectedDoc(null);
        toast({ title: "Success", description: "Document has been deleted.", variant: "destructive" });

    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: e.message,
        });
    } finally {
        setIsSubmitting(false);
    }
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
