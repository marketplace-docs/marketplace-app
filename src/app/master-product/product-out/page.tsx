
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const productOutProcess = [
    "Menerima picklist atau perintah pengambilan barang dari sistem.",
    "Melakukan pengambilan barang (picking) sesuai dengan SKU, jumlah, dan lokasi yang tertera.",
    "Melakukan proses packing dan persiapan pengiriman pesanan.",
    "Melakukan scanning barcode barang keluar untuk memotong stok secara otomatis di sistem.",
    "Memperbarui status pesanan menjadi 'Shipped' atau 'Terkirim'.",
    "Menyerahkan paket kepada pihak ekspedisi untuk pengiriman.",
    "Mencatat semua transaksi keluar untuk pelaporan dan audit.",
    "Berkoordinasi dengan tim sales atau marketplace jika terjadi kendala (misal: stok habis).",
];

export default function ProductOutPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Product Out</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Proses Alur Pengeluaran Barang</CardTitle>
                        <CardDescription>Berikut adalah tahapan standar dalam proses pengeluaran barang dari gudang.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {productOutProcess.map((task, index) => (
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
