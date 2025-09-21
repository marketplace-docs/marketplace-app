
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, AlertCircle, FileWarning } from 'lucide-react';
import type { PutawayDocument } from '@/types/putaway-document';
import type { CycleCountDoc } from '@/types/cycle-count-doc';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function AdminTasksPage() {
    const [pendingPutaway, setPendingPutaway] = useState<PutawayDocument[]>([]);
    const [pendingCycleCount, setPendingCycleCount] = useState<CycleCountDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllPendingTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [putawayRes, cycleCountRes] = await Promise.all([
                fetch('/api/putaway-documents'),
                fetch('/api/cycle-count-docs')
            ]);
            
            if (!putawayRes.ok) throw new Error('Failed to fetch putaway documents.');
            if (!cycleCountRes.ok) throw new Error('Failed to fetch cycle count documents.');
            
            const allPutaway: PutawayDocument[] = await putawayRes.json();
            const allCycleCount: CycleCountDoc[] = await cycleCountRes.json();
            
            setPendingPutaway(allPutaway.filter(doc => doc.status === 'Pending'));
            setPendingCycleCount(allCycleCount.filter(doc => doc.status === 'Pending' || doc.status === 'In Progress'));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllPendingTasks();
    }, [fetchAllPendingTasks]);

    const hasPendingTasks = pendingPutaway.length > 0 || pendingCycleCount.length > 0;

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Admin Pending Tasks</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Pending Tasks</CardTitle>
                        <CardDescription>A summary of all pending operational tasks that require attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-destructive flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                <span>{error}</span>
                            </div>
                        ) : hasPendingTasks ? (
                           <Accordion type="multiple" defaultValue={['putaway', 'cycle-count']} className="w-full space-y-4">
                                <AccordionItem value="putaway">
                                    <AccordionTrigger className="text-lg font-semibold bg-muted px-4 rounded-t-lg">
                                        Pending Putaway Documents ({pendingPutaway.length})
                                    </AccordionTrigger>
                                    <AccordionContent className="border border-t-0 p-2 rounded-b-lg">
                                        {pendingPutaway.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow><TableHead>Document</TableHead><TableHead>Date</TableHead><TableHead>Checked By</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingPutaway.map(doc => (
                                                    <TableRow key={doc.id}>
                                                        <TableCell>
                                                            <Button variant="link" asChild className="p-0 h-auto">
                                                                <Link href="/putaway/monitoring-document">{doc.no_document}</Link>
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                        <TableCell>{doc.check_by}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        ) : (<p className="p-4 text-center text-muted-foreground">No pending putaway tasks.</p>)}
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="cycle-count">
                                    <AccordionTrigger className="text-lg font-semibold bg-muted px-4 rounded-t-lg">
                                        Pending Cycle Count Tasks ({pendingCycleCount.length})
                                    </AccordionTrigger>
                                    <AccordionContent className="border border-t-0 p-2 rounded-b-lg">
                                        {pendingCycleCount.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                 <TableRow><TableHead>Document</TableHead><TableHead>Date</TableHead><TableHead>Counter</TableHead><TableHead>Status</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingCycleCount.map(doc => (
                                                    <TableRow key={doc.id}>
                                                         <TableCell>
                                                            <Button variant="link" asChild className="p-0 h-auto">
                                                                <Link href={`/cycle-count/monitoring/${doc.id}`}>{doc.no_doc}</Link>
                                                            </Button>
                                                         </TableCell>
                                                        <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                        <TableCell>{doc.counter_name}</TableCell>
                                                        <TableCell><Badge variant="secondary">{doc.status}</Badge></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                         ) : (<p className="p-4 text-center text-muted-foreground">No pending cycle count tasks.</p>)}
                                    </AccordionContent>
                                </AccordionItem>
                           </Accordion>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                                <FileWarning className="h-16 w-16 mb-4" />
                                <h3 className="text-xl font-semibold">Everything is Up-to-Date!</h3>
                                <p>There are no pending administrative or operational tasks at the moment.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
