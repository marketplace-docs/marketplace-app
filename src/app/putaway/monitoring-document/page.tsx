
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import type { PutawayDocument } from '@/types/putaway-document';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type DocumentGroup = {
  documentNo: string;
  workerName: string;
  workerEmail: string;
  startTime: string;
  doneTime: string;
  items: PutawayDocument[];
};

const ExpandedRow = ({ item }: { item: PutawayDocument }) => (
    <TableRow className="bg-muted/50 hover:bg-muted/60">
        <TableCell colSpan={6} className="p-0">
            <div className="p-4">
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
                        <TableRow>
                            <TableCell>{`DO-SRI-ONLCK-INT-${new Date(item.date).getFullYear()}-${item.no_document.slice(-6)}`}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.qty}</TableCell>
                            <TableCell>marketplace</TableCell>
                             <TableCell>{format(new Date(item.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </TableCell>
    </TableRow>
);


const DocumentCard = ({ group }: { group: DocumentGroup }) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({...prev, [id]: !prev[id]}));
    }

    return (
        <Card>
            <CardHeader className="bg-green-100 p-4 rounded-t-lg border-b border-green-200">
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <p><span className="font-semibold">Document No:</span></p>
                        <p><span className="font-semibold">Worker:</span> ({group.workerEmail}) {group.workerName}</p>
                    </div>
                     <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
                        From Internal Transfer ({`DO-SRI-ONLCK-INT-${new Date(group.startTime).getFullYear()}-${group.documentNo.slice(-6)}`})
                    </Badge>
                    <div className="text-right">
                        <p><span className="font-semibold">Start:</span> {format(new Date(group.startTime), "eee, dd/MMM/yyyy HH:mm")}</p>
                        <p><span className="font-semibold">Done:</span> {format(new Date(group.doneTime), "eee, dd/MMM/yyyy HH:mm")}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>NAME</TableHead>
                            <TableHead>EAN</TableHead>
                            <TableHead>QTY</TableHead>
                            <TableHead>QTY MOVE</TableHead>
                            <TableHead>QTY DONE</TableHead>
                            <TableHead>DONE AT</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {group.items.map((item) => (
                           <React.Fragment key={item.id}>
                             <TableRow onClick={() => toggleRow(item.id)} className="cursor-pointer">
                                <TableCell className="font-medium">[{item.sku}] {item.brand}</TableCell>
                                <TableCell>{item.barcode}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{format(new Date(item.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                             </TableRow>
                             {expandedRows[item.id] && <ExpandedRow item={item} />}
                           </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export default function MonitoringPutawayPage() {
    const [documents, setDocuments] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) {
                throw new Error('Failed to fetch putaway documents');
            }
            const data = await response.json();
            // Filter for only 'Done' tasks as per the design
            setDocuments(data.filter((d: PutawayDocument) => d.status === 'Done'));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);
    
    const groupedDocuments = useMemo(() => {
        const groups: Record<string, DocumentGroup> = {};
        documents.forEach(doc => {
            const key = doc.no_document;
            if (!groups[key]) {
                groups[key] = {
                    documentNo: doc.no_document,
                    workerName: doc.check_by,
                    workerEmail: `${doc.check_by.toLowerCase().replace(' ', '.')}@sociolla.com`,
                    startTime: doc.date,
                    doneTime: doc.date, // Simplification, in reality this might differ
                    items: []
                };
            }
            groups[key].items.push(doc);
            // Update start/done times
            if (new Date(doc.date) < new Date(groups[key].startTime)) {
                groups[key].startTime = doc.date;
            }
            if (new Date(doc.date) > new Date(groups[key].doneTime)) {
                groups[key].doneTime = doc.date;
            }
        });
        return Object.values(groups).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [documents]);


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Putaway</h1>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                         <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : groupedDocuments.length > 0 ? (
                    <div className="space-y-4">
                        {groupedDocuments.map(group => (
                            <DocumentCard key={group.documentNo} group={group} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                             <p>No completed putaway documents found.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
