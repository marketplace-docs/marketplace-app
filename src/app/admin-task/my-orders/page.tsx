
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, AlertCircle, PackageMinus, Search, SlidersHorizontal, Calendar as CalendarIcon, Upload, Play } from 'lucide-react';
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


type Order = {
  id: string;
  reference: string;
  status: 'Payment Accepted' | 'Ready To Be Shipped';
  order_date: string;
  customer: string;
  city: string;
  type: string;
  from: string;
  delivery_type: string;
  qty: number;
};

type BookedLocation = {
  sku: string;
  location: string;
  qty: number;
} | null;

export default function MyOrdersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [bookedLocation, setBookedLocation] = useState<BookedLocation>(null);
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    
    const selectedCount = Object.values(selection).filter(Boolean).length;
    
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/manual-orders');
            if (!response.ok) throw new Error("Failed to fetch manual orders.");
            const data = await response.json();
            // Assuming the API returns the correct shape, but you might need to map it
            // For now, let's add a mock status to them
             const ordersWithStatus = data.map((order: any) => ({
                ...order,
                status: 'Payment Accepted' as const // Add default status
            }));
            setOrders(ordersWithStatus);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);


    const handleViewBooking = async (order: Order) => {
        setSelectedOrder(order);
        setIsBookingLoading(true);
        setBookedLocation(null);

        try {
            // This logic is a placeholder. In a real scenario, you'd query based on the order's SKU.
            const response = await fetch('/api/master-product/batch-products');
            if (!response.ok) throw new Error("Failed to fetch stock data.");
            
            const allProducts: any[] = await response.json();
            const availableBatches = allProducts
                .filter(p => p.stock > 0)
                .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());
            
            if (availableBatches.length > 0) {
                const bestBatch = availableBatches[0];
                setBookedLocation({
                    sku: bestBatch.sku,
                    location: bestBatch.location,
                    qty: order.qty
                });
            } else {
                 setBookedLocation(null); // No stock found
            }

        } catch (err: any) {
            console.error(err);
            setBookedLocation(null);
        } finally {
            setIsBookingLoading(false);
        }
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
                                <Input placeholder="Reference" />
                                <Input placeholder="City" />
                                <Input placeholder="Customer" />
                                <Select><SelectTrigger><SelectValue placeholder="Order Type" /></SelectTrigger><SelectContent><SelectItem value="on-sale">On Sale</SelectItem><SelectItem value="normal">Normal</SelectItem></SelectContent></Select>
                                <Select><SelectTrigger><SelectValue placeholder="From" /></SelectTrigger><SelectContent><SelectItem value="ios">iOS</SelectItem><SelectItem value="android">Android</SelectItem></SelectContent></Select>
                                <Input placeholder="SKU" />
                                <Select><SelectTrigger><SelectValue placeholder="Qty" /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent></Select>
                                <Select><SelectTrigger><SelectValue placeholder="Delivery ype" /></SelectTrigger><SelectContent><SelectItem value="regular">Regular</SelectItem><SelectItem value="express">Express</SelectItem></SelectContent></Select>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : format(dateRange.from, "LLL dd, y")) : (<span>Order Date From Date</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date-to" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange?.to && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.to ? format(dateRange.to, "LLL dd, y") : <span>Order Date To Date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="single" selected={dateRange?.to} onSelect={(day) => setDateRange(prev => ({...prev, to: day}))} /></PopoverContent>
                                </Popover>
                                <div className="flex items-center space-x-2"><Switch id="reserved" /><Label htmlFor="reserved">Reserved</Label></div>
                                <div className="flex items-center space-x-2"><Switch id="ecobox" /><Label htmlFor="ecobox">Ecobox</Label></div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center space-x-2"><Switch id="always-open" defaultChecked /><Label htmlFor="always-open">Always open</Label></div>
                                <div className="flex gap-2">
                                    <Button variant="outline">RESET</Button>
                                    <Button><Search className="mr-2 h-4 w-4" /> SEARCH</Button>
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
                                        checked={selectedCount === orders.length && orders.length > 0}
                                        onCheckedChange={(checked) => {
                                            const newSelection: Record<string, boolean> = {};
                                            if (checked) {
                                                orders.forEach(o => newSelection[o.id] = true);
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
                            ) : orders.length > 0 ? (
                                orders.map(order => (
                                <TableRow key={order.id} data-state={selection[order.id] && "selected"}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selection[order.id] || false}
                                            onCheckedChange={(checked) => setSelection(prev => ({...prev, [order.id]: !!checked}))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="link" className="p-0 h-auto font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => handleViewBooking(order)}>
                                            {order.reference}
                                        </Button>
                                    </TableCell>
                                    <TableCell><Badge className={cn(order.status === 'Payment Accepted' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600', "text-white")}>{order.status}</Badge></TableCell>
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

            <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Booking Location for Order: {selectedOrder?.reference}</DialogTitle>
                        <DialogDescription>
                            The system has automatically selected the best location based on FEFO (First-Expired, First-Out).
                        </DialogDescription>
                    </DialogHeader>
                    {isBookingLoading ? (
                        <div className="h-24 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : bookedLocation ? (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold text-lg text-primary">{bookedLocation.location}</h3>
                                <p className="text-sm text-muted-foreground">Please pick from this location.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                                    <p className="font-semibold">{bookedLocation.sku}</p>
                                </div>
                                 <div>
                                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                                    <p className="font-semibold">{bookedLocation.qty}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center text-destructive">
                           <p>No available stock found for this order.</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </MainLayout>
    );
}
