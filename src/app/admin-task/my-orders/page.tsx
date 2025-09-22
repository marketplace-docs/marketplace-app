
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, PackageMinus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type ProductOutDocument = {
    id: string;
    nodocument: string;
    sku: string;
    barcode: string;
    expdate: string;
    location: string;
    qty: number;
    status: string;
    date: string; 
    validatedby: string;
};

const statusOptions = [
    'All',
    'Issue - Order', 
    'Issue - Internal Transfer', 
    'Issue - Adjustment Manual',
    'Adjustment - Loc',
    'Adjustment - SKU',
    'Issue - Putaway',
    'Receipt - Putaway',
    'Issue - Return',
    'Issue - Return Putaway',
    'Issue - Update Expired',
    'Receipt - Update Expired',
    'Receipt - Outbound Return',
    'Receipt',
    'Adjusment - Loc'
];


export default function MyOrdersPage() {
    const { user } = useAuth();
    const [myOrders, setMyOrders] = useState<ProductOutDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchMyOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/product-out-documents');
            if (!response.ok) {
                throw new Error('Failed to fetch product out documents');
            }
            const allDocs: ProductOutDocument[] = await response.json();
            const userOrders = allDocs.filter(doc => doc.validatedby === user.name);
            setMyOrders(userOrders);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);
    
    const filteredOrders = useMemo(() => {
        return myOrders.filter(order => {
            const matchesSearch = order.nodocument.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  order.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  order.barcode.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [myOrders, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

     const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm, statusFilter]);


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">My Orders</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>My Validated Goods Issues</CardTitle>
                        <CardDescription>A list of all "product out" documents that you have validated.</CardDescription>
                         <div className="flex items-center gap-2 pt-4">
                            <Input 
                                placeholder="Search document, SKU, or barcode..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                             <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : paginatedOrders.length > 0 ? (
                           <>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Document</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>QTY</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.nodocument}</TableCell>
                                                <TableCell>{format(new Date(order.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{order.sku}</TableCell>
                                                <TableCell>{order.location}</TableCell>
                                                <TableCell><Badge>{order.qty}</Badge></TableCell>
                                                <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                             <div className="flex items-center justify-end space-x-2 py-4">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    Page {filteredOrders.length > 0 ? currentPage : 0} of {totalPages}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <Select
                                        value={`${rowsPerPage}`}
                                        onValueChange={(value) => setRowsPerPage(Number(value))}
                                    >
                                        <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={rowsPerPage} /></SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 25, 50].map((size) => <SelectItem key={size} value={`${size}`}>{size}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                           </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                                <PackageMinus className="h-16 w-16 mb-4" />
                                <h3 className="text-xl font-semibold">No Documents Found</h3>
                                <p>You have not validated any goods issue documents yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
