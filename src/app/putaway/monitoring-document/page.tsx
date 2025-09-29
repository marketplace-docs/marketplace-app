
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, ChevronUp, ChevronDown, Download, Upload, Trash2, Pencil } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import type { PutawayDocument } from '@/types/putaway-document';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const ExpandedRow = ({ item }: { item: PutawayDocument }) => (
    <TableRow className="bg-muted/50 hover:bg-muted/60">
        <TableCell colSpan={6} className="p-0">
            <div className="p-4">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            {/* The no_document from putaway_documents is the reference from inbound_documents */}
                            <TableCell>{item.no_document}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.qty}</TableCell>
                            <TableCell>marketplace</TableCell>
                             <TableCell>{format(new Date(item.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </TableCell>
    </TableRow>
);


export default function MonitoringPutawayPage() {
    const [documents, setDocuments] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [searchDocumentNo, setSearchDocumentNo] = useState('');
    const [searchBarcode, setSearchBarcode] = useState('');
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<PutawayDocument | null>(null);

    const canPerformBulkActions = user?.role && ['Super Admin', 'Manager', 'Supervisor'].includes(user.role);
    const canEditDelete = user?.role && ['Super Admin', 'Manager', 'Supervisor'].includes(user.role);


    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) {
                throw new Error('Failed to fetch putaway documents');
            }
            const data: PutawayDocument[] = await response.json();
            setDocuments(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
            doc.no_document.toLowerCase().includes(searchDocumentNo.toLowerCase()) &&
            doc.barcode.toLowerCase().includes(searchBarcode.toLowerCase())
        );
    }, [documents, searchDocumentNo, searchBarcode]);

    const handleSelectAll = (checked: boolean) => {
        const newSelection: Record<string, boolean> = {};
        if (checked) {
            filteredDocuments.forEach(d => newSelection[d.id] = true);
        }
        setSelection(newSelection);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelection(prev => ({...prev, [id]: checked}));
    };

    const selectedIds = useMemo(() => Object.keys(selection).filter(id => selection[id]), [selection]);

    const handleBulkAction = async (status: 'Done' | 'Pending') => {
        if (selectedIds.length === 0 || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/putaway-documents/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, status, userName: user.name, userEmail: user.email, userRole: user.role }),
            });
            if (!response.ok) throw new Error(`Failed to update status to ${status}`);
            await fetchDocuments();
            setSelection({});
            toast({ title: 'Success', description: `${selectedIds.length} documents updated to ${status}` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0 || !user) return;
        setIsSubmitting(true);
        try {
             const response = await fetch('/api/putaway-documents/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, userName: user.name, userEmail: user.email, userRole: user.role }),
            });
            if (!response.ok) throw new Error('Failed to delete documents');
            await fetchDocuments();
            setSelection({});
            toast({ title: 'Success', description: `${selectedIds.length} documents deleted.`, variant: 'destructive' });
        } catch(err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenEditDialog = (doc: PutawayDocument) => {
        setSelectedDoc(doc);
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
            toast({ title: "Success", description: "Document updated."});
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
                headers: { 'X-User-Name': user.name, 'X-User-Email': user.email, 'X-User-Role': user.role }
            });
            if (!response.ok) throw new Error('Failed to delete document');
            await fetchDocuments();
            setDeleteDialogOpen(false);
            toast({ title: "Deleted", description: "Document has been deleted.", variant: 'destructive'});
        } catch(err: any) {
             toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Putaway</h1>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Putaway Documents</CardTitle>
                                <CardDescription>A log of all items that have been put away.</CardDescription>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <Input placeholder="Search Document No..." value={searchDocumentNo} onChange={(e) => setSearchDocumentNo(e.target.value)} />
                                <Input placeholder="Search Barcode..." value={searchBarcode} onChange={(e) => setSearchBarcode(e.target.value)} />
                            </div>
                        </div>
                         {canPerformBulkActions && (
                            <div className="flex items-center gap-2 mt-4">
                                <Button variant="outline" onClick={() => handleBulkAction('Done')} disabled={isSubmitting || selectedIds.length === 0}>Confirm ({selectedIds.length})</Button>
                                <Button variant="outline" onClick={() => handleBulkAction('Pending')} disabled={isSubmitting || selectedIds.length === 0}>Pending ({selectedIds.length})</Button>
                                <Button variant="destructive" onClick={handleBulkDelete} disabled={isSubmitting || selectedIds.length === 0}><Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                         <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"><Checkbox onCheckedChange={handleSelectAll} checked={selection.length > 0 && selectedIds.length === filteredDocuments.length} /></TableHead>
                                        <TableHead>Document No.</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>EXP Date</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>QTY</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Checked By</TableHead>
                                        {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={12} className="h-24 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></TableCell></TableRow>
                                    ) : filteredDocuments.length > 0 ? (
                                        filteredDocuments.map(doc => (
                                            <TableRow key={doc.id}>
                                                <TableCell><Checkbox checked={selection[doc.id] || false} onCheckedChange={(checked) => handleSelectRow(doc.id, Boolean(checked))} /></TableCell>
                                                <TableCell>{doc.no_document}</TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{doc.sku}</TableCell>
                                                <TableCell>{doc.barcode}</TableCell>
                                                <TableCell>{doc.brand}</TableCell>
                                                <TableCell>{format(new Date(doc.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{doc.location}</TableCell>
                                                <TableCell>{doc.qty}</TableCell>
                                                <TableCell><Badge variant={doc.status === 'Done' ? 'default' : 'secondary'}>{doc.status}</Badge></TableCell>
                                                <TableCell>{doc.check_by}</TableCell>
                                                {canEditDelete && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(doc)}><Pencil className="h-4 w-4"/></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(doc)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                        </div>
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
                    </CardContent>
                </Card>

                 {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Putaway Document</DialogTitle></DialogHeader>
                        {selectedDoc && (
                             <div className="grid gap-4 py-4">
                               <div className="space-y-2"><Label>Location</Label><Input value={selectedDoc.location} onChange={(e) => setSelectedDoc({...selectedDoc, location: e.target.value})} /></div>
                               <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={selectedDoc.qty} onChange={(e) => setSelectedDoc({...selectedDoc, qty: parseInt(e.target.value)})} /></div>
                               <div className="space-y-2"><Label>Status</Label>
                                <Select value={selectedDoc.status} onValueChange={(v: 'Done' | 'Pending') => setSelectedDoc({...selectedDoc, status: v})}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
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
                            <Button onClick={handleSaveChanges} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                {/* Delete Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>Are you sure you want to delete document {selectedDoc?.no_document}? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
