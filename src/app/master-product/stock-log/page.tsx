

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// This type should align with the structure returned by the get_stock_log RPC function
type StockLogEntry = {
    id: string;
    date: string;
    nodocument: string;
    order_reference: string;
    barcode: string;
    sku: string;
    name: string;
    location: string;
    qty_before: number;
    qty_change: number;
    qty_after: number;
    status: string;
    validated_by: string;
    type: 'IN' | 'OUT';
};


export default function StockLogPage() {
    const [stockLog, setStockLog] = useState<StockLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'Super Admin';

    const fetchStockLog = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Updated to call the new RPC endpoint if it exists, or modify the existing one
            // Assuming the RPC function is named 'get_stock_log'
            const response = await fetch('/api/master-product/stock-log');
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch stock log data');
            }
            const data: StockLogEntry[] = await response.json();
            // The RPC function should return data already sorted by date descending.
            setStockLog(data);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStockLog();
    }, [fetchStockLog]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return stockLog;
        return stockLog.filter(log =>
            log.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.nodocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.order_reference && log.order_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
            log.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stockLog, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
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
        if (filteredData.length === 0) {
            toast({ variant: "destructive", title: "No Data", description: "There is no data to export." });
            return;
        }
        const headers = ["Date", "No. Document", "SKU", "Name", "Barcode", "Location", "Qty Before", "Qty Change", "Qty After", "Status", "Validate By"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(log => [
                `"${format(new Date(log.date), "yyyy-MM-dd HH:mm:ss")}"`,
                `"${log.order_reference || log.nodocument}"`,
                `"${log.sku}"`,
                `"${log.name}"`,
                `"${log.barcode}"`,
                `"${log.location}"`,
                log.qty_before,
                log.qty_change,
                log.qty_after,
                `"${log.status}"`,
                `"${log.validated_by}"`
            ].join(","))
        ].join("\n");
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `stock_log_data_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Stock log data exported." });
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Stock Log</h1>
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
                                <CardTitle>Stock History</CardTitle>
                                <CardDescription>Stores historical data of incoming and outgoing items.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {isSuperAdmin && (
                                    <Button variant="outline" onClick={handleExport}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                )}
                                <Input 
                                    placeholder="Search SKU, Barcode, or Document No..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-auto md:max-w-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>No. Document</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Qty Before</TableHead>
                                        <TableHead>Qty Change</TableHead>
                                        <TableHead>Qty After</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Validate By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{format(new Date(log.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{log.order_reference || log.nodocument}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{log.name}</div>
                                                    <div className="text-sm text-muted-foreground">{log.sku}</div>
                                                </TableCell>
                                                <TableCell className="font-medium">{log.barcode}</TableCell>
                                                <TableCell>{log.location}</TableCell>
                                                <TableCell>{log.qty_before.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={log.type === 'IN' ? 'default' : 'destructive'} className="gap-1">
                                                        {log.type === 'IN' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                                        {Math.abs(log.qty_change).toLocaleString()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{log.qty_after.toLocaleString()}</TableCell>
                                                <TableCell>{log.status}</TableCell>
                                                <TableCell>{log.validated_by}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                                No stock history.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                       </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredData.length > 0 ? currentPage : 0} of {totalPages}
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
