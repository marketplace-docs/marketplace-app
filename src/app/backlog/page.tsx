
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
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
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Pencil,
  ChevronsLeft,
  ChevronsRight,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/main-layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

type BacklogItem = {
  id: number;
  store_name: string;
  payment_accepted: number;
  marketplace: string;
};

type GroupingKey = "store_name" | "marketplace";

const marketplaceColors: { [key: string]: string } = {
  'Shopee': '#F97316', // Orange
  'Lazada': '#2563EB', // Blue
  'Tiktok': '#000000', // Black
};

export default function BacklogPage() {
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [chartGrouping, setChartGrouping] = useState<GroupingKey>('store_name');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<number, Partial<BacklogItem>>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Admin';


  const fetchBacklogItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/backlog-items');
      if (!response.ok) throw new Error('Failed to fetch backlog items');
      const data = await response.json();
      setBacklogItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBacklogItems();
  }, [fetchBacklogItems]);

  const totalPages = Math.ceil(backlogItems.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    return backlogItems.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [backlogItems, currentPage, rowsPerPage]);
  
  const detailStoreData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    backlogItems.forEach(item => {
        if (!grouped[item.marketplace]) {
            grouped[item.marketplace] = 0;
        }
        grouped[item.marketplace] += item.payment_accepted;
    });
    return Object.entries(grouped).map(([marketplace, payment_accepted]) => ({
        marketplace,
        payment_accepted
    })).sort((a, b) => b.payment_accepted - a.payment_accepted);
  }, [backlogItems]);


  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);

  const handleExport = () => {
    if (backlogItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }
    const headers = ["store name", "payment accepted", "marketplace"];
    const csvContent = [
        headers.join(","),
        ...backlogItems.map(item => [
          `"${item.store_name.replace(/"/g, '""')}"`,
          item.payment_accepted,
          `"${item.marketplace.replace(/"/g, '""')}"`
        ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `backlog_data_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Backlog data exported as CSV." });
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
        const requiredHeaders = ['store name', 'payment accepted', 'marketplace'];
        if(!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error(`Invalid CSV headers. Required: ${requiredHeaders.join(', ')}`);
        }

        const newItems: Omit<BacklogItem, 'id'>[] = lines.slice(1).map((line) => {
            const values = line.split(',');
            const store_name = values[headers.indexOf('store name')]?.trim().replace(/"/g, '');
            const payment_accepted = parseInt(values[headers.indexOf('payment accepted')]?.trim(), 10);
            const marketplace = values[headers.indexOf('marketplace')]?.trim().replace(/"/g, '');

            if (store_name && !isNaN(payment_accepted) && marketplace) {
                return { store_name, payment_accepted, marketplace };
            }
            return null;
        }).filter((item): item is Omit<BacklogItem, 'id'> => item !== null);
        
        const response = await fetch('/api/backlog-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: newItems, user: { name: user.name, email: user.email } })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload data.");
        }
        
        await fetchBacklogItems();
        setUploadDialogOpen(false);
        toast({
          title: "Success",
          description: `${newItems.length} items uploaded successfully.`,
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message || "An error occurred while parsing the CSV file.",
        });
      } finally {
        setIsSubmitting(false);
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { value: number; marketplace: string } } = {};
    const keyToGroup = chartGrouping === 'store_name' ? 'store_name' : 'marketplace';

    backlogItems.forEach(item => {
      const key = item[keyToGroup];
      if (!groupedData[key]) {
        groupedData[key] = { value: 0, marketplace: item.marketplace };
      }
      groupedData[key].value += item.payment_accepted;
    });

    return Object.entries(groupedData).map(([name, data]) => ({
      name: name,
      'Payment Accepted': data.value,
      fill: marketplaceColors[data.marketplace] || '#6366f1',
    }));
  }, [backlogItems, chartGrouping]);

  const totalMarketplaceStore = useMemo(() => {
    const uniqueStores = new Set(backlogItems.map(s => s.store_name));
    return uniqueStores.size;
  }, [backlogItems]);

  const totalPaymentAccepted = useMemo(() => {
    return backlogItems.reduce((acc, item) => acc + item.payment_accepted, 0);
  }, [backlogItems]);

  const handleEditToggle = async () => {
    if (isEditing) {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const updatePromises = Object.entries(editedItems).map(([id, changes]) =>
              fetch(`/api/backlog-items/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...changes, userName: user.name, userEmail: user.email })
              })
            );
            const responses = await Promise.all(updatePromises);
            const failedUpdates = responses.filter(res => !res.ok);
            if (failedUpdates.length > 0) {
                throw new Error(`${failedUpdates.length} updates failed.`);
            }
            await fetchBacklogItems();
            setEditedItems({});
            toast({ title: "Success", description: "All changes have been saved." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message || "Could not save changes." });
        } finally {
            setIsSubmitting(false);
        }
    }
    setIsEditing(!isEditing);
  };

  const handleItemChange = (id: number, field: keyof Omit<BacklogItem, 'id'>, value: string | number) => {
    setEditedItems(prev => ({
        ...prev,
        [id]: {
            ...prev[id],
            [field]: value
        }
    }));
  };

  const handleOpenDeleteDialog = (item: BacklogItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem || !user) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/backlog-items/${selectedItem.id}`, { 
          method: 'DELETE',
          headers: {
            'X-User-Name': user.name,
            'X-User-Email': user.email
          }
        });
        if (!response.ok) throw new Error("Failed to delete item.");
        
        await fetchBacklogItems();
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        toast({ title: "Success", description: "Item deleted successfully.", variant: 'destructive' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message || "Could not delete item." });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Backlog Marketplace</h1>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
                <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" disabled={isSubmitting}>
                            <Upload className="mr-2 h-4 w-4" /> Import
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Backlog CSV</DialogTitle>
                            <DialogDescription>
                                Select a CSV file to bulk upload backlog items. The file must contain the headers: store name, payment accepted, marketplace.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                           <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                           </Button>
                           <p className="text-xs text-muted-foreground mt-2">
                                Don't have a template? <a href="/templates/backlog_items_template.csv" download className="underline text-primary">Download CSV template</a>
                           </p>
                        </div>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleEditToggle} disabled={isSubmitting}>
                  {isEditing ? (isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />) : <Pencil className="mr-2 h-4 w-4" />}
                  {isEditing ? 'Save' : 'Edit'}
                </Button>
                <Button variant="default" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>
          )}
        </div>

        {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        
        <Tabs defaultValue="all-store">
            <TabsList className="bg-gray-200">
                <TabsTrigger value="all-store" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">MP All-Store</TabsTrigger>
                <TabsTrigger value="detail-store" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">MP Detail Store</TabsTrigger>
            </TabsList>
            <TabsContent value="all-store">
                <Card className="mt-4">
                    <CardContent className="pt-6">
                    <div className="border rounded-lg">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>STORE NAME</TableHead>
                            <TableHead>PAYMENT ACCEPTED</TableHead>
                            <TableHead>MARKETPLACE</TableHead>
                            {isSuperAdmin && <TableHead className="text-right">ACTIONS</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={isSuperAdmin ? 4 : 3} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedItems.length > 0 ? (
                            paginatedItems.map((item) => (
                                <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {isEditing && isSuperAdmin ? (
                                    <Input 
                                      type="text"
                                      value={editedItems[item.id]?.store_name ?? item.store_name} 
                                      onChange={(e) => handleItemChange(item.id, 'store_name', e.target.value)} 
                                      className="h-8"
                                    />
                                  ) : (
                                    item.store_name
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing && isSuperAdmin ? (
                                    <Input 
                                      type="number"
                                      value={editedItems[item.id]?.payment_accepted ?? item.payment_accepted} 
                                      onChange={(e) => handleItemChange(item.id, 'payment_accepted', parseInt(e.target.value, 10) || 0)} 
                                      className="h-8"
                                    />
                                  ) : (
                                    item.payment_accepted
                                  )}
                                </TableCell>
                                <TableCell>
                                {isEditing && isSuperAdmin ? (
                                    <Input 
                                      type="text"
                                      value={editedItems[item.id]?.marketplace ?? item.marketplace} 
                                      onChange={(e) => handleItemChange(item.id, 'marketplace', e.target.value)} 
                                      className="h-8"
                                    />
                                  ) : (
                                    item.marketplace
                                  )}
                                </TableCell>
                                {isSuperAdmin && (
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(item)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                )}
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={isSuperAdmin ? 4 : 3} className="h-24 text-center text-muted-foreground">
                                No backlog data available.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Rows per page:</span>
                            <Select
                                value={`${rowsPerPage}`}
                                onValueChange={(value) => {
                                    setRowsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={rowsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedItems.length} of {backlogItems.length}</span>
                            <div className="flex items-center space-x-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFirstPage} disabled={currentPage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleLastPage} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="detail-store">
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>MARKETPLACE</TableHead>
                                        <TableHead className="text-right">PAYMENT ACCEPTED</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detailStoreData.length > 0 ? (
                                        detailStoreData.map((item) => (
                                            <TableRow key={item.marketplace}>
                                                <TableCell className="font-medium">{item.marketplace}</TableCell>
                                                <TableCell className="text-right">{item.payment_accepted.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                No data available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Grafik Backlog</CardTitle>
                <Tabs defaultValue="store_name" onValueChange={(value) => setChartGrouping(value as GroupingKey)} className="mt-2">
                  <TabsList className="bg-gray-200">
                    <TabsTrigger value="store_name" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Store Name</TabsTrigger>
                    <TabsTrigger value="marketplace" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Marketplace</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 border rounded-md">
                      <span>Marketplace Store</span>
                      <span className="font-bold ml-4">{totalMarketplaceStore}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-md border-green-500 text-green-600">
                      <span>Payment Accepted</span>
                      <span className="font-bold ml-4">{totalPaymentAccepted.toLocaleString()}</span>
                  </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 20, left: -10, bottom: 80 }}
                      >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                              dataKey="name" 
                              tickLine={false} 
                              axisLine={false} 
                              tick={{ fontSize: 12 }} 
                              angle={-45}
                              textAnchor="end"
                              interval={0}
                              height={100}
                          />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false}/>
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-1 gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-[0.8rem] font-bold">
                                          {label}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Payment Accepted
                                        </span>
                                        <span className="font-bold text-foreground">
                                          {payload[0].value?.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="Payment Accepted" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                              <LabelList dataKey="Payment Accepted" position="top" className="fill-foreground" fontSize={12} formatter={(value: number) => value.toLocaleString()} />
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                      This will permanently delete the backlog for <span className="font-semibold">{selectedItem?.store_name}</span>. This action cannot be undone.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteItem} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

    