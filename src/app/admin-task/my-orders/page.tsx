

'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format, isWithinInterval } from 'date-fns';
import { Loader2, AlertCircle, PackageMinus, Search, SlidersHorizontal, Calendar as CalendarIcon, Upload, Play, Plus, MessageSquareText, Pencil, Save } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { BatchProduct } from '@/types/batch-product';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Order } from '@/types/order';


type NewOrder = Omit<Order, 'id' | 'status' | 'order_date' | 'total_stock_on_hand' | 'location'>;

type Filters = {
    reference: string;
    city: string;
    customer: string;
    orderType: string;
    from: string;
    sku: string;
    qty: string;
    deliveryType: string;
    dateRange: DateRange | undefined;
    reserved: boolean;
    ecobox: boolean;
};


export default function MyOrdersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrders, setEditedOrders] = useState<Record<number, Partial<Order>>>({});
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isWaveDialogOpen, setWaveDialogOpen] = useState(false);
    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    const [newOrder, setNewOrder] = useState<Partial<NewOrder>>({
      qty: 1,
      sku: '',
    });

    const [filters, setFilters] = useState<Filters>({
        reference: '',
        city: '',
        customer: '',
        orderType: '',
        from: '',
        sku: '',
        qty: '',
        deliveryType: '',
        dateRange: undefined,
        reserved: false,
        ecobox: false,
    });
    
    const [uniqueFromOptions, setUniqueFromOptions] = useState<string[]>([]);


    const selectedCount = Object.values(selection).filter(Boolean).length;
    
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [ordersRes, stockRes] = await Promise.all([
                fetch('/api/manual-orders'),
                fetch('/api/master-product/batch-products')
            ]);
            
            if (!ordersRes.ok) throw new Error("Failed to fetch manual orders.");
            if (!stockRes.ok) throw new Error("Failed to fetch product stock.");

            const ordersData: Order[] = await ordersRes.json();
            const stockData: BatchProduct[] = await stockRes.json();

            // Aggregate stock by SKU
            const stockBySku = stockData.reduce((acc, product) => {
                if (!acc.has(product.sku)) {
                    acc.set(product.sku, { total: 0, location: 'N/A' });
                }
                const current = acc.get(product.sku)!;
                current.total += product.stock;
                // Simple logic: get the first location. Could be improved if needed.
                if (current.location === 'N/A' && product.stock > 0) {
                  current.location = product.location;
                }
                return acc;
            }, new Map<string, { total: number; location: string }>());

            const ordersWithStatus: Order[] = ordersData.map((order) => {
                const stockInfo = stockBySku.get(order.sku) || { total: 0, location: 'N/A' };
                return {
                    ...order,
                    status: order.qty > stockInfo.total ? 'Out of Stock' : 'Payment Accepted',
                    total_stock_on_hand: stockInfo.total,
                    location: stockInfo.location,
                };
            });

            setAllOrders(ordersWithStatus);
            setFilteredOrders(ordersWithStatus);
            
            const fromSet = new Set(ordersWithStatus.map(order => order.from));
            setUniqueFromOptions(Array.from(fromSet));


        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleFilterChange = (name: keyof Filters, value: any) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        let tempOrders = [...allOrders];

        if (filters.reference) {
            tempOrders = tempOrders.filter(o => o.reference.toLowerCase().includes(filters.reference.toLowerCase()));
        }
        if (filters.city) {
            tempOrders = tempOrders.filter(o => o.city.toLowerCase().includes(filters.city.toLowerCase()));
        }
        if (filters.customer) {
            tempOrders = tempOrders.filter(o => o.customer.toLowerCase().includes(filters.customer.toLowerCase()));
        }
        if (filters.sku) {
            tempOrders = tempOrders.filter(o => o.sku.toLowerCase().includes(filters.sku.toLowerCase()));
        }
        if (filters.orderType) {
            tempOrders = tempOrders.filter(o => o.type === filters.orderType);
        }
        if (filters.from) {
            tempOrders = tempOrders.filter(o => o.from === filters.from);
        }
         if (filters.qty) {
            tempOrders = tempOrders.filter(o => o.qty === parseInt(filters.qty, 10));
        }
        if (filters.deliveryType) {
            tempOrders = tempOrders.filter(o => o.delivery_type === filters.deliveryType);
        }
        if (filters.dateRange?.from && filters.dateRange?.to) {
            tempOrders = tempOrders.filter(o => {
                const orderDate = new Date(o.order_date);
                return isWithinInterval(orderDate, { start: filters.dateRange!.from!, end: filters.dateRange!.to! });
            });
        }
        setFilteredOrders(tempOrders);
    };

    const handleReset = () => {
        setFilters({
            reference: '', city: '', customer: '', orderType: '', from: '', sku: '', qty: '',
            deliveryType: '', dateRange: undefined, reserved: false, ecobox: false
        });
        setFilteredOrders(allOrders);
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user', JSON.stringify(user));

        try {
            const response = await fetch('/api/manual-orders', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'An unknown error occurred during upload.');
            }

            toast({
                title: 'Upload Successful',
                description: `${result.successCount} orders have been uploaded.`,
            });
            await fetchOrders();
            setUploadDialogOpen(false);
            
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddManualOrder = async () => {
      if (!user) return;
      setIsSubmitting(true);
      try {
        const payload = {
          ...newOrder,
          order_date: new Date().toISOString()
        }
        const response = await fetch('/api/manual-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ordersToInsert: [payload],
                user,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add manual order.');
        }

        await fetchOrders();
        setAddDialogOpen(false);
        setNewOrder({ qty: 1, sku: '' });

        toast({
            title: 'Success',
            description: 'Manual order has been added.',
        });

      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'Failed to Add',
              description: error.message,
          });
      } finally {
          setIsSubmitting(false);
      }
    };

    const handleStartWave = async () => {
        if (!user || selectedCount === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one order to start a wave.' });
            return;
        }

        const selectedOrderRefs = Object.keys(selection).filter(ref => selection[ref]);
        const selectedOrdersFull = allOrders.filter(order => selectedOrderRefs.includes(order.reference));
        
        // Validation 1: Ensure no 'Out of Stock' orders are included
        if (selectedOrdersFull.some(order => order.status === 'Out of Stock')) {
            toast({ variant: 'destructive', title: 'Invalid Orders', description: 'Cannot start a wave with "Out of Stock" orders.' });
            setWaveDialogOpen(false);
            return;
        }

        // Validation 2: Check for duplicate references
        const refSet = new Set(selectedOrdersFull.map(o => o.reference));
        if (refSet.size !== selectedOrdersFull.length) {
            toast({ variant: 'destructive', title: 'Invalid Selection', description: 'Duplicate order references found in selection. Please check your data.' });
            setWaveDialogOpen(false);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/waves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderReferences: selectedOrderRefs,
                    user,
                    waveType: "Manual"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create wave.');
            }
            
            const { wave } = await response.json();

            toast({ title: 'Wave Created', description: `Wave ${wave.wave_document_number} started. Redirecting...` });
            
            // Redirect to monitoring page with params to trigger print
            router.push(`/admin-task/monitoring-orders?wave_id=${wave.id}&print=true`);

        } catch (error: any)
 {
            toast({ variant: 'destructive', title: 'Wave Creation Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
            setWaveDialogOpen(false);
        }
    };
    
    const handleReportToCs = async (order: Order) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to report.' });
            return;
        }
        
        // 1. Delete the order from the database
        try {
            const response = await fetch(`/api/manual-orders/${order.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': user.name,
                    'X-User-Email': user.email,
                    'X-User-Role': user.role,
                }
            });
             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete the order after reporting.");
            }
            
            // 2. Open mail client
            const subject = `Out of Stock Report for Order: ${order.reference}`;
            const body = `Hi CS Team,\n\nPlease be advised that the following order is currently out of stock and has been removed from the wave creation list:\n\nOrder Reference: ${order.reference}\nSKU: ${order.sku}\nQuantity: ${order.qty}\nCustomer: ${order.customer}\n\nPlease take the necessary action.\n\nThanks,\n${user?.name || 'Warehouse Team'}`;
            window.location.href = `mailto:project.teamedit@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            toast({ title: 'Reported & Removed', description: `Order ${order.reference} has been reported and removed.` });
            
            // 3. Refresh the data
            await fetchOrders();

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: error.message,
            });
        }
    };

    const handleToggleEdit = async () => {
        if (isEditing) { // When clicking "Save Changes"
            if (Object.keys(editedOrders).length === 0) {
                toast({ title: 'No changes to save.' });
                setIsEditing(false);
                return;
            }
            setIsSubmitting(true);
            try {
                const updatePromises = Object.entries(editedOrders).map(([id, changes]) =>
                    fetch(`/api/manual-orders/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...changes, user }),
                    })
                );
                
                await Promise.all(updatePromises);
                toast({ title: 'Success', description: 'All changes have been saved.' });
                setEditedOrders({});
                await fetchOrders();
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
            } finally {
                setIsSubmitting(false);
                setIsEditing(false);
            }
        } else { // When clicking "Edit Orders"
            setIsEditing(true);
        }
    };

    const handleOrderChange = (id: number, field: keyof Order, value: string | number) => {
        setEditedOrders(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
        setFilteredOrders(prev => prev.map(order => 
            order.id === id ? { ...order, [field]: value } : order
        ));
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Wave Marketplace</h1>
                    <p className="text-sm text-muted-foreground">Only order with <span className="font-semibold text-primary">Payment accepted</span>, and <span className="font-semibold text-primary">Ready To Be Shipped</span> can be proceesed</p>
                </div>
                
                <Accordion type="single" collapsible defaultValue='filter' className="w-full">
                    <AccordionItem value="filter" className="border rounded-lg">
                        <AccordionTrigger className="p-4 bg-muted/50 rounded-t-lg hover:no-underline">
                            <div className='flex items-center gap-2'>
                                <SlidersHorizontal className="h-5 w-5" />
                                <span className="font-semibold">Filter</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <Input placeholder="Reference" value={filters.reference} onChange={(e) => handleFilterChange('reference', e.target.value)} />
                                <Input placeholder="City" value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} />
                                <Input placeholder="Customer" value={filters.customer} onChange={(e) => handleFilterChange('customer', e.target.value)} />
                                <Select value={filters.orderType} onValueChange={(value) => handleFilterChange('orderType', value)}>
                                    <SelectTrigger><SelectValue placeholder="Order Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="on-sale">On Sale</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select value={filters.from} onValueChange={(value) => handleFilterChange('from', value)}>
                                    <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                                    <SelectContent>
                                        {uniqueFromOptions.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="SKU" value={filters.sku} onChange={(e) => handleFilterChange('sku', e.target.value)} />
                                <Select value={filters.qty} onValueChange={(value) => handleFilterChange('qty', value)}>
                                    <SelectTrigger><SelectValue placeholder="Qty" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filters.deliveryType} onValueChange={(value) => handleFilterChange('deliveryType', value)}>
                                    <SelectTrigger><SelectValue placeholder="Delivery Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="regular">Regular</SelectItem>
                                        <SelectItem value="express">Express</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.dateRange && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.dateRange?.from ? (filters.dateRange.to ? (<>{format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}</>) : format(filters.dateRange.from, "LLL dd, y")) : (<span>Order Date From Date</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={filters.dateRange?.from} selected={filters.dateRange} onSelect={(value) => handleFilterChange('dateRange', value)} numberOfMonths={2}/></PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date-to" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.dateRange?.to && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.dateRange?.to ? format(filters.dateRange.to, "LLL dd, y") : <span>Order Date To Date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="single" selected={filters.dateRange?.to} onSelect={(day) => handleFilterChange('dateRange', {...filters.dateRange, to: day})} /></PopoverContent>
                                </Popover>
                                <div className="flex items-center space-x-2"><Switch id="reserved" checked={filters.reserved} onCheckedChange={(value) => handleFilterChange('reserved', value)} /><Label htmlFor="reserved">Reserved</Label></div>
                                <div className="flex items-center space-x-2"><Switch id="ecobox" checked={filters.ecobox} onCheckedChange={(value) => handleFilterChange('ecobox', value)} /><Label htmlFor="ecobox">Ecobox</Label></div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center space-x-2"><Switch id="always-open" defaultChecked /><Label htmlFor="always-open">Always open</Label></div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleReset}>RESET</Button>
                                    <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" /> SEARCH</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                           <div className="flex items-center gap-8">
                                <div className="flex items-center space-x-2"><Label htmlFor="aisle-mode">Aisle Mode</Label><Switch id="aisle-mode" /></div>
                                <div className="flex items-center space-x-2"><Label htmlFor="bulk-mode">Bulk Mode</Label><Switch id="bulk-mode" /></div>
                           </div>
                            <div className="flex-1 w-full border-t sm:border-t-0 sm:border-l sm:pl-4 sm:ml-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                                        <DialogTrigger asChild>
                                             <Button variant="link" className="text-violet-600"><Plus className="mr-2 h-4 w-4"/>ADD MANUAL ORDER</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add Manual Order</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="reference" className="text-right">Reference</Label>
                                                    <Input id="reference" value={newOrder.reference || ''} onChange={(e) => setNewOrder({...newOrder, reference: e.target.value})} className="col-span-3" />
                                                </div>
                                                 <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="sku" className="text-right">SKU</Label>
                                                    <Input id="sku" value={newOrder.sku || ''} onChange={(e) => setNewOrder({...newOrder, sku: e.target.value})} className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="customer" className="text-right">Customer</Label>
                                                    <Input id="customer" value={newOrder.customer || ''} onChange={(e) => setNewOrder({...newOrder, customer: e.target.value})} className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="city" className="text-right">City</Label>
                                                    <Input id="city" value={newOrder.city || ''} onChange={(e) => setNewOrder({...newOrder, city: e.target.value})} className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="type" className="text-right">Type</Label>
                                                    <Input id="type" value={newOrder.type || ''} onChange={(e) => setNewOrder({...newOrder, type: e.target.value})} className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="from" className="text-right">From</Label>
                                                    <Input id="from" value={newOrder.from || ''} onChange={(e) => setNewOrder({...newOrder, from: e.target.value})} className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="delivery_type" className="text-right">Delivery Type</Label>
                                                    <Input id="delivery_type" value={newOrder.delivery_type || ''} onChange={(e) => setNewOrder({...newOrder, delivery_type: e.target.value})} className="col-span-3" />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="qty" className="text-right">Qty</Label>
                                                    <Input id="qty" type="number" value={newOrder.qty || 1} onChange={(e) => setNewOrder({...newOrder, qty: parseInt(e.target.value) || 1})} className="col-span-3" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handleAddManualOrder} disabled={isSubmitting}>
                                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                  Submit
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="link" className="text-violet-600" onClick={handleToggleEdit} disabled={isSubmitting}>
                                        {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                                        {isEditing ? 'SAVE CHANGES' : 'EDIT ORDERS'}
                                    </Button>
                                    <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-violet-600"><Upload className="mr-2 h-4 w-4"/>UPLOAD MANUAL ORDER</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Upload Manual Orders</DialogTitle>
                                                <DialogDescription>
                                                    Select a CSV file to bulk upload manual orders. Ensure the file has the correct columns.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                               <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                                               </Button>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Don't have a template? <a href="/templates/manual_orders_template.csv" download className="underline text-primary">Download CSV template</a>
                                                </p>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-semibold">SELECTED: <span className="text-green-600">{selectedCount} ORDER</span></p>
                                     <Dialog open={isWaveDialogOpen} onOpenChange={setWaveDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-blue-600 font-bold" disabled={selectedCount === 0}>
                                                <Play className="mr-2"/>START WAVE
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Confirm Start Wave</DialogTitle>
                                                <DialogDescription>
                                                    You are about to start a new wave with <span className="font-bold text-foreground">{selectedCount}</span> selected orders. Are you sure you want to proceed?
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setWaveDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handleStartWave} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4"/>}
                                                    Start
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedCount === filteredOrders.length && filteredOrders.length > 0}
                                        onCheckedChange={(checked) => {
                                            const newSelection: Record<string, boolean> = {};
                                            if (checked) {
                                                filteredOrders.forEach(o => newSelection[o.reference] = true);
                                            }
                                            setSelection(newSelection);
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>Delivery Type</TableHead>
                                <TableHead>Qty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                         <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map(order => (
                                <TableRow key={order.reference} data-state={selection[order.reference] && "selected"}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selection[order.reference] || false}
                                            onCheckedChange={(checked) => setSelection(prev => ({...prev, [order.reference]: !!checked}))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input value={editedOrders[order.id]?.reference ?? order.reference} onChange={(e) => handleOrderChange(order.id, 'reference', e.target.value)} className="h-8" />
                                        ) : (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="link" className="p-0 h-auto font-medium text-blue-600 hover:underline cursor-pointer">
                                                        {order.reference}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                {order.status === 'Payment Accepted' ? (
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>SKU</TableHead>
                                                                    <TableHead>QTY</TableHead>
                                                                    <TableHead>STOCK</TableHead>
                                                                    <TableHead>LOCATION</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                <TableRow>
                                                                    <TableCell>{order.sku}</TableCell>
                                                                    <TableCell>{order.qty}</TableCell>
                                                                    <TableCell>{order.total_stock_on_hand}</TableCell>
                                                                    <TableCell>{order.location}</TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                ) : (
                                                        <Badge variant="secondary" className="w-full justify-center text-base bg-gray-200 text-gray-800">
                                                            Out of Stock
                                                        </Badge>
                                                )}
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge className={cn(
                                            order.status === 'Payment Accepted' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600',
                                            "text-white"
                                        )}>
                                            {order.status}
                                        </Badge>
                                        {order.status === 'Out of Stock' && (
                                             <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => handleReportToCs(order)}>
                                                            <MessageSquareText className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Report to CS & Remove</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(order.order_date), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                    <TableCell>{isEditing ? <Input value={editedOrders[order.id]?.customer ?? order.customer} onChange={(e) => handleOrderChange(order.id, 'customer', e.target.value)} className="h-8" /> : order.customer}</TableCell>
                                    <TableCell>{isEditing ? <Input value={editedOrders[order.id]?.city ?? order.city} onChange={(e) => handleOrderChange(order.id, 'city', e.target.value)} className="h-8" /> : order.city}</TableCell>
                                    <TableCell>{isEditing ? <Input value={editedOrders[order.id]?.type ?? order.type} onChange={(e) => handleOrderChange(order.id, 'type', e.target.value)} className="h-8" /> : order.type}</TableCell>
                                    <TableCell>{isEditing ? <Input value={editedOrders[order.id]?.from ?? order.from} onChange={(e) => handleOrderChange(order.id, 'from', e.target.value)} className="h-8" /> : order.from}</TableCell>
                                    <TableCell>{isEditing ? <Input value={editedOrders[order.id]?.delivery_type ?? order.delivery_type} onChange={(e) => handleOrderChange(order.id, 'delivery_type', e.target.value)} className="h-8" /> : order.delivery_type}</TableCell>
                                    <TableCell>{isEditing ? <Input type="number" value={editedOrders[order.id]?.qty ?? order.qty} onChange={(e) => handleOrderChange(order.id, 'qty', parseInt(e.target.value) || 0)} className="h-8" /> : order.qty}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                               <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                        <PackageMinus className="h-12 w-12 mx-auto mb-2" />
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </MainLayout>
    );
}

