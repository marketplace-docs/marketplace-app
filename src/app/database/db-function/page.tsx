
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, CheckCircle, AlertTriangle } from "lucide-react";

const dbFunctions = [
    {
        name: 'get_all_batch_products',
        description: 'Menghitung dan mengagregasi semua stok produk per batch (lokasi, barcode, exp_date). Ini adalah sumber data utama untuk halaman Batch Product dan semua perhitungan stok di seluruh aplikasi. Fungsi ini sudah diamankan dengan SET search_path.',
        status: 'Active',
        version: '2.0.0'
    },
    // Add other functions here as they are created
];


export default function DbFunctionPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Database Functions (RPC)</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Fungsi Database</CardTitle>
                        <CardDescription>Berikut adalah daftar fungsi (Remote Procedure Call) yang tersimpan di database. Fungsi-fungsi ini berisi logika bisnis penting untuk menjaga performa dan konsistensi data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dbFunctions.map(func => (
                             <Card key={func.name} className="overflow-hidden">
                                <CardHeader className="flex flex-row items-start bg-muted/50 p-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-md">
                                            <Server className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-mono">{func.name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={func.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}>
                                                    {func.status === 'Active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                                                    {func.status}
                                                </Badge>
                                                 <Badge variant="outline">v{func.version}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 text-sm text-muted-foreground">
                                    {func.description}
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
