
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductInPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Product In</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Penerimaan Barang</CardTitle>
                        <CardDescription>Menerima data stok barang masuk dari hasil putaway.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Fitur untuk mengelola stok masuk akan dikembangkan di sini.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
