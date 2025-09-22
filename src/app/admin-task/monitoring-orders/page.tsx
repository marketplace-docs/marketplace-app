
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, PackageSearch, RefreshCw, Printer, List, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


type Wave = {
    id: number;
    created_at: string;
    wave_document_number: string;
    wave_type: string;
    status: string;
    total_orders: number;
    created_by: string;
}

export default function MonitoringOrdersPage() {
    const [waves, setWaves] = useState<Wave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWaves = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/waves');
            if (!response.ok) {
                throw new Error("Failed to fetch waves.");
            }
            const data: Wave[] = await response.json();
            setWaves(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWaves();
    }, [fetchWaves]);

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Orders</h1>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Wave Monitoring</CardTitle>
                        <CardDescription>A list of all order waves created.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document Number</TableHead>
                                        <TableHead>Wave Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Partial</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : waves.length > 0 ? (
                                        waves.map(wave => (
                                            <TableRow key={wave.id}>
                                                <TableCell className="font-medium">{wave.wave_document_number}</TableCell>
                                                <TableCell>{wave.wave_type}</TableCell>
                                                <TableCell>{format(new Date(wave.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-white", wave.status === 'Wave Progress' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600')}>
                                                        {wave.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-gray-300">
                                                        <span className="text-xs font-semibold">0/{wave.total_orders}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600 h-8 w-8">
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                         <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 h-8 w-8">
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                         <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600 h-8 w-8">
                                                            <List className="h-4 w-4" />
                                                        </Button>
                                                        <div className="border-l h-5 mx-1" />
                                                         <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8">
                                                            <X className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <PackageSearch className="h-8 w-8" />
                                                    <span>No waves have been created yet.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
