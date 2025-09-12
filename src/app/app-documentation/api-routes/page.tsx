
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ApiRoutesPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Dokumentasi Rute API</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Pengantar API</CardTitle>
                        <CardDescription>Berikut adalah daftar rute API yang tersedia untuk berinteraksi dengan aplikasi Market Place.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>API ini memungkinkan Anda untuk mengelola sumber daya secara terprogram. Gunakan endpoint di bawah ini untuk membuat, membaca, memperbarui, dan menghapus data.</p>
                        <p>Semua respons API dikembalikan dalam format JSON.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Rute API</CardTitle>
                        <CardDescription>Endpoint yang tersedia saat ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                           <div className="border-b pb-4">
                                <h3 className="font-semibold">Manajemen Pengguna</h3>
                                <div className="flex items-center gap-2 mt-2">
                                     <Badge variant="default" className="bg-blue-600">GET</Badge>
                                     <code>/api/users</code>
                                     <span className="text-sm text-muted-foreground">- Mengambil daftar semua pengguna.</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                     <Badge variant="default" className="bg-green-600">POST</Badge>
                                     <code>/api/users</code>
                                     <span className="text-sm text-muted-foreground">- Membuat pengguna baru.</span>
                                </div>
                           </div>
                            <p className="text-sm text-muted-foreground text-center pt-4">Dokumentasi API akan diperbarui seiring dengan pengembangan fitur.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
