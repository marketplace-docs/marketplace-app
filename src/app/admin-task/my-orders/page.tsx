
'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, AlertCircle, PackageMinus, Search, SlidersHorizontal, Calendar as CalendarIcon, HeartPulse, Play } from 'lucide-react';
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


type Order = {
  id: string;
  reference: string;
  status: 'Payment Accepted' | 'Ready To Be Shipped';
  orderDate: string;
  customer: string;
  city: string;
  type: string;
  from: string;
  deliveryType: string;
  qty: number;
};

const mockOrders: Order[] = [
    { id: '1', reference: 'IVMPTNEIQ', status: 'Payment Accepted', orderDate: '2025-09-22 11:08:01', customer: 'Aydelin Sgi', city: 'Brebes', type: 'On Sale', from: 'ios', deliveryType: 'regular', qty: 1 },
    { id: '2', reference: 'IVMPTNEIR', status: 'Ready To Be Shipped', orderDate: '2025-09-22 10:30:00', customer: 'John Doe', city: 'Jakarta', type: 'Normal', from: 'android', deliveryType: 'express', qty: 2 },
];


export default function MyOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selection, setSelection] = useState<Record<string, boolean>>({});

    const selectedCount = Object.values(selection).filter(Boolean).length;

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
                                <Button variant="link" className="text-violet-600"><HeartPulse className="mr-2"/>TRANSFER ORDER</Button>
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
                                    <TableCell className="font-medium text-blue-600 hover:underline cursor-pointer">{order.reference}</TableCell>
                                    <TableCell><Badge className={cn(order.status === 'Payment Accepted' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600', "text-white")}>{order.status}</Badge></TableCell>
                                    <TableCell>{order.orderDate}</TableCell>
                                    <TableCell>{order.customer}</TableCell>
                                    <TableCell>{order.city}</TableCell>
                                    <TableCell>{order.type}</TableCell>
                                    <TableCell>{order.from}</TableCell>
                                    <TableCell>{order.deliveryType}</TableCell>
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

