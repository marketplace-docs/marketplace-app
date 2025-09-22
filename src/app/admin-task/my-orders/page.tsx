
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format, isWithinInterval } from 'date-fns';
import { Loader2, AlertCircle, PackageMinus, Search, SlidersHorizontal, Calendar as CalendarIcon, Upload, Play, Plus } from 'lucide-react';
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


type Order = {
  id: string;
  reference: string;
  sku: string;
  status: 'Payment Accepted' | 'Out of Stock';
  order_date: string;
  customer: string;
  city: string;
  type: string;
  from: string;
  delivery_type: string;
  qty: number;
  total_stock_on_hand: number;
};

type NewOrder = Omit<Order, 'id' | 'status' | 'order_date' | 'total_stock_on_hand'> & { order_date: Date };

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
    const { toast } = useToast();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
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

            const ordersData = await ordersRes.json();
            const stockData: BatchProduct[] = await stockRes.json();

            // Aggregate stock by SKU
            const stockBySku = stockData.reduce((acc, product) => {
                acc.set(product.sku, (acc.get(product.sku) || 0) + product.stock);
                return acc;
            }, new Map<string, number>());

            const ordersWithStatus: Order[] = ordersData.map((order: any) => {
                const totalStock = stockBySku.get(order.sku) || 0;
                return {
                    ...order,
                    status: order.qty > totalStock ? 'Out of Stock' : 'Payment Accepted',
                    total_stock_on_hand: totalStock,
                };
            });

            setAllOrders(ordersWithStatus);
            setFilteredOrders(ordersWithStatus);

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

            await fetchOrders();
            setUploadDialogOpen(false);

            toast({
                title: 'Upload Successful',
                description: `${result.successCount} orders have been uploaded.`,
            });
            
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
        const payload = [{
          ...newOrder,
          order_date: new Date().toISOString()
        }]
        const response = await fetch('/api/manual-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ordersToInsert: payload,
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


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Create Wave eCommerce</h1>
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
                                        <SelectItem value="ios">iOS</SelectItem>
                                        <SelectItem value="android">Android</SelectItem>
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
                                    <Button variant="link" className="text-blue-600 font-bold"><Play className="mr-2"/>START WAVE</Button>
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
                                                filteredOrders.forEach(o => newSelection[o.id] = true);
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
                                <TableRow key={order.id} data-state={selection[order.id] && "selected"}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selection[order.id] || false}
                                            onCheckedChange={(checked) => setSelection(prev => ({...prev, [order.id]: !!checked}))}
                                        />
                                    </TableCell>
                                    <TableCell>
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
                                                                <TableHead>BY</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell>{order.sku}</TableCell>
                                                                <TableCell>{order.qty}</TableCell>
                                                                <TableCell>{order.total_stock_on_hand}</TableCell>
                                                                <TableCell>{user?.name}</TableCell>
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
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            order.status === 'Payment Accepted' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600',
                                            "text-white"
                                        )}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(order.order_date), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                                    <TableCell>{order.customer}</TableCell>
                                    <TableCell>{order.city}</TableCell>
                                    <TableCell>{order.type}</TableCell>
                                    <TableCell>{order.from}</TableCell>
                                    <TableCell>{order.delivery_type}</TableCell>
                                    <TableCell>{order.qty}</TableCell>
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
