
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const returnTaskJobDesc = [
    "Menerima & memeriksa barang retur dari pelanggan atau ekspedisi",
    "Memverifikasi kondisi barang dan alasan retur sesuai dokumen",
    "Melakukan scanning barcode untuk update status barang di sistem",
    "Memisahkan barang retur berdasarkan kategori (rusak, salah kirim, dll.)",
    "Menempatkan barang retur yang masih layak jual kembali ke lokasi stok",
    "Mengelola barang rusak untuk proses pemusnahan atau klaim",
    "Berkoordinasi dengan tim Customer Service terkait status retur",
    "Membuat laporan harian mengenai jumlah dan jenis barang retur",
];

export default function ReturnTasksPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Return Task</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                        <CardDescription>Berikut adalah daftar tugas dan tanggung jawab untuk proses Return.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {returnTaskJobDesc.map((task, index) => (
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
