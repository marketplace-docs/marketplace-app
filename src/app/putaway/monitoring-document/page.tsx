'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { InboundDocument } from '@/types/inbound-document';
import type { ProductOutDocument } from '@/types/product-out-document';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const DocumentCard = ({ document: inboundDoc, allProductOutDocs }: { document: InboundDocument; allProductOutDocs: ProductOutDocument[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const relatedPutaways = useMemo(() => 
        allProductOutDocs.filter(pd => pd.nodocument === inboundDoc.reference && (pd.status === 'Issue - Putaway' || pd.status === 'Receipt - Putaway'))
    , [allProductOutDocs, inboundDoc.reference]);

    const totalPutawayQty = useMemo(() => 
        relatedPutaways
            .filter(pd => pd.status === 'Receipt - Putaway')
            .reduce((sum, current) => sum + current.qty, 0)
    , [relatedPutaways]);

    const currentStatus: 'Assign' | 'In Progress' | 'Done' = useMemo(() => {
        if (totalPutawayQty >= inboundDoc.qty) return 'Done';
        if (totalPutawayQty > 0) return 'In Progress';
        return 'Assign';
    }, [totalPutawayQty, inboundDoc.qty]);

    const isDone = currentStatus === 'Done';

    return (
        <Card className="overflow-hidden">
            <CardHeader className={cn(
                "p-4 border-b",
                isDone ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
            )}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {isDone ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <ClipboardList className="h-6 w-6 text-yellow-600" />}
                        <div>
                            <p className={cn("font-semibold", isDone ? "text-green-800" : "text-yellow-800")}>{inboundDoc.reference}</p>
                            <p className={cn("text-xs", isDone ? "text-green-700" : "text-yellow-700")}>
                                {inboundDoc.reference.startsWith('DOC-TRSF-VNR-') ? 'Vendor Transfer Document' : 'Receipt Inbound Document'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <p className="font-medium text-gray-700">Worker: {inboundDoc.received_by}</p>
                         <p>Received: {format(new Date(inboundDoc.date), 'dd/MM/yy HH:mm')}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-1/3">Product Name</TableHead>
                                <TableHead>EAN</TableHead>
                                <TableHead>QTY</TableHead>
                                <TableHead>QTY MOVE</TableHead>
                                <TableHead>QTY DONE</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <div className="font-medium">{inboundDoc.brand}</div>
                                    <div className="text-sm text-muted-foreground">{inboundDoc.sku}</div>
                                </TableCell>
                                <TableCell>{inboundDoc.barcode}</TableCell>
                                <TableCell>{inboundDoc.qty}</TableCell>
                                <TableCell>{totalPutawayQty}</TableCell>
                                <TableCell>{totalPutawayQty}</TableCell>
                                <TableCell>
                                    <Badge variant={isDone ? 'default' : 'secondary'} className={cn(isDone && 'bg-green-600')}>
                                        {currentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:-rotate-180" />
                                        </Button>
                                    </CollapsibleTrigger>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                     <CollapsibleContent>
                        <div className="bg-gray-50 px-4 py-2 border-t">
                             {relatedPutaways.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {relatedPutaways.map(pd => (
                                            <TableRow key={pd.id}>
                                                <TableCell>{pd.status === 'Issue - Putaway' ? 'Staging Area Inbound' : pd.nodocument}</TableCell>
                                                <TableCell>{pd.location}</TableCell>
                                                <TableCell>{pd.qty}</TableCell>
                                                <TableCell><Badge variant="outline">{pd.status === 'Issue - Putaway' ? 'OUT' : 'IN'}</Badge></TableCell>
                                                <TableCell>{format(new Date(pd.date), 'HH:mm:ss')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             ) : (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    No putaway movements recorded for this document yet.
                                </div>
                             )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

export default function MonitoringPutawayPage() {
    const [inboundDocuments, setInboundDocuments] = useState<InboundDocument[]>([]);
    const [allProductOutDocs, setAllProductOutDocs] = useState<ProductOutDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [inboundRes, productOutRes] = await Promise.all([
                fetch('/api/inbound-documents'),
                fetch('/api/product-out-documents'),
            ]);
            
            if (!inboundRes.ok) throw new Error('Failed to fetch inbound documents');
            if (!productOutRes.ok) throw new Error('Failed to fetch product out documents');

            const inboundDocs: InboundDocument[] = await inboundRes.json();
            const productOutDocs: ProductOutDocument[] = await productOutRes.json();
            
            setInboundDocuments(inboundDocs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setAllProductOutDocs(productOutDocs);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);
    
    const filteredDocuments = useMemo(() => {
        return inboundDocuments.filter(doc =>
            doc.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.barcode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inboundDocuments, searchTerm]);

    const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
    const paginatedDocs = filteredDocuments.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    const handlePrevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Putaway</h1>
                 {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Putaway Tasks &amp; History</CardTitle>
                                <CardDescription>A log of all items that are pending or have been put away.</CardDescription>
                            </div>
                            <div className="w-full md:w-auto">
                                <Input placeholder="Search Document, SKU, or Barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {loading ? (
                           <div className="flex justify-center items-center h-64"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                       ) : paginatedDocs.length > 0 ? (
                            paginatedDocs.map((doc) => (
                               <DocumentCard key={doc.id} document={doc} allPutawayDocs={allProductOutDocs} />
                            ))
                       ) : (
                           <div className="text-center py-16 text-muted-foreground">No putaway documents found.</div>
                       )}

                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredDocuments.length > 0 ? currentPage : 0} of {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                        setRowsPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={rowsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[5, 20, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
