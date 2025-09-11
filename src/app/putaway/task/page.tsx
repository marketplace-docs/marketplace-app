
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const putawayTaskJobDesc = [
    "Menerima & memverifikasi barang masuk sesuai dokumen pengiriman",
    "Melakukan scanning barcode barang untuk update sistem inventaris",
    "Menempatkan barang ke lokasi penyimpanan (rak) yang telah ditentukan",
    "Memastikan penempatan barang sesuai dengan prinsip FEFO/FIFO",
    "Menjaga kebersihan dan kerapihan area penyimpanan",
    "Melaporkan setiap kerusakan atau ketidaksesuaian barang yang diterima",
    "Berkoordinasi dengan tim inbound & admin gudang",
    "Mengoperasikan alat bantu seperti hand pallet atau forklift dengan aman",
];

export default function PutawayTasksPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Putaway Task</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                        <CardDescription>Berikut adalah daftar tugas dan tanggung jawab untuk proses Putaway.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {putawayTaskJobDesc.map((task, index) => (
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
