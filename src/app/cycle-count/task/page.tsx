
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const cycleCountTasks = [
    "Melakukan perhitungan stok fisik produk sesuai dengan lokasi yang telah ditentukan (Cycle Count Location).",
    "Membandingkan hasil perhitungan fisik dengan data stok yang ada di dalam sistem.",
    "Mengidentifikasi dan mencatat adanya selisih (discrepancy) antara stok fisik dan stok sistem.",
    "Membuat laporan hasil cycle count dan melaporkannya kepada Supervisor atau Manajer Gudang.",
    "Berkoordinasi dengan tim lain untuk melakukan investigasi jika ditemukan selisih yang signifikan.",
    "Membantu melakukan penyesuaian (adjustment) stok di sistem setelah hasil cycle count divalidasi.",
    "Memastikan semua aktivitas cycle count dilakukan sesuai dengan prosedur standar (SOP) untuk menjaga akurasi.",
];

export default function CycleCountTaskPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Cycle Count Task</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                        <CardDescription>Cycle Count (CC) adalah proses melakukan perhitungan stok sesuai dengan kebutuhan produk yang ada di lokasi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {cycleCountTasks.map((task, index) => (
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
