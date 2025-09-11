
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const marketplaceTaskJobDesc = [
    "Memantau & memproses pesanan masuk dari berbagai marketplace (Shopee, Lazada, Tiktok)",
    "Memastikan ketersediaan stok produk di semua etalase toko online",
    "Melakukan update harga dan informasi produk secara berkala",
    "Menangani pertanyaan dan keluhan pelanggan melalui chat marketplace",
    "Membuat laporan penjualan harian dan mingguan dari setiap platform",
    "Mengelola kampanye promosi dan diskon di marketplace",
    "Berkoordinasi dengan tim gudang untuk memastikan pesanan diproses tepat waktu",
    "Menganalisis performa toko dan produk untuk strategi penjualan",
];

export default function MarketplaceTasksPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Marketplace Task</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                        <CardDescription>Berikut adalah daftar tugas dan tanggung jawab untuk operasional Marketplace.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {marketplaceTaskJobDesc.map((task, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span>{task}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
