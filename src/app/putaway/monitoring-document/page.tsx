
'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Download,
  Upload,
  Check,
  Ban
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import type { PutawayDocument } from '@/types/putaway-document';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function MonitoringPutawayPage() {
    const [documents, setDocuments] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selection, setSelection] = useState<Record<string, boolean>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<PutawayDocument | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [searchDocument, setSearchDocument] = useState('');
    const [searchBarcode, setSearchBarcode] = useState('');

    const isSuperAdmin = user?.role === 'Super Admin';

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) throw new Error('Failed to fetch putaway documents');
            const data: PutawayDocument[] = await response.json();
            setDocuments(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

    const handleNextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    const handlePrevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

    const selectedIds = useMemo(() => Object.keys(selection).filter(id => selection[id]), [selection]);

    const handleBulkAction = async (status: 'Done' | 'Pending') => {
        if (!user || selectedIds.length === 0) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/putaway-documents/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, status, ...user }),
            });
            if (!response.ok) throw new Error(`Failed to update status to ${status}`);
            await fetchDocuments();
            setSelection({});
            toast({ title: 'Success', description: `${selectedIds.length} documents updated to ${status}.` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleBulkDelete = async () => {
        if (!user || selectedIds.length === 0) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/putaway-documents/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, ...user }),
            });
            if (!response.ok) throw new Error('Failed to delete documents.');
            await fetchDocuments();
            setSelection({});
            toast({ title: 'Success', description: `${selectedIds.length} documents deleted.`, variant: 'destructive' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleOpenEditDialog = (doc: PutawayDocument) => {
        setSelectedDoc(doc);
        setEditDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedDoc || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/putaway-documents/${selectedDoc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...selectedDoc, userRole: user.role, userName: user.name, userEmail: user.email })
            });
            if (!response.ok) throw new Error('Failed to update document');
            await fetchDocuments();
            setEditDialogOpen(false);
            toast({ title: "Success", description: "Document updated." });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async () => {
        if (!selectedDoc || !user) return;
        setIsSubmitting(true);
        try {
             const response = await fetch(`/api/putaway-documents/${selectedDoc.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': user.name,
                    'X-User-Email': user.email,
                    'X-User-Role': user.role,
                }
            });
            if (!response.ok) throw new Error('Failed to delete document');
            await fetchDocuments();
            setDeleteDialogOpen(false);
            toast({ title: 'Success', description: 'Document deleted.', variant: 'destructive'});
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Putaway</h1>
                 {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Putaway Documents</CardTitle>
                                <CardDescription>A log of all items that have been put away.</CardDescription>
                            </div>
                             <div className="flex w-full md:w-auto items-center gap-2">
                               {isSuperAdmin && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('Done')} disabled={selectedIds.length === 0 || isSubmitting}><Check className="mr-2 h-4 w-4"/>Confirm</Button>
                                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('Pending')} disabled={selectedIds.length === 0 || isSubmitting}><Ban className="mr-2 h-4 w-4"/>Pending</Button>
                                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={selectedIds.length === 0 || isSubmitting}><Trash2 className="mr-2 h-4 w-4"/>Delete Selected</Button>
                                </>
                               )}
                            </div>
                        </div>
                         <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                            <Input placeholder="Search Document No..." value={searchDocument} onChange={(e) => setSearchDocument(e.target.value)} />
                            <Input placeholder="Search Barcode..." value={searchBarcode} onChange={(e) => setSearchBarcode(e.target.value)} />
                         </div>
                    </CardHeader>
                    <CardContent>
                       <div className="border rounded-lg">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={paginatedDocs.length > 0 && selectedIds.length === paginatedDocs.length}
                                                onCheckedChange={(checked) => {
                                                    const newSelection = { ...selection };
                                                    paginatedDocs.forEach(doc => newSelection[doc.id] = !!checked);
                                                    setSelection(newSelection);
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>No. Document</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>QTY</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Exp Date</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Checked By</TableHead>
                                        {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={12} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                                    ) : paginatedDocs.length > 0 ? (
                                        paginatedDocs.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell><Checkbox checked={selection[doc.id] || false} onCheckedChange={(checked) => setSelection(prev => ({...prev, [doc.id]: !!checked}))} /></TableCell>
                                                <TableCell>{doc.no_document}</TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell><Badge>{doc.qty}</Badge></TableCell>
                                                <TableCell><Badge variant={doc.status === 'Done' ? 'default' : 'secondary'}>{doc.status}</Badge></TableCell>
                                                <TableCell>{doc.sku}</TableCell>
                                                <TableCell>{doc.barcode}</TableCell>
                                                <TableCell>{doc.brand}</TableCell>
                                                <TableCell>{format(new Date(doc.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{doc.location}</TableCell>
                                                <TableCell>{doc.check_by}</TableCell>
                                                {isSuperAdmin && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(doc)}><Pencil className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedDoc(doc); setDeleteDialogOpen(true);}}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={12} className="h-24 text-center">No documents found.</TableCell></TableRow>
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
                                        {[5, 20, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Putaway Document</DialogTitle>
                </DialogHeader>
                {selectedDoc && (
                    <div className="grid gap-4 py-4">
                        {/* Form fields for editing */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sku-edit" className="text-right">SKU</Label>
                          <Input id="sku-edit" value={selectedDoc.sku} onChange={e => setSelectedDoc({...selectedDoc, sku: e.target.value})} className="col-span-3"/>
                        </div>
                        {/* Add other fields as needed */}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>Are you sure you want to delete document {selectedDoc?.no_document}? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                         <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
