
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, X, Printer, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import type { CycleCountDoc } from '@/types/cycle-count-doc';
import type { BatchProduct } from '@/types/batch-product';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CountedItem = BatchProduct & {
    counted_stock: number | null;
    discrepancy: number | null;
    notes?: string;
    reason?: string;
    qty_adjust?: number | null;
};

export default function CycleCountDetailPage({ params }: { params: { docId: string } }) {
    const { docId } = params;
    const router = useRouter();
    const [doc, setDoc] = useState<CycleCountDoc | null>(null);
    const [items, setItems] = useState<CountedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchDocDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const docRes = await fetch('/api/cycle-count-docs');
            if (!docRes.ok) throw new Error('Failed to fetch cycle count documents.');
            const allDocs: CycleCountDoc[] = await docRes.json();
            const currentDoc = allDocs.find(d => d.id.toString() === docId);

            if (!currentDoc) {
                throw new Error('Document not found.');
            }
            setDoc(currentDoc);

            const itemsToCount = currentDoc.items_to_count.split(',').map(item => item.trim().toLowerCase());
            
            const productsRes = await fetch('/api/master-product/batch-products');
            if (!productsRes.ok) throw new Error('Failed to fetch products.');
            const allProducts: BatchProduct[] = await productsRes.json();

            let productsInScope: BatchProduct[] = [];
            if (currentDoc.count_type === 'By Location') {
                productsInScope = allProducts.filter(p => itemsToCount.includes(p.location.toLowerCase()));
            } else { 
                productsInScope = allProducts.filter(p => itemsToCount.includes(p.sku.toLowerCase()));
            }

            // For completed/cancelled docs, we need to load saved data. This logic is simplified for now.
            // In a real app, you would fetch the *actual counted items* associated with this docId.
            const initialItems = productsInScope.map(p => ({
                ...p,
                counted_stock: currentDoc.status === 'Completed' || currentDoc.status === 'Cancelled' ? p.stock : null, // Simulate counted data for display
                discrepancy: 0,
                notes: currentDoc.notes || '',
                reason: '',
                qty_adjust: 0
            }));

            setItems(initialItems);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [docId]);

    useEffect(() => {
        fetchDocDetails();
    }, [fetchDocDetails]);

    const handleCountChange = (productId: string, value: string) => {
        const newCount = value === '' ? null : parseInt(value, 10);
        
        setItems(prev => prev.map(p => {
            if (p.id === productId) {
                const discrepancy = newCount !== null && !isNaN(newCount) ? newCount - p.stock : null;
                return { ...p, counted_stock: newCount, discrepancy, qty_adjust: discrepancy };
            }
            return p;
        }));
    };
    
    const handleFieldChange = (productId: string, field: keyof CountedItem, value: string | number) => {
        setItems(prev => prev.map(p => {
            if (p.id === productId) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prev => prev.filter(p => p.id !== productId));
    };

    const updateDocStatus = async (status: 'Completed' | 'Cancelled') => {
        if (!user || !doc) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/cycle-count-docs/${doc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, user }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update status to ${status}.`);
            }
            toast({ title: "Status Updated", description: `Document status has been changed to ${status}.` });
            router.push('/cycle-count/monitoring');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Status Update Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleConfirmValid = async () => {
        if (!user || !doc) return;
        
        const adjustments = items.filter(item => item.discrepancy !== 0 && item.discrepancy !== null);
        
        setIsSubmitting(true);
        try {
            if (adjustments.length > 0) {
                 const response = await fetch('/api/cycle-count/submit-count', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adjustments: adjustments.map(a => ({...a, variance: a.discrepancy})), user }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to submit count adjustments.');
                }
                toast({ title: "Adjustments Submitted", description: "Stock adjustments have been successfully recorded." });
            } else {
                 toast({ title: 'No Adjustments Needed', description: 'All counts match system stock.' });
            }
            
            // After adjustments are (or are not) made, update status to Completed
            await updateDocStatus('Completed');
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInvalidate = async () => {
        await updateDocStatus('Cancelled');
    };


    if (loading) {
        return <MainLayout><div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></MainLayout>;
    }
    if (error) {
        return <MainLayout><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></MainLayout>;
    }
    if (!doc) {
        return <MainLayout><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Not Found</AlertTitle><AlertDescription>Document could not be found.</AlertDescription></Alert></MainLayout>;
    }


    const isFinished = doc.status === 'Completed' || doc.status === 'Cancelled';
    const allCountsEntered = items.length > 0 && items.every(p => p.counted_stock !== null);

    return (
        <MainLayout>
             <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl">Doc No. {doc.no_doc}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                             <span>Due date: {format(new Date(doc.date), 'yyyy-MM-dd - HH:mm')}</span>
                             <Badge variant={doc.status === 'Completed' ? 'default' : 'secondary'}>{doc.status}</Badge>
                        </div>
                    </div>
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/cycle-count/monitoring">
                            <X className="h-5 w-5" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Assign To</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Expired</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Real Qty</TableHead>
                                    <TableHead>Discrepancy</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Qty Adjust</TableHead>
                                    {!isFinished && <TableHead></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length > 0 ? items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{doc.counter_name}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.sku}</div>
                                            <div className="text-muted-foreground text-xs flex gap-2">
                                                <Badge variant="outline">{item.barcode}</Badge>
                                                <span>{item.location}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(item.exp_date), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell>{item.stock}</TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.counted_stock ?? ''} onChange={e => handleCountChange(item.id, e.target.value)} className="w-20" disabled={isFinished} />
                                        </TableCell>
                                        <TableCell className={`font-bold ${item.discrepancy === null ? '' : (item.discrepancy === 0 ? 'text-green-600' : 'text-red-600')}`}>
                                            {item.discrepancy}
                                        </TableCell>
                                         <TableCell><Input value={item.notes} onChange={e => handleFieldChange(item.id, 'notes', e.target.value)} className="w-24" disabled={isFinished} /></TableCell>
                                        <TableCell><Input value={item.reason} onChange={e => handleFieldChange(item.id, 'reason', e.target.value)} className="w-24" disabled={isFinished} /></TableCell>
                                        <TableCell><Input type="number" value={item.qty_adjust ?? ''} onChange={e => handleFieldChange(item.id, 'qty_adjust', e.target.value)} className="w-20" disabled={isFinished} /></TableCell>
                                        {!isFinished && (
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                    <X className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={isFinished ? 9 : 10} className="h-24 text-center text-muted-foreground">
                                            {isFinished ? 'No count data was recorded for this document.' : 'No items to count for this document.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {!isFinished && (
                    <CardFooter className="flex justify-between items-center border-t pt-6">
                        <Button variant="destructive" onClick={handleInvalidate} disabled={isSubmitting}>
                             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <X className="mr-2 h-4 w-4" /> INVALID
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" disabled>SAVE DRAFT</Button>
                            <Button onClick={handleConfirmValid} disabled={isSubmitting || !allCountsEntered}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                CONFIRM VALID
                            </Button>
                            <Button variant="outline" size="icon" disabled><Printer className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" disabled><FileText className="h-4 w-4" /></Button>
                            <Button variant="outline" disabled>ACC</Button>
                            <Button variant="outline" disabled>RAW DATA</Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </MainLayout>
    );
}

