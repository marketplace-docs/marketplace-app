'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Download, ChevronDown, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type PutawayDocument = {
    id: string;
    no_document: string;
    date: string;
    qty: number;
    status: 'Done' | 'Pending';
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    check_by: string;
};

type AggregatedByLocation = {
    location: string;
    totalQty: number;
    documents: PutawayDocument[];
};

const statusVariantMap: { [key in PutawayDocument['status']]: "default" | "secondary" } = {
    'Done': 'default',
    'Pending': 'secondary',
};

export default function ProductInPage() {
    const [putawayDocs, setPutawayDocs] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const [openAccordion, setOpenAccordion] = useState<string[]>([]);
    
    const fetchPutawayDocs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) throw new Error('Failed to fetch putaway documents');
            const data = await response.json();
            setPutawayDocs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPutawayDocs();
    }, [fetchPutawayDocs]);

    const aggregatedAndFilteredData = useMemo(() => {
        const locationMap = new Map<string, AggregatedByLocation>();

        putawayDocs.forEach(doc => {
            const locationKey = doc.location || 'No Location';
            if (!locationMap.has(locationKey)) {
                locationMap.set(locationKey, {
                    location: locationKey,
                    totalQty: 0,
                    documents: [],
                });
            }
            const existing = locationMap.get(locationKey)!;
            existing.totalQty += doc.qty;
            existing.documents.push(doc);
        });

        const allAggregated = Array.from(locationMap.values()).sort((a, b) => b.totalQty - a.totalQty);
        
        if (!searchTerm) {
            return allAggregated;
        }

        return allAggregated.map(group => ({
            ...group,
            documents: group.documents.filter(doc =>
                doc.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.no_document.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(group => group.documents.length > 0);

    }, [putawayDocs, searchTerm]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm]);

    const totalPages = Math.ceil(aggregatedAndFilteredData.length / rowsPerPage);
    const paginatedData = aggregatedAndFilteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };
    
    const handleExport = () => {
        if (putawayDocs.length === 0) {
            toast({
                variant: "destructive",
                title: "No Data",
                description: "There is no data to export.",
            });
            return;
        }
        const headers = ["no_document", "date", "SKU", "Barcode", "Brand", "EXP Date", "Location", "Quantity", "Status", "check_by"];
        const csvContent = [
            headers.join(","),
            ...putawayDocs.map(item => [
                `"${item.no_document.replace(/"/g, '""')}"`,
                `"${format(new Date(item.date), "yyyy-MM-dd HH:mm:ss")}"`,
                `"${item.sku.replace(/"/g, '""')}"`,
                `"${item.barcode.replace(/"/g, '""')}"`,
                `"${item.brand.replace(/"/g, '""')}"`,
                `"${format(new Date(item.exp_date), "yyyy-MM-dd")}"`,
                `"${item.location.replace(/"/g, '""')}"`,
                item.qty,
                item.status,
                `"${item.check_by.replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `goods_receipt_data_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Goods receipt data exported." });
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Goods Receipt</h1>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>Goods Receipt by Location</CardTitle>
                                <CardDescription>A log of all received items, grouped by warehouse location.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                                <Input 
                                    placeholder="Search SKU, Barcode, or Document..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-auto md:max-w-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                           <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Total Quantity</TableHead>
                                            <TableHead className="w-12 text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                                {loading ? (
                                    <div className="h-24 flex items-center justify-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : paginatedData.length > 0 ? (
                                    <Table>
                                        <TableBody>
                                            {paginatedData.map((group) => (
                                            <AccordionItem value={group.location} key={group.location} asChild>
                                                <>
                                                <TableRow>
                                                    <TableCell className="font-medium flex items-center gap-2"><Warehouse className="h-4 w-4 text-muted-foreground" /> {group.location}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="default" className="font-semibold text-base">
                                                            {group.totalQty.toLocaleString()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="w-12 text-right">
                                                        <AccordionTrigger className="p-0 [&[data-state=open]>svg]:rotate-180">
                                                            <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                                                        </AccordionTrigger>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={3} className="p-0 border-0">
                                                        <AccordionContent>
                                                            <div className="p-4 bg-muted/50">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>No. Document</TableHead>
                                                                            <TableHead>Date</TableHead>
                                                                            <TableHead>SKU</TableHead>
                                                                            <TableHead>Barcode</TableHead>
                                                                            <TableHead>Brand</TableHead>
                                                                            <TableHead>EXP</TableHead>
                                                                            <TableHead>Quantity</TableHead>
                                                                            <TableHead>Status</TableHead>
                                                                            <TableHead>Checked By</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {group.documents.map((doc) => (
                                                                            <TableRow key={doc.id}>
                                                                                <TableCell>{doc.no_document}</TableCell>
                                                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                                                <TableCell className="font-medium">{doc.sku}</TableCell>
                                                                                <TableCell>{doc.barcode}</TableCell>
                                                                                <TableCell>{doc.brand}</TableCell>
                                                                                <TableCell>{format(new Date(doc.exp_date), 'dd/MM/yyyy')}</TableCell>
                                                                                <TableCell>{doc.qty.toLocaleString()}</TableCell>
                                                                                <TableCell>
                                                                                    <Badge variant={statusVariantMap[doc.status] || 'default'}>
                                                                                        {doc.status}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                                <TableCell>{doc.check_by}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </AccordionContent>
                                                    </TableCell>
                                                </TableRow>
                                                </>
                                            </AccordionItem>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="h-24 flex items-center justify-center text-muted-foreground">
                                        No incoming product data.
                                    </div>
                                )}
                            </Accordion>
                       </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {aggregatedAndFilteredData.length > 0 ? currentPage : 0} of {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                        setRowsPerPage(Number(value));
                                    }}
                                    >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={rowsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 25, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
