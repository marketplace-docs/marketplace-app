
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductOutPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Product Out</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Pengeluaran Barang</CardTitle>
                        <CardDescription>Memotong stok data barang dari fitur yang akan kita buat nanti.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Fitur untuk mengelola stok keluar akan dikembangkan di sini.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
