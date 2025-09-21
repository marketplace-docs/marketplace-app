
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, AlertCircle, FileWarning } from 'lucide-react';
import type { CycleCountDoc } from '@/types/cycle-count-doc';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CycleCountTaskPage() {
    const { user } = useAuth();
    const [myTasks, setMyTasks] = useState<CycleCountDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMyTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/cycle-count-docs');
            if (!response.ok) {
                throw new Error('Failed to fetch cycle count documents');
            }
            const allDocs: CycleCountDoc[] = await response.json();
            const userTasks = allDocs.filter(doc => 
                doc.counter_name === user.name && 
                (doc.status === 'Pending' || doc.status === 'In Progress')
            );
            setMyTasks(userTasks);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">My Cycle Count Tasks</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Cycle Count Tasks</CardTitle>
                        <CardDescription>This is a list of cycle count tasks assigned to you that are currently active.</CardDescription>
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
                        ) : myTasks.length > 0 ? (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No. Document</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Count Type</TableHead>
                                            <TableHead>Items to Count</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myTasks.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <Button variant="link" asChild className="p-0 h-auto">
                                                        <Link href={`/cycle-count/monitoring/${doc.id}`}>
                                                            {doc.no_doc}
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell>{doc.count_type}</TableCell>
                                                <TableCell className="max-w-xs truncate">{doc.items_to_count}</TableCell>
                                                <TableCell>
                                                    <Badge variant={doc.status === 'Pending' ? 'secondary' : 'default'}>
                                                        {doc.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                                <FileWarning className="h-12 w-12 mb-4" />
                                <h3 className="text-lg font-semibold">No Tasks for You!</h3>
                                <p>There are no pending cycle count tasks assigned to you right now.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
