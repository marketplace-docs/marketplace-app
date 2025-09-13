
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import type { PutawayDocument } from "@/types/putaway-document";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

type UpdateFields = {
    location: string;
    exp_date: string;
    qty: string;
};

export default function UpdateExpiredPage() {
    const [barcode, setBarcode] = useState('');
    const [originalDoc, setOriginalDoc] = useState<PutawayDocument | null>(null);
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
                setOriginalDoc(null);
                 setUpdateFields({ location: '', exp_date: '', qty: '' });
                return;
            }
            setIsLoading(true);
            try {
                const response = await fetch(`/api/putaway-documents/by-barcode/${barcode}`);
                if (response.status === 404) {
                    toast({ variant: "destructive", title: "Not Found", description: "Product with this barcode not found in putaway documents." });
                    setOriginalDoc(null);
                    setUpdateFields({ location: '', exp_date: '', qty: '' });
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch product data.');
                }
                const data: PutawayDocument = await response.json();
                setOriginalDoc(data);
                setUpdateFields({
                    location: data.location || '',
                    exp_date: data.exp_date ? format(new Date(data.exp_date), 'yyyy-MM-dd') : '',
                    qty: data.qty.toString(), // The quantity to be moved/updated
                });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
                setOriginalDoc(null);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchProductData();
        }, 500);

        return () => clearTimeout(timer);
    }, [barcode, toast]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdateFields(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalDoc || !user) {
            toast({ variant: "destructive", title: "Error", description: "No product selected or you are not logged in." });
            return;
        }

        const qtyToUpdate = parseInt(updateFields.qty, 10);
        if (isNaN(qtyToUpdate) || qtyToUpdate <= 0) {
            toast({ variant: "destructive", title: "Error", description: "Please enter a valid quantity to update." });
            return;
        }

        if (qtyToUpdate > originalDoc.qty) {
            toast({ variant: "destructive", title: "Error", description: `Quantity to update cannot exceed the original stock of ${originalDoc.qty}.` });
            return;
        }


        setIsSubmitting(true);
        try {
            const payload = {
                // Original document info for reference
                originalDoc: {
                    ...originalDoc
                },
                // New values for the split-off batch
                update: {
                    location: updateFields.location,
                    exp_date: updateFields.exp_date,
                    qty: qtyToUpdate,
                },
                userName: user.name,
                userEmail: user.email,
            };

            const response = await fetch(`/api/putaway-documents/${originalDoc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update product information.');
            }
            
            toast({ title: "Success", description: "Product information has been updated." });
            setBarcode(''); // Reset after successful update
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
                        <CardDescription>Scan barcode to find a product. You can split a batch by updating the quantity, location, or expiration date. This will create a new entry for the specified quantity and reduce the original stock.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <div className="relative">
                                        <Input id="barcode" placeholder="Scan or enter product barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                                        {isLoading && <Loader2 className="absolute right-2 top-2 h-5 w-5 animate-spin text-muted-foreground" />}
                                    </div>
                                </div>
                                {originalDoc && (
                                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md md:col-span-2">
                                        <p><strong>Original Stock:</strong> {originalDoc.qty.toLocaleString()} pcs</p>
                                        <p><strong>Location:</strong> {originalDoc.location}</p>
                                        <p><strong>Exp Date:</strong> {format(new Date(originalDoc.exp_date), 'dd/MM/yyyy')}</p>
                                    </div>
                                )}
                             </div>

                             <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">New Location</Label>
                                    <Input id="location" name="location" placeholder="Enter new location" value={updateFields.location} onChange={handleFieldChange} disabled={!originalDoc || isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="exp_date">New Exp Date</Label>
                                    <Input id="exp_date" name="exp_date" type="date" placeholder="Enter new expiration date" value={updateFields.exp_date} onChange={handleFieldChange} disabled={!originalDoc || isSubmitting} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="qty">Quantity to Update</Label>
                                    <Input id="qty" name="qty" type="number" placeholder="Quantity to move" value={updateFields.qty} onChange={handleFieldChange} disabled={!originalDoc || isSubmitting} />
                                </div>
                             </div>
                            <div className="pt-2 flex justify-end">
                                <Button type="submit" disabled={!originalDoc || isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Information
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
