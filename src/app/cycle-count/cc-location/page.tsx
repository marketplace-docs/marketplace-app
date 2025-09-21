'use client';

import React, { useState, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { BatchProduct } from '@/types/batch-product';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type CountedProduct = BatchProduct & {
    counted_stock: number | null;
    variance: number | null;
};

export default function CCLocationPage() {
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<CountedProduct[]>([]);
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    const handleSearchLocation = async () => {
        if (!location) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a location to search.' });
            return;
        }
        setIsLoading(true);
        setProducts([]);
        
        try {
            const response = await fetch('/api/master-product/batch-products');
            if (!response.ok) {
                throw new Error('Failed to fetch batch products.');
            }
            const allProducts: BatchProduct[] = await response.json();
            
            const productsInLocation = allProducts
                .filter(p => p.location.toLowerCase() === location.toLowerCase() && p.stock > 0)
                .map(p => ({
                    ...p,
                    counted_stock: null,
                    variance: null,
                }));
            
            if (productsInLocation.length === 0) {
                 toast({ variant: 'destructive', title: 'Not Found', description: `No products with stock found at location ${location}.` });
            } else {
                 toast({ title: 'Success', description: `Found ${productsInLocation.length} items at location ${location}.` });
            }

            setProducts(productsInLocation);

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCountChange = (productId: string, value: string) => {
        const newCount = value === '' ? null : parseInt(value, 10);
        
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const variance = newCount !== null && !isNaN(newCount) ? newCount - p.stock : null;
                return { ...p, counted_stock: newCount, variance };
            }
            return p;
        }));
    };
    
    const handleSubmitCount = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        if (products.some(p => p.counted_stock === null)) {
            toast({ variant: 'destructive', title: 'Incomplete Count', description: 'Please enter a count for all items before submitting.' });
            return;
        }

        setIsSubmitting(true);
        
        try {
            // 1. Generate a new document number
            const docNumResponse = await fetch('/api/cycle-count-docs/generate-number');
            if (!docNumResponse.ok) throw new Error('Could not generate document number.');
            const { newDocNumber } = await docNumResponse.json();

            // 2. Prepare the cycle count document payload
            const newDocPayload = {
                no_doc: newDocNumber,
                counter_name: user.name,
                count_type: 'By Location',
                items_to_count: location, // The location that was counted
                status: 'In Progress', // Set initial status
                notes: `Manual count from CC Location page. Counted items: ${products.map(p => `${p.sku} (Qty: ${p.counted_stock})`).join(', ')}`,
                date: new Date().toISOString(),
            };

            // 3. Create the new cycle count document
            const createDocResponse = await fetch('/api/cycle-count-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document: newDocPayload, user }),
            });

            if (!createDocResponse.ok) {
                const errorData = await createDocResponse.json();
                throw new Error(errorData.error || 'Failed to create cycle count document.');
            }
            
            toast({ 
                title: "Submission Success", 
                description: `Count for location ${location} has been submitted for validation.` 
            });

            router.push('/cycle-count/monitoring');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    const allCountsEntered = products.length > 0 && products.every(p => p.counted_stock !== null);

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
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
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
                                <h3 className="font-medium text-lg">Products at Location: <span className="text-primary font-bold">{products[0]?.location}</span></h3>
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
                                                return (
                                                <TableRow key={product.id}>
                                                    <TableCell>{product.sku}</TableCell>
                                                    <TableCell>{product.barcode}</TableCell>
                                                    <TableCell>{format(new Date(product.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="text-center">{product.stock.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            type="number"
                                                            placeholder="Count..."
                                                            value={product.counted_stock ?? ''}
                                                            onChange={(e) => handleCountChange(product.id, e.target.value)}
                                                            className="text-center"
                                                            disabled={isSubmitting}
                                                        />
                                                    </TableCell>
                                                     <TableCell className={`text-center font-bold ${product.variance === null ? '' : (product.variance === 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                        {product.variance === null ? '-' : product.variance.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            )})}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSubmitCount} disabled={!allCountsEntered || isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Submit Count for Validation
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
