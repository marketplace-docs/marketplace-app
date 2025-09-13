
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BatchProduct = {
    id: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
};

type UpdateFields = {
    location: string;
    exp_date: string;
    qty: string;
};

export default function UpdateExpiredPage() {
    const [barcode, setBarcode] = useState('');
    const [originalBatches, setOriginalBatches] = useState<BatchProduct[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<BatchProduct | null>(null);
    const [updateFields, setUpdateFields] = useState<UpdateFields>({
        location: '',
        exp_date: '',
        qty: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    
    useEffect(() => {
        const fetchProductData = async () => {
            if (!barcode) {
                setOriginalBatches([]);
                setSelectedBatch(null);
                return;
            }
            setIsLoading(true);
            setSelectedBatch(null);
            setOriginalBatches([]);

            try {
                const response = await fetch(`/api/master-product/batch-products/${barcode}`);
                if (response.status === 404) {
                    toast({ variant: "destructive", title: "Not Found", description: "Product with this barcode not found in any batch." });
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch product batches.');
                }
                const data: BatchProduct[] = await response.json();
                setOriginalBatches(data);
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
                setOriginalBatches([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchProductData();
        }, 500);

        return () => clearTimeout(timer);
    }, [barcode, toast]);

    const handleSelectBatch = (batch: BatchProduct) => {
        setSelectedBatch(batch);
        setUpdateFields({
            location: batch.location || '',
            exp_date: batch.exp_date ? format(new Date(batch.exp_date), 'yyyy-MM-dd') : '',
            qty: batch.stock.toString(), // Default to full quantity
        });
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdateFields(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch || !user) {
            toast({ variant: "destructive", title: "Error", description: "No product batch selected or you are not logged in." });
            return;
        }

        const qtyToUpdate = parseInt(updateFields.qty, 10);
        if (isNaN(qtyToUpdate) || qtyToUpdate <= 0) {
            toast({ variant: "destructive", title: "Error", description: "Please enter a valid quantity to update." });
            return;
        }

        if (qtyToUpdate > selectedBatch.stock) {
            toast({ variant: "destructive", title: "Error", description: `Quantity to update cannot exceed the selected batch stock of ${selectedBatch.stock}.` });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                originalDoc: {
                    id: selectedBatch.id, // We need to pass the original putaway doc ID
                    qty: selectedBatch.stock,
                    location: selectedBatch.location,
                    exp_date: selectedBatch.exp_date,
                    barcode: selectedBatch.barcode,
                    sku: selectedBatch.sku,
                    brand: selectedBatch.brand,
                },
                update: {
                    location: updateFields.location,
                    exp_date: updateFields.exp_date,
                    qty: qtyToUpdate,
                },
                userName: user.name,
                userEmail: user.email,
            };

            const response = await fetch(`/api/putaway-documents/${selectedBatch.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update product information.');
            }
            
            toast({ title: "Success", description: "Product information has been updated." });
            setBarcode(''); 
            setOriginalBatches([]);
            setSelectedBatch(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Update Expired & Location</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Update Product Information</CardTitle>
                        <CardDescription>Scan barcode to find all batches of a product. Select a batch to update its location, expiration date, or split it.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode</Label>
                                <div className="relative">
                                    <Input id="barcode" placeholder="Scan or enter product barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                                    {isLoading && <Loader2 className="absolute right-2 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />}
                                </div>
                            </div>

                             {originalBatches.length > 0 && (
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Available Batches</CardTitle>
                                        <CardDescription>Select the batch you want to modify.</CardDescription>
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
                                                {originalBatches.map((batch) => (
                                                    <TableRow key={`${batch.location}-${batch.exp_date}`} className={selectedBatch?.id === batch.id ? "bg-accent" : ""}>
                                                        <TableCell>{batch.location}</TableCell>
                                                        <TableCell>{format(new Date(batch.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                        <TableCell>{batch.stock.toLocaleString()}</TableCell>
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

                            {selectedBatch && (
                                <div className="border-t pt-6 space-y-4">
                                     <h3 className="text-md font-semibold text-foreground">Update Details for Batch at <span className="text-primary">{selectedBatch.location}</span></h3>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="location">New Location</Label>
                                            <Input id="location" name="location" placeholder="Enter new location" value={updateFields.location} onChange={handleFieldChange} disabled={isSubmitting} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exp_date">New Exp Date</Label>
                                            <Input id="exp_date" name="exp_date" type="date" placeholder="Enter new expiration date" value={updateFields.exp_date} onChange={handleFieldChange} disabled={isSubmitting} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="qty">Quantity to Move/Update</Label>
                                            <Input id="qty" name="qty" type="number" placeholder="Quantity" value={updateFields.qty} onChange={handleFieldChange} disabled={isSubmitting} />
                                        </div>
                                     </div>
                                    <div className="pt-2 flex justify-end">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Update Information
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
