

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanLine, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { BatchProduct } from '@/types/batch-product';
import type { Order } from '@/types/order';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type PickingStep = 'scanOrder' | 'scanLocation' | 'scanProduct' | 'enterQuantity';

type FoundOrder = Order & {
    waveId: number;
    wave_document_number: string;
}

export default function GoPickerPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // State for the process
    const [step, setStep] = useState<PickingStep>('scanOrder');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data state
    const [orderRef, setOrderRef] = useState('');
    const [foundOrder, setFoundOrder] = useState<FoundOrder | null>(null);
    const [scannedLocation, setScannedLocation] = useState('');
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [pickedQty, setPickedQty] = useState('');

    // Refs for inputs
    const orderInputRef = useRef<HTMLInputElement>(null);
    const locationInputRef = useRef<HTMLInputElement>(null);
    const productInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    // Focus management
    useEffect(() => {
        if (step === 'scanOrder') orderInputRef.current?.focus();
        if (step === 'scanLocation') locationInputRef.current?.focus();
        if (step === 'scanProduct') productInputRef.current?.focus();
        if (step === 'enterQuantity') qtyInputRef.current?.focus();
    }, [step]);
    

    const handleSearchOrder = async () => {
        if (!orderRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please scan or enter an order reference.' });
            return;
        }
        
        setIsLoading(true);
        setFoundOrder(null);
        try {
            const wavesResponse = await fetch('/api/waves');
            if (!wavesResponse.ok) throw new Error('Could not fetch waves to find the order.');
            const waves = await wavesResponse.json();

            let targetWave;
            let orderInWave: any;

            for (const wave of waves) {
                if (wave.status !== 'Wave Progress') continue;

                const waveDetailsRes = await fetch(`/api/waves/${wave.id}`);
                if (!waveDetailsRes.ok) continue;

                const waveDetails = await waveDetailsRes.json();
                const found = waveDetails.orders.find((o: any) => o.order_reference === orderRef);
                
                if (found) {
                    targetWave = wave;
                    orderInWave = found;
                    break;
                }
            }

            if (!orderInWave || !targetWave) {
                toast({ variant: 'destructive', title: 'Not Found', description: `Order ${orderRef} not found in any active wave.` });
                setIsLoading(false);
                return;
            }
            
            const allBatchesRes = await fetch(`/api/master-product/batch-products`);
            if (!allBatchesRes.ok) throw new Error('Failed to fetch product stock data.');
            const allBatches: BatchProduct[] = await allBatchesRes.json();

            const availableBatch = allBatches
                .filter(b => b.sku === orderInWave.sku && b.stock > 0)
                .sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime())
                [0];

            const isOutOfStock = !availableBatch;
            
            const orderDetails: FoundOrder = {
                id: orderInWave.order_id,
                reference: orderInWave.order_reference,
                sku: orderInWave.sku,
                barcode: availableBatch?.barcode || 'N/A - OOS',
                qty: orderInWave.qty,
                location: availableBatch?.location || 'N/A - OOS',
                waveId: targetWave.id,
                wave_document_number: targetWave.wave_document_number,
                customer: orderInWave.customer || 'N/A',
                city: orderInWave.city || 'N/A',
                type: 'N/A',
                from: 'N/A',
                delivery_type: 'N/A',
                order_date: new Date().toISOString(),
                total_stock_on_hand: availableBatch?.stock || 0,
                status: isOutOfStock ? 'Out of Stock' : 'Payment Accepted',
                address: orderInWave.address || 'N/A',
                phone: orderInWave.phone || 'N/A'
            };
            
            setFoundOrder(orderDetails);
            
            if (isOutOfStock) {
                setPickedQty('0'); // Pre-fill 0 for OOS
                setStep('enterQuantity'); // Skip to the last step
                toast({
                    variant: 'destructive',
                    title: 'Out of Stock',
                    description: 'No available stock found for this item. Please confirm to move to OOS management.',
                });
            } else {
                setStep('scanLocation');
            }


        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLocationScan = () => {
        if (!foundOrder || !scannedLocation) return;
        if (scannedLocation.toLowerCase() === foundOrder.location.toLowerCase()) {
            toast({ title: "Location Verified", description: "Please scan the product barcode."});
            setStep('scanProduct');
        } else {
            toast({ variant: 'destructive', title: 'Wrong Location', description: `Expected ${foundOrder.location}, but scanned ${scannedLocation}.` });
            setScannedLocation('');
        }
    };
    
    const handleProductScan = () => {
        if (!foundOrder || !scannedBarcode) return;
        if (scannedBarcode === foundOrder.barcode) {
            toast({ title: "Product Verified", description: "Please enter the quantity."});
            setPickedQty(foundOrder.qty.toString());
            setStep('enterQuantity');
        } else {
            toast({ variant: 'destructive', title: 'Wrong Product', description: `Scanned barcode does not match the required product.` });
            setScannedBarcode('');
        }
    };

    const handleConfirmPick = async () => {
        if (!foundOrder || !user) {
             toast({ variant: 'destructive', title: 'Error', description: 'No order loaded or user not logged in.' });
            return;
        }

        const quantity = parseInt(pickedQty, 10);
        if (isNaN(quantity) || quantity < 0) {
            toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Please enter a valid number for the actual quantity.' });
            return;
        }
        
        if (quantity > foundOrder.qty) {
            toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Actual quantity cannot be greater than the required quantity.' });
            return;
        }

        setIsSubmitting(true);

        try {
            if (quantity < foundOrder.qty) {
                const response = await fetch(`/api/waves/${foundOrder.waveId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'mark_oos', orderId: foundOrder.reference, user }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to mark order as Out of Stock.');
                }
                
                const toastMessage = quantity === 0 
                    ? `Order ${foundOrder.reference} moved to Out of Stock management.`
                    : `Partial pick recorded. Order ${foundOrder.reference} moved to Out of Stock for review.`;

                toast({ title: 'Marked as OOS', description: toastMessage });

            } else {
                const issueDocPayload = {
                    documents: [{
                        sku: foundOrder.sku,
                        barcode: foundOrder.barcode,
                        expdate: new Date().toISOString(),
                        location: foundOrder.location,
                        qty: quantity,
                        status: 'Issue - Order' as const,
                        date: new Date().toISOString(),
                        validatedby: user.name,
                        order_reference: foundOrder.reference,
                    }],
                    user,
                };
                const issueRes = await fetch('/api/product-out-documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(issueDocPayload),
                });
                if (!issueRes.ok) {
                    const errorData = await issueRes.json();
                    throw new Error(errorData.error || 'Failed to create picking log document.');
                }

                const response = await fetch(`/api/waves/${foundOrder.waveId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_status', status: 'Wave Done', user }),
                });

                if (!response.ok) throw new Error('Failed to update wave status.');
                
                toast({ title: 'Pick Confirmed', description: `Order ${foundOrder.reference} picked and logged. Ready for packing.`});
            }
            
            // Reset for next order
            setOrderRef('');
            setFoundOrder(null);
            setScannedLocation('');
            setScannedBarcode('');
            setPickedQty('');
            setStep('scanOrder');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Go-Picker</h1>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center mb-2">
                            <ScanLine className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-center">Scan Picking Order</CardTitle>
                        <CardDescription className="text-center">Follow the steps to pick the order correctly.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       {/* Step 1: Scan Order */}
                        <div className={cn("space-y-4", step !== 'scanOrder' && 'hidden')}>
                            <Label htmlFor="orderRef" className="text-lg">Scan Order Reference</Label>
                            <div className="flex items-end gap-2">
                                <Input 
                                    ref={orderInputRef}
                                    id="orderRef" 
                                    placeholder="Scan or type order reference..." 
                                    value={orderRef} 
                                    onChange={(e) => setOrderRef(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                                    className="text-center text-xl h-12"
                                    disabled={isLoading}
                                />
                                <Button onClick={handleSearchOrder} disabled={isLoading || !orderRef} className="h-12">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        {/* Step 2: Scan Location */}
                        <div className={cn("space-y-4", step !== 'scanLocation' && 'hidden')}>
                             <div className="p-4 rounded-lg bg-yellow-50 border-yellow-300 border text-yellow-800">
                                <p className="font-bold">Go to Location:</p>
                                <p className="text-2xl font-mono">{foundOrder?.location}</p>
                             </div>
                            <Label htmlFor="locationScan" className="text-lg">Scan Location Barcode</Label>
                            <div className="flex items-end gap-2">
                                <Input 
                                    ref={locationInputRef}
                                    id="locationScan" 
                                    placeholder="Scan location barcode..." 
                                    value={scannedLocation} 
                                    onChange={(e) => setScannedLocation(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleLocationScan()}
                                    className="text-center text-xl h-12"
                                    disabled={isSubmitting}
                                />
                                 <Button onClick={handleLocationScan} disabled={isSubmitting || !scannedLocation} className="h-12">
                                    Verify
                                </Button>
                            </div>
                        </div>
                        
                         {/* Step 3: Scan Product */}
                        <div className={cn("space-y-4", step !== 'scanProduct' && 'hidden')}>
                             <div className="p-4 rounded-lg bg-blue-50 border-blue-300 border text-blue-800 space-y-2">
                                <p className="font-bold">Pick Product:</p>
                                <p>SKU: <Badge variant="secondary">{foundOrder?.sku}</Badge></p>
                                <p>Barcode: <Badge variant="secondary">{foundOrder?.barcode}</Badge></p>
                                <p>Qty: <Badge>{foundOrder?.qty.toLocaleString()}</Badge></p>
                             </div>
                            <Label htmlFor="productScan" className="text-lg">Scan Product Barcode</Label>
                             <div className="flex items-end gap-2">
                                <Input 
                                    ref={productInputRef}
                                    id="productScan" 
                                    placeholder="Scan product barcode..." 
                                    value={scannedBarcode} 
                                    onChange={(e) => setScannedBarcode(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleProductScan()}
                                    className="text-center text-xl h-12"
                                    disabled={isSubmitting}
                                />
                                 <Button onClick={handleProductScan} disabled={isSubmitting || !scannedBarcode} className="h-12">
                                    Verify
                                </Button>
                            </div>
                        </div>
                        
                        {/* Step 4: Enter Quantity */}
                        <div className={cn("space-y-4", step !== 'enterQuantity' && 'hidden')}>
                            {foundOrder?.status === 'Payment Accepted' ? (
                                <div className="p-4 rounded-lg bg-green-50 border-green-300 border text-green-800 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5"/>
                                    <p className="font-bold">Product and Location Verified!</p>
                                </div>
                            ) : (
                                 <div className="p-4 rounded-lg bg-red-50 border-red-300 border text-red-800 flex items-center gap-2">
                                    <Badge variant="destructive">OUT OF STOCK</Badge>
                                    <p className="font-bold">No stock available for this item.</p>
                                </div>
                            )}

                            <Label htmlFor="actualQty" className="text-lg">Enter Picked Quantity</Label>
                             <Input
                                ref={qtyInputRef}
                                id="actualQty"
                                type="number"
                                value={pickedQty}
                                onChange={(e) => setPickedQty(e.target.value)}
                                className="text-center text-xl h-12 mt-2"
                                placeholder="Enter quantity"
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmPick()}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Enter a quantity less than required to report as partial or Out of Stock.</p>
                            <Button onClick={handleConfirmPick} className="w-full h-12 text-lg" disabled={isSubmitting || pickedQty === ''}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Done Pick
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
