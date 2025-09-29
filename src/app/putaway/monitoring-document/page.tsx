
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { format } from 'date-fns';
import type { PutawayDocument } from '@/types/putaway-document';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

type DocumentGroup = {
  putawayDocNumber: string;
  sourceDocNumber: string;
  workerName: string;
  workerEmail: string;
  startTime: string;
  doneTime: string;
  items: PutawayDocument[];
};


const DocumentCard = ({ docGroup }: { docGroup: DocumentGroup }) => {
    const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (sku: string) => {
        setIsExpanded(prev => ({...prev, [sku]: !prev[sku]}));
    };

    const totalQty = docGroup.items.reduce((sum, item) => sum + item.qty, 0);

    return (
        <Card>
            <CardHeader className="bg-green-100 dark:bg-green-900/50 p-4 rounded-t-lg flex flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                        <CardTitle className="text-base font-semibold">{docGroup.putawayDocNumber}</CardTitle>
                        <CardDescription className="text-xs text-green-700 dark:text-green-300">Internal Transfer Document</CardDescription>
                    </div>
                </div>
                 <div className="text-xs text-right">
                    <p><span className="font-semibold">Worker:</span> {docGroup.workerName} ({docGroup.workerEmail})</p>
                    <p><span className="font-semibold">Start:</span> {format(new Date(docGroup.startTime), 'HH:mm:ss')}</p>
                    <p><span className="font-semibold">Done:</span> {format(new Date(docGroup.doneTime), 'HH:mm:ss')}</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>EAN</TableHead>
                            <TableHead>QTY</TableHead>
                            <TableHead>QTY MOVE</TableHead>
                            <TableHead>QTY DONE</TableHead>
                            <TableHead>DONE AT</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {docGroup.items.map((item, index) => (
                           <React.Fragment key={item.id}>
                             <TableRow>
                                <TableCell>{item.brand}<br/><span className="text-muted-foreground text-xs">{item.sku}</span></TableCell>
                                <TableCell>{item.barcode}</TableCell>
                                <TableCell>{totalQty}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{format(new Date(item.date), 'HH:mm:ss')}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => toggleExpand(item.sku)}>
                                        {isExpanded[item.sku] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                            {isExpanded[item.sku] && (
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={7} className="p-2">
                                        <div className="p-2">
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
                                                        <TableCell>{docGroup.sourceDocNumber}</TableCell>
                                                        <TableCell>{item.location}</TableCell>
                                                        <TableCell>{item.qty}</TableCell>
                                                        <TableCell>Marketplace</TableCell>
                                                        <TableCell>{format(new Date(item.date), 'HH:mm:ss')}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
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
    const [searchDocumentNo, setSearchDocumentNo] = useState('');
    const { user } = useAuth();
    
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) throw new Error('Failed to fetch putaway documents');
            const data: PutawayDocument[] = await response.json();
            const doneDocs = data.filter(d => d.status === 'Done');
            setDocuments(doneDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
            const key = doc.no_document; // Group by the putaway document number
            if (!groups[key]) {
                groups[key] = {
                    putawayDocNumber: doc.no_document,
                    sourceDocNumber: doc.no_document, // Source is itself in this context
                    workerName: doc.check_by,
                    workerEmail: user?.email || 'N/A', // Placeholder
                    startTime: doc.date,
                    doneTime: doc.date,
                    items: []
                };
            }
            groups[key].items.push(doc);
            // Update times if needed
            if (new Date(doc.date) < new Date(groups[key].startTime)) groups[key].startTime = doc.date;
            if (new Date(doc.date) > new Date(groups[key].doneTime)) groups[key].doneTime = doc.date;
        });
        return Object.values(groups);
    }, [documents, user]);

    const filteredGroups = useMemo(() => {
        if (!searchDocumentNo) return groupedDocuments;
        return groupedDocuments.filter(group => group.putawayDocNumber.toLowerCase().includes(searchDocumentNo.toLowerCase()));
    }, [groupedDocuments, searchDocumentNo]);


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
                
                <Card>
                    <CardHeader>
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Putaway Documents</CardTitle>
                                <CardDescription>A log of all items that have been put away.</CardDescription>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <Input placeholder="Search Document No..." value={searchDocumentNo} onChange={(e) => setSearchDocumentNo(e.target.value)} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                            </div>
                         ) : filteredGroups.length > 0 ? (
                            filteredGroups.map(group => (
                                <DocumentCard key={group.putawayDocNumber} docGroup={group} />
                            ))
                         ) : (
                             <div className="flex justify-center items-center h-48 text-muted-foreground">
                                No documents found.
                             </div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

