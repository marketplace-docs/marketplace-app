
'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import type { MarketplaceStore } from '@/types/marketplace-store';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, AlertCircle, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function MonitoringStorePage() {
  const [stores, setStores] = useState<MarketplaceStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<MarketplaceStore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const canUpdate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(user.role);
  const canDelete = user?.role === 'Super Admin';

  const [searchTerm, setSearchTerm] = useState('');

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/marketplace-stores');
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      const data = await response.json();
      setStores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      (store.marketplace_name && store.marketplace_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store.store_name && store.store_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store.platform && store.platform.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stores, searchTerm]);

  const totalPages = Math.ceil(filteredStores.length / rowsPerPage);
  const paginatedStores = filteredStores.slice(
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
  }, [rowsPerPage, searchTerm]);

  const handleOpenEditDialog = (store: MarketplaceStore) => {
    setSelectedStore({ ...store });
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (store: MarketplaceStore) => {
    setSelectedStore(store);
    setDeleteDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedStore || !user) return;
    setIsSubmitting(true);
    try {
      const { id, marketplace_name, store_name, platform } = selectedStore;
      const response = await fetch(`/api/marketplace-stores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace_name, store_name, platform, userName: user.name, userEmail: user.email, userRole: user.role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update store');
      }

      await fetchStores();
      setEditDialogOpen(false);
      setSelectedStore(null);
      toast({ title: "Success", description: "Store has been updated successfully." });
    } catch (error) {
       toast({ variant: 'destructive', title: "Error", description: "Could not update store." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!selectedStore || !user) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/marketplace-stores/${selectedStore.id}`, {
            method: 'DELETE',
            headers: {
              'X-User-Name': user.name,
              'X-User-Email': user.email,
              'X-User-Role': user.role
            }
        });

        if(!response.ok) {
            throw new Error('Failed to delete store');
        }
        
        await fetchStores();
        setDeleteDialogOpen(false);
        setSelectedStore(null);
        toast({ title: "Success", description: "Store has been deleted.", variant: "destructive" });
    } catch (error) {
         toast({ variant: 'destructive', title: "Error", description: "Could not delete store." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (filteredStores.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }
    const headers = ["marketplace_name", "store_name", "platform"];
    const csvContent = [
        headers.join(","),
        ...filteredStores.map(item => [
            `"${item.marketplace_name?.replace(/"/g, '""') || ''}"`,
            `"${item.store_name?.replace(/"/g, '""') || ''}"`,
            `"${item.platform?.replace(/"/g, '""') || ''}"`
        ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `marketplace_stores_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Data has been exported to CSV." });
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

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            const requiredHeaders = ['marketplace_name', 'store_name', 'platform'];
             if (!requiredHeaders.every(h => headers.includes(h))) {
                throw new Error(`Invalid CSV headers. Required: ${requiredHeaders.join(', ')}`);
            }

            const newStores = lines.slice(1).map(line => {
                const values = line.split(',');
                const marketplace_name = values[headers.indexOf('marketplace_name')]?.trim().replace(/"/g, '');
                const store_name = values[headers.indexOf('store_name')]?.trim().replace(/"/g, '');
                const platform = values[headers.indexOf('platform')]?.trim().replace(/"/g, '');
                if (marketplace_name && store_name && platform) {
                    return { marketplace_name, store_name, platform };
                }
                return null;
            }).filter(Boolean);

             const response = await fetch('/api/marketplace-stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stores: newStores, user }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to upload stores.");
            }

            await fetchStores();
            setUploadDialogOpen(false);
            toast({ title: 'Success', description: `${newStores.length} stores uploaded.` });

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };


  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Monitoring Store</h1>
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
              <CardTitle>Marketplace Stores</CardTitle>
              <CardDescription>A list of all created marketplace stores.</CardDescription>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
                <Input 
                    placeholder="Search store..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 md:flex-auto md:w-auto"
                />
                 {canUpdate && (
                   <>
                    <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Upload</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload CSV</DialogTitle>
                                <DialogDescription>
                                    Select a CSV file to bulk upload marketplace stores. The file must contain the headers: marketplace_name, store_name, platform.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                               <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                               </Button>
                               <p className="text-xs text-muted-foreground mt-2">
                                    Don't have a template? <a href="/templates/marketplace_stores_template.csv" download className="underline text-primary">Download CSV template</a>
                               </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                   </>
                 )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marketplace Name</TableHead>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Created At</TableHead>
                    {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                  ) : paginatedStores.length > 0 ? (
                    paginatedStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.marketplace_name}</TableCell>
                        <TableCell>{store.store_name}</TableCell>
                        <TableCell>{store.platform}</TableCell>
                        <TableCell>{format(new Date(store.created_at), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        {(canUpdate || canDelete) && (
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {canUpdate && (
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(store)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                    )}
                                    {canDelete && (
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(store)}>
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
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No stores found. Go to Create to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {filteredStores.length > 0 ? currentPage : 0} of {totalPages}
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
                            {[10, 25, 50].map((pageSize) => (
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
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
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
                  <DialogTitle>Edit Store</DialogTitle>
              </DialogHeader>
              {selectedStore && (
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="marketplace_name" className="text-right">Marketplace</Label>
                          <Input id="marketplace_name" value={selectedStore.marketplace_name} className="col-span-3" onChange={(e) => setSelectedStore({ ...selectedStore, marketplace_name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="store_name" className="text-right">Store Name</Label>
                          <Input id="store_name" value={selectedStore.store_name} className="col-span-3" onChange={(e) => setSelectedStore({ ...selectedStore, store_name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="platform" className="text-right">Platform</Label>
                          <Input id="platform" value={selectedStore.platform || ''} className="col-span-3" onChange={(e) => setSelectedStore({ ...selectedStore, platform: e.target.value })} />
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
                      This action cannot be undone. This will permanently delete the store <span className="font-semibold">{selectedStore?.store_name}</span>.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteStore} disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
