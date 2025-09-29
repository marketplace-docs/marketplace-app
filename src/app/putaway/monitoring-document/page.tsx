
'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
  Upload,
  Check,
  Ban,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import type { PutawayDocument } from '@/types/putaway-document';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const DocumentCard = ({ document }: { document: PutawayDocument }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Assuming the source document is the same as the putaway document number for now
    // In a real scenario, this might need more complex logic to trace back to the inbound doc
    const fromDocument = document.no_document.startsWith('MP-PTW') ? `DOC-INB-${document.no_document.split('-')[2]}-${document.no_document.split('-')[3]}` : document.no_document;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 bg-green-50 border-b border-green-200">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-800">{document.no_document}</p>
                            <p className="text-xs text-green-700">Internal Transfer Document - Receipt Inbound</p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <p className="font-medium text-gray-700">Worker: {document.check_by}</p>
                        <p>Start: {format(new Date(document.date), 'HH:mm:ss')}</p>
                        <p>Done: {format(new Date(document.date), 'HH:mm:ss')}</p>
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
                                <TableHead>DONE AT</TableHead>
                                <TableHead className="text-right w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <div className="font-medium">{document.brand}</div>
                                    <div className="text-sm text-muted-foreground">{document.sku}</div>
                                </TableCell>
                                <TableCell>{document.barcode}</TableCell>
                                <TableCell>{document.qty}</TableCell>
                                <TableCell>{document.qty}</TableCell>
                                <TableCell>{document.qty}</TableCell>
                                <TableCell>{format(new Date(document.date), 'HH:mm:ss')}</TableCell>
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
                                        <TableCell>{fromDocument}</TableCell>
                                        <TableCell>{document.location}</TableCell>
                                        <TableCell>{document.qty}</TableCell>
                                        <TableCell><Badge variant="outline">Marketplace</Badge></TableCell>
                                        <TableCell>{format(new Date(document.date), 'HH:mm:ss')}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};


export default function MonitoringPutawayPage() {
    const [documents, setDocuments] = useState<PutawayDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const { user } = useAuth();
    
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/putaway-documents');
            if (!response.ok) throw new Error('Failed to fetch putaway documents');
            const data: PutawayDocument[] = await response.json();
            const doneDocs = data.filter(d => d.status === 'Done');
            setDocuments(doneDocs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
        return documents.filter(doc =>
            doc.no_document.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [documents, searchTerm]);

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
                                <CardTitle>Putaway Documents</CardTitle>
                                <CardDescription>A log of all items that have been put away.</CardDescription>
                            </div>
                            <div className="w-full md:w-auto">
                                <Input placeholder="Search Document No..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {loading ? (
                           <div className="flex justify-center items-center h-64"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                       ) : paginatedDocs.length > 0 ? (
                            paginatedDocs.map((doc) => (
                               <DocumentCard key={doc.id} document={doc} />
                            ))
                       ) : (
                           <div className="text-center py-16 text-muted-foreground">No completed putaway documents found.</div>
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
