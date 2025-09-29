
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const inboundTaskJobDesc = [
    "Menerima barang dari supplier dan memverifikasi sesuai dokumen pengiriman (Surat Jalan)",
    "Melakukan scanning barcode atau input data produk yang diterima ke dalam sistem",
    "Memeriksa kualitas dan kuantitas barang yang datang",
    "Membuat dokumen penerimaan barang (Inbound Receipt) di sistem",
    "Memberikan label identifikasi pada setiap palet atau karton yang diterima",
    "Berkoordinasi dengan tim Quality Control jika ditemukan barang yang tidak sesuai standar",
    "Memindahkan barang dari area penerimaan ke area staging atau karantina",
    "Memastikan semua data penerimaan barang tercatat dengan akurat dan tepat waktu"
];

export default function InboundTasksPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Inbound Task</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                        <CardDescription>Berikut adalah daftar tugas dan tanggung jawab untuk proses Inbound.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {inboundTaskJobDesc.map((task, index) => (
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
