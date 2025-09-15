

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, AlertCircle, Upload, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import { Checkbox } from '@/components/ui/checkbox';

type PutawayDocument = {
  id: string;
  no_document: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending';
  sku: string;
  barcode: string;
  brand: string;
  exp_date: string;
  location: string;
  check_by: string;
};

const statusVariantMap: { [key in PutawayDocument['status']]: "default" | "secondary" } = {
    'Done': 'default',
    'Pending': 'secondary',
};

const formatDateSafely = (dateString: string | null | undefined, formatString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return '-';
    }
    return format(date, formatString);
};


export default function MonitoringPutawayPage() {
  const [documents, setDocuments] = useState<PutawayDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PutawayDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const canUpdate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(user.role);
  const canDelete = user?.role === 'Super Admin';
  const canCreate = canUpdate;


  const [searchDocument, setSearchDocument] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/putaway-documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
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
      doc.no_document.toLowerCase().includes(searchDocument.toLowerCase()) &&
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

  const handleOpenEditDialog = (doc: PutawayDocument) => {
    const formattedDoc = {
        ...doc,
        exp_date: doc.exp_date ? format(new Date(doc.exp_date), 'yyyy-MM-dd') : ''
    };
    setSelectedDoc(formattedDoc);
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (doc: PutawayDocument) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedDoc || !user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/putaway-documents/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedDoc, userName: user.name, userEmail: user.email, userRole: user.role })
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
      const response = await fetch(`/api/putaway-documents/${selectedDoc.id}`, {
        method: 'DELETE',
        headers: { 'X-User-Name': user.name, 'X-User-Email': user.email, 'X-User-Role': user.role }
      });
      if (!response.ok) throw new Error('Failed to delete document');

      await fetchDocuments();
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
      toast({ title: "Success", description: "Document has been deleted.", variant: "destructive" });
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
    const headers = ["no_document", "date", "sku", "barcode", "brand", "exp_date", "location", "check_by", "qty", "status"];
    const csvContent = [
      headers.join(","),
      ...filteredDocuments.map(doc => [
        `"${doc.no_document.replace(/"/g, '""')}"`,
        `"${format(new Date(doc.date), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}"`,
        `"${doc.sku.replace(/"/g, '""')}"`,
        `"${doc.barcode.replace(/"/g, '""')}"`,
        `"${doc.brand.replace(/"/g, '""')}"`,
        `"${doc.exp_date}"`,
        `"${doc.location ? doc.location.replace(/"/g, '""') : ''}"`,
        `"${doc.check_by.replace(/"/g, '""')}"`,
        doc.qty,
        doc.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `putaway_documents_${format(new Date(), "yyyyMMdd")}.csv`);
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
        if (lines.length <= 1) throw new Error("CSV is empty or has only a header.");
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const newDocs = lines.slice(1).map(line => {
            const values = line.split(',');
            const docData: Record<string, any> = {};
            header.forEach((col, index) => {
              docData[col] = values[index]?.trim().replace(/"/g, '') || '';
            });

            return {
              no_document: docData.no_document || '',
              sku: docData.sku || '',
              barcode: docData.barcode || '',
              brand: docData.brand || '',
              exp_date: docData.exp_date || '',
              location: docData.location || '',
              check_by: docData.check_by || '',
              qty: parseInt(docData.qty || '0', 10),
              status: docData.status || 'Pending',
            };
        });

        const response = await fetch('/api/putaway-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: newDocs, user: { name: user.name, email: user.email, role: user.role } })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload documents.");
        }

        await fetchDocuments();
        setUploadDialogOpen(false);
        toast({ title: "Success", description: `${newDocs.length} documents uploaded.` });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message || "Could not process CSV file." });
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
              <CardTitle>Putaway Documents</CardTitle>
              <CardDescription>A list of all putaway documents.</CardDescription>
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
                {canCreate && (
                  <>
                    <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Upload</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload CSV</DialogTitle>
                                <DialogDescription>
                                    Select a CSV file to bulk upload putaway documents. The data will be stored in the database.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                               <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                               </Button>
                               <p className="text-xs text-muted-foreground mt-2">
                                    Don't have a template? <a href="/templates/putaway_documents_template.csv" download className="underline text-primary">Download CSV template</a>
                               </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                  </>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg" id="printable-content">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead padding="checkbox">
                        <Checkbox
                            checked={
                                Object.keys(rowSelection).length > 0 &&
                                Object.keys(rowSelection).length === paginatedDocs.length
                            }
                            onCheckedChange={(value) => {
                                const newSelection: { [key: string]: boolean } = {};
                                if (value) {
                                    paginatedDocs.forEach(doc => newSelection[doc.id] = true);
                                }
                                setRowSelection(newSelection);
                            }}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>No. Document</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>EXP Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Check By</TableHead>
                    <TableHead>QTY</TableHead>
                    <TableHead>Status</TableHead>
                    {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                        <TableCell colSpan={(canUpdate || canDelete) ? 12 : 11} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                  ) : paginatedDocs.length > 0 ? (
                    paginatedDocs.map((doc) => (
                      <TableRow key={doc.id} data-state={rowSelection[doc.id as keyof typeof rowSelection] && "selected"}>
                        <TableCell padding="checkbox">
                           <Checkbox
                                checked={rowSelection[doc.id as keyof typeof rowSelection] || false}
                                onCheckedChange={(value) => {
                                    const newSelection = { ...rowSelection };
                                    if (value) {
                                        newSelection[doc.id as keyof typeof rowSelection] = true;
                                    } else {
                                        delete newSelection[doc.id as keyof typeof rowSelection];
                                    }
                                    setRowSelection(newSelection);
                                }}
                                aria-label="Select row"
                            />
                        </TableCell>
                        <TableCell className="font-medium">{doc.no_document}</TableCell>
                        <TableCell>{formatDateSafely(doc.date, "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        <TableCell>{doc.sku}</TableCell>
                        <TableCell>{doc.barcode}</TableCell>
                        <TableCell>{doc.brand}</TableCell>
                        <TableCell>{formatDateSafely(doc.exp_date, 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{doc.location}</TableCell>
                        <TableCell>{doc.check_by}</TableCell>
                        <TableCell>{doc.qty}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariantMap[doc.status] || 'default'}>{doc.status}</Badge>
                        </TableCell>
                        {(canUpdate || canDelete) && (
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {canUpdate && (
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(doc)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(doc)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                  )}
                                </div>
                            </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={(canUpdate || canDelete) ? 12 : 11}
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
                    {Object.keys(rowSelection).length} of {filteredDocuments.length} row(s) selected.
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
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Edit Document</DialogTitle>
                  <DialogDescription>
                      Make changes to the document here. Click save when you're done.
                  </DialogDescription>
              </DialogHeader>
              {selectedDoc && (
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="no_document" className="text-right">No. Document</Label>
                          <Input id="no_document" value={selectedDoc.no_document} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, no_document: e.target.value })} />
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
                          <Label htmlFor="exp_date" className="text-right">EXP Date</Label>
                          <Input id="exp_date" type="date" value={selectedDoc.exp_date} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, exp_date: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="location" className="text-right">Location</Label>
                          <Input id="location" value={selectedDoc.location || ''} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, location: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="check_by" className="text-right">Check By</Label>
                          <Input id="check_by" value={selectedDoc.check_by} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, check_by: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qty" className="text-right">QTY</Label>
                            <Input id="qty" type="number" value={selectedDoc.qty} className="col-span-3" onChange={(e) => setSelectedDoc({ ...selectedDoc, qty: parseInt(e.target.value, 10) || 0 })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <Select value={selectedDoc.status} onValueChange={(value: 'Done' | 'Pending') => setSelectedDoc({ ...selectedDoc, status: value })}>
                                <SelectTrigger id="status" className="col-span-3">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Done">Done</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
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
                      This action cannot be undone. This will permanently delete the document <span className="font-semibold">{selectedDoc?.no_document}</span>.
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
