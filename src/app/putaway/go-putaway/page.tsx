
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type BatchProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

type MoveFields = {
    destinationLocation: string;
    quantity: string;
};

export default function GoPutawayPage() {
    const [barcode, setBarcode] = useState('');
    const [availableBatches, setAvailableBatches] = useState<BatchProduct[]>([]);
    const [sourceBatch, setSourceBatch] = useState<BatchProduct | null>(null);
    const [moveFields, setMoveFields] = useState<MoveFields>({
        destinationLocation: '',
        quantity: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const fetchProductData = useCallback(async (searchBarcode: string) => {
        if (!searchBarcode) {
            setAvailableBatches([]);
            setSourceBatch(null);
            return;
        }
        setIsLoading(true);
        setSourceBatch(null);
        setAvailableBatches([]);

        try {
            const response = await fetch(`/api/master-product/batch-products/${searchBarcode}`);
            if (response.status === 404) {
                toast({ variant: "destructive", title: "Not Found", description: "Product with this barcode not found in any batch." });
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch product batches.');
            }
            const data: BatchProduct[] = await response.json();
            setAvailableBatches(data.filter(b => b.stock > 0)); // Only show batches with stock
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
            setAvailableBatches([]);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if(barcode) {
                fetchProductData(barcode);
            } else {
                 setAvailableBatches([]);
                 setSourceBatch(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [barcode, fetchProductData]);
    
    const resetMoveForm = () => {
        setMoveFields({ destinationLocation: '', quantity: '' });
        setSourceBatch(null);
    };

    const handleSelectBatch = (batch: BatchProduct) => {
        setSourceBatch(batch);
        setMoveFields({
            destinationLocation: '',
            quantity: batch.stock.toString(),
        });
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMoveFields(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceBatch || !user) {
            toast({ variant: "destructive", title: "Error", description: "No source batch selected or you are not logged in." });
            return;
        }

        const quantityToMove = parseInt(moveFields.quantity, 10);
        if (isNaN(quantityToMove) || quantityToMove <= 0) {
            toast({ variant: "destructive", title: "Error", description: "Please enter a valid quantity to move." });
            return;
        }
        
        if (!moveFields.destinationLocation) {
            toast({ variant: "destructive", title: "Error", description: "Destination location cannot be empty." });
            return;
        }

        if (quantityToMove > sourceBatch.stock) {
            toast({ variant: "destructive", title: "Error", description: `Quantity to move cannot exceed the source batch stock of ${sourceBatch.stock}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            const moveDate = new Date().toISOString();
            
            // Document for taking stock OUT of source location
            const issueDoc = {
                sku: sourceBatch.sku,
                barcode: sourceBatch.barcode,
                expdate: sourceBatch.exp_date,
                location: sourceBatch.location,
                qty: quantityToMove,
                status: 'Issue - Putaway' as const,
                date: moveDate,
                validatedby: user.name,
            };

            // Document for putting stock IN to destination location
            const receiptDoc = {
                sku: sourceBatch.sku,
                barcode: sourceBatch.barcode,
                expdate: sourceBatch.exp_date,
                location: moveFields.destinationLocation,
                qty: quantityToMove,
                status: 'Receipt - Putaway' as const,
                date: moveDate,
                validatedby: user.name,
            };

            const response = await fetch('/api/product-out-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: [issueDoc, receiptDoc], user }),
            });


            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process stock movement.');
            }
            
            toast({ title: "Success", description: `${quantityToMove.toLocaleString()} items have been moved to ${moveFields.destinationLocation}.` });
            
            // Reset state
            setBarcode(''); 
            setAvailableBatches([]);
            resetMoveForm();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Move Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Go-Putaway</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Move Stock Between Locations</CardTitle>
                        <CardDescription>Use this feature to accurately track the movement of goods from one location to another within the warehouse.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-2 mb-6">
                            <Label htmlFor="barcode">Barcode</Label>
                            <div className="relative">
                                <Input id="barcode" placeholder="Scan or enter product barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} disabled={isSubmitting}/>
                                {isLoading && <Loader2 className="absolute right-2 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />}
                            </div>
                        </div>

                         {availableBatches.length > 0 && !sourceBatch && (
                            <Card className="bg-muted/50 mb-6">
                                <CardHeader>
                                    <CardTitle className="text-lg">Select Source Batch</CardTitle>
                                    <CardDescription>Choose the batch you want to move stock from.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Exp Date</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {availableBatches.map((batch) => (
                                                <TableRow key={batch.id}>
                                                    <TableCell>{batch.location}</TableCell>
                                                    <TableCell>{format(new Date(batch.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell><Badge>{batch.stock.toLocaleString()}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button type="button" size="sm" onClick={() => handleSelectBatch(batch)}>Select</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                         )}

                        {sourceBatch && (
                            <form onSubmit={handleSubmit}>
                                <div className="border-t pt-6 space-y-4">
                                     <h3 className="text-md font-semibold text-foreground">Move Details</h3>
                                     
                                     <div className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-background">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">From Location</p>
                                            <p className="font-semibold text-lg">{sourceBatch.location}</p>
                                            <p className="text-xs text-muted-foreground">Stock: {sourceBatch.stock.toLocaleString()} | Exp: {format(new Date(sourceBatch.exp_date), 'dd/MM/yyyy')}</p>
                                        </div>
                                         <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                                         <div className="flex-1">
                                            <Label htmlFor="destinationLocation">To Location</Label>
                                            <Input id="destinationLocation" name="destinationLocation" placeholder="Scan or enter location" value={moveFields.destinationLocation} onChange={handleFieldChange} disabled={isSubmitting} />
                                        </div>
                                         <div className="flex-1">
                                            <Label htmlFor="quantity">Quantity to Move</Label>
                                            <Input id="quantity" name="quantity" type="number" placeholder="Quantity" value={moveFields.quantity} onChange={handleFieldChange} disabled={isSubmitting} />
                                        </div>
                                     </div>

                                    <div className="pt-2 flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={resetMoveForm} disabled={isSubmitting}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting || !moveFields.destinationLocation || !moveFields.quantity}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm Movement
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
