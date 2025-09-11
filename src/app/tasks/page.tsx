
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const adminTaskJobDesc = [
    "Print Picklist & Reporting",
    "Absensi Manpower & Update Manpower",
    "Menginput OOS",
    "Monitoring & update status order (shipped, canceled, return)",
    "Rekap & follow up issue (OOS, mismatch, selisih stok)",
    "Koordinasi dengan tim picker/packer/putaway terkait kebutuhan operasional",
    "Update & maintain data SKU/product (jika ada perubahan)",
    "Support dokumentasi (foto, laporan harian, atau kebutuhan audit)",
];

export default function TasksPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Admin Task</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                        <CardDescription>Berikut adalah daftar tugas dan tanggung jawab untuk posisi Admin Task.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {adminTaskJobDesc.map((task, index) => (
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
