
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Search, Package, ScanLine, Warehouse, CheckSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { InboundDocument } from "@/types/inbound-document";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function GoPutawayPage() {
    const [docRef, setDocRef] = useState('');
    const [foundDocument, setFoundDocument] = useState<InboundDocument | null>(null);
    const [isPutawayDialogOpen, setPutawayDialogOpen] = useState(false);
    
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [scannedLocation, setScannedLocation] = useState('');
    const [putawayQty, setPutawayQty] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const handleSearchDocument = async () => {
        if (!docRef) {
            toast({ variant: "destructive", title: "Error", description: "Please enter an Inbound Document reference." });
            return;
        }
        setIsLoading(true);
        setFoundDocument(null);
        try {
            const response = await fetch('/api/inbound-documents');
            if (!response.ok) throw new Error('Failed to fetch inbound documents.');
            const allDocs: InboundDocument[] = await response.json();
            
            const doc = allDocs.find(d => d.reference === docRef && d.main_status !== 'Done');

            if (doc) {
                setFoundDocument(doc);
                setPutawayQty(doc.qty.toString());
                setPutawayDialogOpen(true);
            } else {
                toast({ variant: "destructive", title: "Not Found", description: `No pending putaway task found for document ${docRef}.` });
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmPutaway = async () => {
        if (!foundDocument || !user) {
            toast({ variant: "destructive", title: "Error", description: "No document loaded or user not logged in." });
            return;
        }
        if (scannedBarcode !== foundDocument.barcode) {
             toast({ variant: "destructive", title: "Verification Failed", description: "Scanned product barcode does not match the document." });
            return;
        }
        if (!scannedLocation.trim()) {
            toast({ variant: "destructive", title: "Verification Failed", description: "Destination location cannot be empty." });
            return;
        }
        const qty = parseInt(putawayQty, 10);
        if (isNaN(qty) || qty <= 0 || qty > foundDocument.qty) {
            toast({ variant: "destructive", title: "Invalid Quantity", description: `Please enter a valid quantity up to ${foundDocument.qty}.` });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const putawayPayload = {
                no_document: foundDocument.reference,
                date: new Date().toISOString(),
                qty: qty,
                status: 'Done' as const,
                sku: foundDocument.sku,
                barcode: foundDocument.barcode,
                brand: foundDocument.brand,
                exp_date: foundDocument.exp_date,
                location: scannedLocation,
                check_by: user.name,
            };

            const response = await fetch('/api/putaway-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: [putawayPayload], user }),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create putaway document.');
            }
            
            toast({ title: 'Putaway Successful', description: `${qty} units of ${foundDocument.sku} have been placed at ${scannedLocation}.` });
            
            setDocRef('');
            setFoundDocument(null);
            setScannedBarcode('');
            setScannedLocation('');
            setPutawayQty('');
            setPutawayDialogOpen(false);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <MainLayout>
             <div className="w-full h-full flex items-center justify-center">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Assign Task Putaway</CardTitle>
                        <CardDescription>Scan an inbound document to begin the putaway process.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-end gap-2">
                             <div className="flex-1 space-y-2">
                                <Label htmlFor="docRef">Scan/Input Inbound Document</Label>
                                <Input id="docRef" placeholder="e.g., DOC-INB-2024-000001" value={docRef} onChange={(e) => setDocRef(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchDocument()} disabled={isLoading}/>
                             </div>
                             <Button onClick={handleSearchDocument} disabled={isLoading || !docRef}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                Find
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isPutawayDialogOpen} onOpenChange={setPutawayDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Putaway Task: {foundDocument?.reference}</DialogTitle>
                             <DialogDescription>
                                Verify product, scan location, and confirm quantity.
                             </DialogDescription>
                        </DialogHeader>
                        {foundDocument && (
                            <div className="space-y-4 py-4">
                                <Card className="p-4 bg-muted">
                                    <div className="flex items-center gap-4">
                                        <Package className="h-8 w-8 text-primary" />
                                        <div>
                                            <p className="font-bold">{foundDocument.sku}</p>
                                            <p className="text-sm text-muted-foreground">{foundDocument.brand}</p>
                                             <p><Badge variant="secondary">{foundDocument.barcode}</Badge></p>
                                        </div>
                                        <div className="ml-auto text-right">
                                             <p className="text-sm text-muted-foreground">QTY</p>
                                             <p className="font-bold text-lg">{foundDocument.qty}</p>
                                        </div>
                                    </div>
                                </Card>
                                 <div className="space-y-2">
                                    <Label htmlFor="scan-barcode" className="flex items-center gap-2"><ScanLine className="h-4 w-4"/> Scan Product Barcode</Label>
                                    <Input id="scan-barcode" placeholder="Scan barcode to verify" value={scannedBarcode} onChange={(e) => setScannedBarcode(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scan-location" className="flex items-center gap-2"><Warehouse className="h-4 w-4"/> Scan Destination Location</Label>
                                    <Input id="scan-location" placeholder="Scan shelf/rack location" value={scannedLocation} onChange={(e) => setScannedLocation(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="putaway-qty" className="flex items-center gap-2"><CheckSquare className="h-4 w-4"/> Quantity</Label>
                                    <Input id="putaway-qty" type="number" placeholder="Enter quantity to putaway" value={putawayQty} onChange={(e) => setPutawayQty(e.target.value)} />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPutawayDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={handleConfirmPutaway} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Confirm Putaway
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
