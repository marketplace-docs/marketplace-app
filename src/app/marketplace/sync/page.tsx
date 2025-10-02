'use client';

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const marketplaces = [
    { id: 'shopee', name: 'Shopee' },
    { id: 'lazada', name: 'Lazada' },
    { id: 'tiktok', name: 'Tiktok' },
];

export default function SyncMarketplacePage() {
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    const handleSync = async () => {
        setIsSyncing(true);
        toast({
            title: "Sinkronisasi Dimulai...",
            description: "Menarik data pesanan dari semua platform.",
        });

        // Simulate API call to sync data
        await new Promise(resolve => setTimeout(resolve, 3000));

        setIsSyncing(false);
        toast({
            variant: "success",
            title: "Sinkronisasi Selesai",
            description: "Data pesanan baru telah berhasil ditarik dan ditambahkan ke halaman 'My Orders'.",
        });
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Sinkronisasi Marketplace</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Tarik Data Pesanan</CardTitle>
                        <CardDescription>
                            Gunakan fitur ini untuk menarik data pesanan terbaru secara otomatis dari platform marketplace yang terhubung.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Pemberitahuan</AlertTitle>
                            <AlertDescription>
                                Proses ini akan mengambil semua pesanan dengan status "Siap Dikirim" dari setiap platform dan menambahkannya ke dalam antrian di halaman "My Orders".
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="flex items-center space-x-4">
                                {marketplaces.map(mp => (
                                    <div key={mp.id} className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-muted rounded-full">
                                            <RefreshCw className="h-8 w-8 text-primary" />
                                        </div>
                                        <span className="font-semibold">{mp.name}</span>
                                    </div>
                                ))}
                            </div>
                            <Button size="lg" onClick={handleSync} disabled={isSyncing}>
                                {isSyncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sedang Sinkronisasi...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Mulai Sinkronisasi Pesanan
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
