
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InboundLabel } from '@/components/inbound-label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InboundDocument } from '@/types/inbound-document';
import type { BatchProduct } from '@/types/batch-product';

type InboundPrintData = InboundDocument & {
    name: string;
};

function PrintPageContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [document, setDocument] = useState<InboundPrintData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docId = searchParams.get('docId');

        if (!docId) {
            setLoading(false);
            return;
        }

        const fetchDocData = async () => {
            try {
                const [inboundRes, allProductsRes] = await Promise.all([
                    fetch('/api/inbound-documents'),
                    fetch('/api/master-products'),
                ]);
                
                if (!inboundRes.ok) throw new Error('Failed to fetch inbound documents.');
                if (!allProductsRes.ok) throw new Error('Failed to fetch master products.');

                const allInboundDocs: InboundDocument[] = await inboundRes.json();
                const allProducts: {sku: string, name: string}[] = await allProductsRes.json();
                
                const productMap = new Map(allProducts.map(p => [p.sku, p.name]));
                const docToPrint = allInboundDocs.find(d => d.id.toString() === docId);

                if (!docToPrint) {
                    throw new Error('Document not found');
                }
                
                const printData: InboundPrintData = {
                    ...docToPrint,
                    name: productMap.get(docToPrint.sku) || 'Unknown Product',
                };
                
                setDocument(printData);
                setLoading(false);
                
                setTimeout(() => {
                    window.print();
                }, 500);

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error loading print data',
                    description: error.message
                });
                setLoading(false);
            }
        };

        fetchDocData();
    }, [searchParams, toast]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!document) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Document not found.</p></div>;
    }

    return (
        <div>
            <InboundLabel document={document} />
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                @page {
                    size: A4;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}

export default function PrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrintPageContent />
        </Suspense>
    );
}
