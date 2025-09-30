
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageCheck, Search, ScanLine, Printer, CheckCircle, Box } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ProductOutDocument } from '@/types/product-out-document';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ShippingLabel } from '@/components/shipping-label';
import type { Order } from '@/types/order';

type OrderToProcess = Order & {
    docIds: number[];
}

type PackingStep = 'scanOrder' | 'scanProduct' | 'scanBox' | 'completed';

export default function OutboundPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // State for the process
    const [step, setStep] = useState<PackingStep>('scanOrder');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data state
    const [orderRef, setOrderRef] = useState('');
    const [foundOrder, setFoundOrder] = useState<OrderToProcess | null>(null);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [scannedBox, setScannedBox] = useState('');
    
    // Success dialog
    const [isSuccessDialogOpen, setSuccessDialogOpen] = useState(false);

    // Input refs for focus management
    const orderInputRef = useRef<HTMLInputElement>(null);
    const productInputRef = useRef<HTMLInputElement>(null);
    const boxInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 'scanOrder') orderInputRef.current?.focus();
        if (step === 'scanProduct') productInputRef.current?.focus();
        if (step === 'scanBox') boxInputRef.current?.focus();
    }, [step]);


    const handleSearchOrder = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan an order reference.' });
            return;
        }
        
        setIsLoading(true);
        setFoundOrder(null);

        try {
            const [productOutRes, wavesRes] = await Promise.all([
                 fetch('/api/product-out-documents'),
                 fetch('/api/waves')
            ]);
           
            if (!productOutRes.ok) throw new Error('Could not fetch outbound documents.');
             if (!wavesRes.ok) throw new Error('Could not fetch wave data.');

            const allProductOutDocs: ProductOutDocument[] = await productOutRes.json();
            const allWaves = await wavesRes.json();
            
            const issueDocs = allProductOutDocs.filter(
                doc => doc.status === 'Issue - Order' && 
                       doc.packer_name === null &&
                       doc.order_reference === orderRef
            );
            
            if (issueDocs.length === 0) {
                toast({ variant: 'destructive', title: 'Not Found or Already Packed', description: `No pending packing task found for order ref: ${orderRef}.` });
                setIsLoading(false);
                return;
            }

            // Find the original order details from the waves
            let originalOrderData: any = null;
            for (const wave of allWaves) {
                 const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                 if (!waveDetailsRes.ok) continue;
                 const waveDetails = await waveDetailsRes.json();
                 const found = waveDetails.orders.find((o: any) => o.order_reference === orderRef);
                 if(found) {
                     originalOrderData = found;
                     break;
                 }
            }
             if (!originalOrderData) {
                throw new Error("Could not find original order details to print address.");
            }
            
            const aggregatedOrder: OrderToProcess = issueDocs.reduce((acc, doc) => {
                acc.docIds.push(doc.id);
                acc.qty += doc.qty;
                if (!acc.locations.includes(doc.location)) {
                    acc.locations.push(doc.location);
                }
                return acc;
            }, {
                docIds: [] as number[],
                reference: issueDocs[0].order_reference || orderRef,
                sku: issueDocs[0].sku,
                barcode: issueDocs[0].barcode,
                qty: 0,
                locations: [] as string[],
                // From original order data
                id: originalOrderData.order_id,
                customer: originalOrderData.customer,
                address: originalOrderData.address || 'N/A',
                phone: originalOrderData.phone || 'N/A',
                city: originalOrderData.city,
                order_date: originalOrderData.order_date,
                type: originalOrderData.type,
                from: originalOrderData.from,
                delivery_type: originalOrderData.delivery_type,
                status: 'Payment Accepted',
                total_stock_on_hand: 0,
                location: ''
            });

            setFoundOrder(aggregatedOrder);
            setStep('scanProduct');
            toast({ title: 'Order Found', description: 'Please scan the product barcode to verify.' });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleProductScan = () => {
        if (!foundOrder || !scannedBarcode) return;
        if (scannedBarcode === foundOrder.barcode) {
            setStep('scanBox');
            toast({ title: 'Product Verified', description: 'Now scan the box packaging barcode.' });
        } else {
            toast({ variant: 'destructive', title: 'Wrong Product', description: `Scanned barcode does not match the required product.` });
            setScannedBarcode('');
        }
    };

    const handleBoxScan = () => {
        if (!scannedBox) {
            toast({ variant: 'destructive', title: 'Error', description: 'Box barcode cannot be empty.' });
            return;
        }
        // In a real scenario, you might validate the box type. Here we just proceed.
        handleConfirmPacking();
    };


    const handleConfirmPacking = async () => {
        if (!foundOrder || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'No order data loaded or user not logged in.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const updatePromises = foundOrder.docIds.map(docId =>
                fetch(`/api/product-out-documents/${docId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        packer_name: user.name,
                        user, 
                     }),
                })
            );
            
            const results = await Promise.all(updatePromises);
            
            const failedUpdates = results.filter(res => !res.ok);
            if (failedUpdates.length > 0) {
                throw new Error(`Failed to confirm packing for ${failedUpdates.length} parts of the order.`);
            }

            setStep('completed');
            setSuccessDialogOpen(true);
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
             setIsSubmitting(false);
        }
    };
    
    const handlePrint = () => {
        const printableContent = document.getElementById('shipping-label-content');
        if (printableContent) {
            const printWindow = window.open('', '_blank', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Shipping Label</title>');
                printWindow.document.write('<style>@media print { @page { size: A6; margin: 0; } body { margin: 0; } } </style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printableContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            } else {
                toast({ variant: "destructive", title: "Print Failed", description: "Could not open print window. Please check your browser settings." });
            }
        }
        toast({ title: "Printing...", description: "Shipping label sent to printer." });
    };

    const resetProcess = () => {
        setOrderRef('');
        setFoundOrder(null);
        setScannedBarcode('');
        setScannedBox('');
        setIsSubmitting(false);
        setSuccessDialogOpen(false);
        setStep('scanOrder');
    };
    
    const maskedBarcode = foundOrder?.barcode ? `****${foundOrder.barcode.slice(-4)}` : '';

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Outbound Packing Station</h1>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <PackageCheck className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="text-center">Packing Validation</CardTitle>
                        <CardDescription className="text-center">
                            Follow the steps to validate and pack the order.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Scan Order */}
                        <div className={cn("space-y-4", step !== 'scanOrder' && 'hidden')}>
                            <Label htmlFor="orderRef" className="text-lg">Scan Order Reference</Label>
                            <div className="flex items-end gap-2">
                                <Input ref={orderInputRef} id="orderRef" name="orderRef" placeholder="Scan or type order reference..." value={orderRef} onChange={e => setOrderRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchOrder()} disabled={isLoading}/>
                                <Button onClick={handleSearchOrder} disabled={isLoading || !orderRef}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Find Order
                                </Button>
                            </div>
                        </div>
                        
                        {/* Step 2: Scan Product */}
                        <div className={cn("space-y-4", step !== 'scanProduct' && 'hidden')}>
                             <Card className="p-4 bg-muted">
                                <CardTitle className="text-lg mb-2">Product to Pack</CardTitle>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div><p className="font-medium text-muted-foreground">SKU</p><p className="font-semibold">{foundOrder?.sku}</p></div>
                                    <div><p className="font-medium text-muted-foreground">Quantity</p><p className="font-semibold">{foundOrder?.qty.toLocaleString()}</p></div>
                                    <div><p className="font-medium text-muted-foreground">Barcode</p><p className="font-semibold font-mono text-base">{maskedBarcode}</p></div>
                                    <div><p className="font-medium text-muted-foreground">From</p><p className="font-semibold">{foundOrder?.locations?.join(', ')}</p></div>
                                </div>
                            </Card>
                            <Label htmlFor="productScan" className="text-lg">Scan Product Barcode</Label>
                            <div className="flex items-end gap-2">
                                <Input ref={productInputRef} id="productScan" name="productScan" placeholder="Scan product barcode to verify..." value={scannedBarcode} onChange={e => setScannedBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleProductScan()}/>
                                <Button onClick={handleProductScan} disabled={!scannedBarcode}>Verify</Button>
                            </div>
                        </div>
                        
                        {/* Step 3: Scan Box */}
                        <div className={cn("space-y-4", step !== 'scanBox' && 'hidden')}>
                             <div className="p-4 rounded-lg bg-green-50 border-green-300 border text-green-800 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5"/>
                                <p className="font-bold">Product Verified!</p>
                            </div>
                             <Label htmlFor="boxScan" className="text-lg">Scan Box Packaging</Label>
                            <div className="flex items-end gap-2">
                                <Input ref={boxInputRef} id="boxScan" name="boxScan" placeholder="Scan box barcode..." value={scannedBox} onChange={e => setScannedBox(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBoxScan()} disabled={isSubmitting} />
                                <Button onClick={handleBoxScan} disabled={isSubmitting || !scannedBox}>
                                     {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Pack'}
                                </Button>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
            
             {/* Success Dialog */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={resetProcess}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl text-green-600">
                           <CheckCircle className="h-8 w-8" /> Validation Successful
                        </DialogTitle>
                        <DialogDescription className="pt-4 text-base">
                            Order <span className="font-bold text-foreground">{foundOrder?.reference}</span> has been successfully packed and validated.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {foundOrder && (
                            <div id="shipping-label-content" className="hidden print:block">
                                <ShippingLabel order={foundOrder} />
                            </div>
                        )}
                        <Button className="w-full h-12" onClick={handlePrint}>
                            <Printer className="mr-2 h-5 w-5" /> Print Shipping Label
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={resetProcess} className="w-full">
                            Pack Next Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </MainLayout>
    );
}
