
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockLogPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Stock Log</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Histori Stok</CardTitle>
                        <CardDescription>Menampung data histori barang masuk dan keluar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Fitur untuk melihat riwayat pergerakan stok akan dikembangkan di sini.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
