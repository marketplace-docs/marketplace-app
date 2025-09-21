
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, Search, SlidersHorizontal, Upload, CalendarIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { BatchProduct } from '@/types/batch-product';
import type { User } from '@/types/user';

type QtyFilter = 'all' | '<50' | '>500' | '>0';

export default function CreateCycleCountPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [allProducts, setAllProducts] = useState<BatchProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<BatchProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [filters, setFilters] = useState({
        sku: '',
        barcode: '',
        brand: '',
        expFrom: '',
        expTo: '',
        qty: 'all' as QtyFilter,
    });
    
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    const [personInCharge, setPersonInCharge] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [dueTime, setDueTime] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor'].includes(user.role);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productsRes, usersRes] = await Promise.all([
                    fetch('/api/master-product/batch-products'),
                    fetch('/api/users')
                ]);
                if (!productsRes.ok) throw new Error('Failed to fetch product data.');
                if (!usersRes.ok) throw new Error('Failed to fetch users.');

                const productsData = await productsRes.json();
                const usersData = await usersRes.json();

                setAllProducts(productsData);
                setFilteredProducts(productsData); // Initially show all
                setAllUsers(usersData);
                
                // Set default due time to current time on client side
                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                setDueTime(`${hours}:${minutes}`);

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleLoadFilters = () => {
        let results = allProducts;
        if (filters.sku) {
            results = results.filter(p => p.sku.toLowerCase().includes(filters.sku.toLowerCase()));
        }
        if (filters.barcode) {
            results = results.filter(p => p.barcode.toLowerCase().includes(filters.barcode.toLowerCase()));
        }
        if (filters.brand) {
            results = results.filter(p => p.brand.toLowerCase().includes(filters.brand.toLowerCase()));
        }
        // TODO: Add date and qty filters logic
        setFilteredProducts(results);
        setSelection({});
    };

    const handleResetFilters = () => {
        setFilters({ sku: '', barcode: '', brand: '', expFrom: '', expTo: '', qty: 'all' });
        setFilteredProducts(allProducts);
    };
    
    const handleSelectAll = (checked: boolean) => {
        const newSelection: Record<string, boolean> = {};
        if (checked) {
            filteredProducts.forEach(p => newSelection[p.id] = true);
        }
        setSelection(newSelection);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelection(prev => ({ ...prev, [id]: checked }));
    };

    const selectedSkusToCount = useMemo(() => {
        return Object.keys(selection).filter(id => selection[id]).map(id => {
            return allProducts.find(p => p.id === id)?.sku;
        }).filter((sku): sku is string => !!sku);
    }, [selection, allProducts]);


    const handleCreateTask = async () => {
        if (selectedSkusToCount.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one SKU to count.' });
            return;
        }
        if (!personInCharge) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a Person In Charge.' });
            return;
        }
        if (!user) return;

        setIsSubmitting(true);
        try {
            const docNumResponse = await fetch('/api/cycle-count-docs/generate-number');
            if (!docNumResponse.ok) throw new Error('Could not generate document number.');
            const { newDocNumber } = await docNumResponse.json();

            const newDocPayload = {
                no_doc: newDocNumber,
                counter_name: personInCharge,
                count_type: 'By SKU',
                items_to_count: [...new Set(selectedSkusToCount)].join(', '),
                status: 'Pending',
                notes: `Due on ${dueDate ? format(dueDate, 'yyyy-MM-dd') : 'N/A'} at ${dueTime || 'N/A'}`
            };

            const response = await fetch('/api/cycle-count-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document: newDocPayload, user }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create cycle count task.');
            }
            
            toast({ title: 'Success', description: `Cycle Count task ${newDocNumber} has been created.` });
            router.push('/cycle-count/monitoring');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <MainLayout>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 w-full space-y-6">
                    <h1 className="text-2xl font-bold">Create Cycle Count SKU</h1>
                    <Accordion type="single" collapsible defaultValue='item-1' className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className='flex items-center gap-2'>
                                    <SlidersHorizontal className="h-5 w-5" />
                                    <span className="font-semibold">Filter</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-muted/50 rounded-b-md">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <Input name="sku" placeholder="SKU" value={filters.sku} onChange={handleFilterChange} />
                                    <Input name="barcode" placeholder="Ean No (Barcode)" value={filters.barcode} onChange={handleFilterChange} />
                                    <Input name="brand" placeholder="Brand" value={filters.brand} onChange={handleFilterChange} />
                                    <Input name="expFrom" type="date" placeholder="Expired From Date" value={filters.expFrom} onChange={handleFilterChange} />
                                    <Input name="expTo" type="date" placeholder="Expired To Date" value={filters.expTo} onChange={handleFilterChange} />
                                    <Select name="qty" value={filters.qty} onValueChange={(v: QtyFilter) => setFilters(p => ({...p, qty: v}))}>
                                        <SelectTrigger><SelectValue placeholder="Qty" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Quantities</SelectItem>
                                            <SelectItem value="<50">&lt; 50</SelectItem>
                                            <SelectItem value=">500">&gt; 500</SelectItem>
                                            <SelectItem value=">0">&gt; 0</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='flex items-center justify-between mt-4'>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="always-open" />
                                        <Label htmlFor="always-open">Always open</Label>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
                                        <Button onClick={handleLoadFilters}>
                                            <Search className="mr-2 h-4 w-4" /> Load
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Card>
                        <CardHeader>
                            <CardTitle>Product List</CardTitle>
                            <CardDescription>Select products to be included in the cycle count task.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"><Checkbox onCheckedChange={(checked) => handleSelectAll(Boolean(checked))} /></TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Box</TableHead>
                                            <TableHead>Expired</TableHead>
                                            <TableHead>Qty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></TableCell></TableRow>
                                        ) : filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell><Checkbox checked={selection[p.id] || false} onCheckedChange={(checked) => handleSelectRow(p.id, Boolean(checked))} /></TableCell>
                                                    <TableCell>
                                                        <div className='font-medium'>{p.sku}</div>
                                                        <div className='text-sm text-muted-foreground'>({p.barcode}) - {p.brand}</div>
                                                    </TableCell>
                                                    <TableCell>{p.location}</TableCell>
                                                    <TableCell>{format(new Date(p.exp_date), 'yyyy-MM-dd')}</TableCell>
                                                    <TableCell>{p.stock}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No products found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="w-full lg:w-80 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Person In Charge</Label>
                                <Select value={personInCharge} onValueChange={setPersonInCharge}>
                                    <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                                    <SelectContent>
                                        {allUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                            </div>
                            <Button className="w-full" disabled={!canCreate || isSubmitting} onClick={handleCreateTask}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Create Task
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
