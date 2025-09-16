'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

// Mock data structure - this will be replaced by API data
type ProductInLocation = {
    sku: string;
    barcode: string;
    exp_date: string;
    system_stock: number;
};

export default function CCLocationPage() {
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<ProductInLocation[]>([]);
    const [countedStock, setCountedStock] = useState<Record<string, number | null>>({});
    const { toast } = useToast();

    const handleSearchLocation = async () => {
        if (!location) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a location to search.' });
            return;
        }
        setIsLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real scenario, you would fetch this from an API like `/api/stock/by-location/${location}`
        const mockData: ProductInLocation[] = [
            { sku: 'SKU001', barcode: '899000000001', exp_date: '2025-12-31', system_stock: 120 },
            { sku: 'SKU002', barcode: '899000000002', exp_date: '2024-10-31', system_stock: 75 },
        ];
        
        setProducts(mockData);
        // Initialize counted stock state
        const initialCounts: Record<string, number | null> = {};
        mockData.forEach(p => {
             initialCounts[`${p.barcode}-${p.exp_date}`] = null;
        });
        setCountedStock(initialCounts);
        
        setIsLoading(false);
        toast({ title: 'Success', description: `Found ${mockData.length} items at location ${location}.` });
    };

    const handleCountChange = (key: string, value: string) => {
        const newCount = parseInt(value, 10);
        setCountedStock(prev => ({
            ...prev,
            [key]: isNaN(newCount) ? null : newCount
        }));
    };
    
    const handleSubmitCount = async () => {
        setIsSubmitting(true);
        console.log("Submitting data:", { location, counts: countedStock });
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({ title: "Submission Received", description: "Cycle count data has been submitted for review." });

        // Reset state
        setLocation('');
        setProducts([]);
        setCountedStock({});
        setIsSubmitting(false);
    }

    const allCountsEntered = products.length > 0 && products.every(p => {
        const key = `${p.barcode}-${p.exp_date}`;
        return countedStock[key] !== null && countedStock[key] !== undefined;
    });

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">CC Location</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Cycle Count by Location</CardTitle>
                        <CardDescription>Enter a location to find all products and perform a physical stock count.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-end gap-2">
                           <div className="flex-1 space-y-2">
                             <Label htmlFor="location">Location Name</Label>
                             <Input 
                                id="location" 
                                placeholder="Scan or enter location name" 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={isLoading || isSubmitting}
                             />
                           </div>
                            <Button onClick={handleSearchLocation} disabled={isLoading || isSubmitting || !location}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                Search
                            </Button>
                        </div>
                        
                        {products.length > 0 && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-medium text-lg">Products at Location: <span className="text-primary font-bold">{location}</span></h3>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Barcode</TableHead>
                                                <TableHead>EXP Date</TableHead>
                                                <TableHead className="text-center">System Stock</TableHead>
                                                <TableHead className="w-[150px]">Actual Stock</TableHead>
                                                <TableHead className="text-center">Variance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {products.map(product => {
                                                const key = `${product.barcode}-${product.exp_date}`;
                                                const actual = countedStock[key];
                                                const variance = actual === null || actual === undefined ? null : actual - product.system_stock;
                                                
                                                return (
                                                <TableRow key={key}>
                                                    <TableCell>{product.sku}</TableCell>
                                                    <TableCell>{product.barcode}</TableCell>
                                                    <TableCell>{format(new Date(product.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="text-center">{product.system_stock.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            type="number"
                                                            placeholder="Count..."
                                                            value={actual ?? ''}
                                                            onChange={(e) => handleCountChange(key, e.target.value)}
                                                            className="text-center"
                                                        />
                                                    </TableCell>
                                                     <TableCell className={`text-center font-bold ${variance === null ? '' : (variance === 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                        {variance === null ? '-' : variance.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            )})}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSubmitCount} disabled={!allCountsEntered || isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Submit Count
                                    </Button>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
