
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, AlertCircle, FileWarning } from 'lucide-react';
import type { PutawayDocument } from '@/types/putaway-document';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PutawayTasksPage() {
    const [pendingDocs, setPendingDocs] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPendingDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) {
                throw new Error('Failed to fetch putaway documents');
            }
            const allDocs: PutawayDocument[] = await response.json();
            const pending = allDocs.filter(doc => doc.status === 'Pending');
            setPendingDocs(pending);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingDocuments();
    }, [fetchPendingDocuments]);

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Putaway Tasks</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Putaway Documents</CardTitle>
                        <CardDescription>This is a list of putaway documents that are pending and require action.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-destructive flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                <span>{error}</span>
                            </div>
                        ) : pendingDocs.length > 0 ? (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No. Document</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>QTY</TableHead>
                                            <TableHead>Checked By</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingDocs.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <Button variant="link" asChild className="p-0 h-auto">
                                                        <Link href={`/putaway/monitoring-document`}>
                                                            {doc.no_document}
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{doc.sku}</TableCell>
                                                <TableCell>{doc.location}</TableCell>
                                                <TableCell>{doc.qty}</TableCell>
                                                <TableCell>{doc.check_by}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{doc.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                                <FileWarning className="h-12 w-12 mb-4" />
                                <h3 className="text-lg font-semibold">All Clear!</h3>
                                <p>There are no pending putaway documents at the moment.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
