
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WavePickList } from '@/components/wave-picklist';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Wave } from '@/types/wave';


function PrintWavePageContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [wave, setWave] = useState<Wave | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const waveId = searchParams.get('waveId');

        if (!waveId) {
            setLoading(false);
            return;
        }

        const fetchWaveData = async () => {
            try {
                const wavesRes = await fetch('/api/waves');
                if (!wavesRes.ok) throw new Error('Failed to fetch waves.');

                const allWaves: Wave[] = await wavesRes.json();
                const waveToPrint = allWaves.find(w => w.id.toString() === waveId);

                if (!waveToPrint) {
                    throw new Error('Wave document not found');
                }
                
                setWave(waveToPrint);
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

        fetchWaveData();
    }, [searchParams, toast]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!wave) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Wave document not found.</p></div>;
    }

    return (
        <div>
            <WavePickList wave={wave} />
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
                    size: A6 landscape;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}

export default function PrintWavePage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrintWavePageContent />
        </Suspense>
    );
}
