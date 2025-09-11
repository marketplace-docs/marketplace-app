
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, CheckSquare, Palette, Users, Archive, BarChart3, Database } from "lucide-react";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Firebase"];

export default function AppSettingsPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Dokumentasi Aplikasi</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Market Place</CardTitle>
                        <CardDescription>Platform terintegrasi untuk optimisasi gudang dan manajemen tugas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Fitur Utama</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <ListTodo className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Manajemen Tugas Admin & Putaway:</span> Memungkinkan pembuatan, pemantauan, dan pengelolaan tugas untuk staf admin dan tim putaway secara efisien.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Archive className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Manajemen Backlog Marketplace:</span> Mengelola dan memvisualisasikan data backlog dari berbagai marketplace untuk analisis dan pengambilan keputusan.</span>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <BarChart3 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Laporan Kinerja:</span> Menyediakan laporan harian dan KPI untuk memantau produktivitas dan efektivitas operasional.</span>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <Database className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Manajemen Data Master:</span> Kontrol terpusat untuk mengelola pengguna, peran, akses menu, dan melihat log aktivitas sistem.</span>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Autentikasi Pengguna:</span> Sistem autentikasi yang aman untuk mengelola profil pengguna dan hak akses.</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Panduan Gaya</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                                    <span><span className="font-semibold">Warna Primer:</span> Biru tua untuk menonjolkan kepercayaan dan efisiensi.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'hsl(var(--background))', border: '1px solid #ccc' }} />
                                    <span><span className="font-semibold">Warna Latar:</span> Abu-abu muda untuk tampilan yang bersih dan profesional.</span>
                                </li>
                                 <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))' }} />
                                    <span><span className="font-semibold">Warna Aksen:</span> Ungu lembut untuk sentuhan kecanggihan.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Palette className="h-4 w-4 text-primary flex-shrink-0" />
                                    <span><span className="font-semibold">Font:</span> 'PT Sans' untuk nuansa modern namun tetap hangat.</span>
                                </li>
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">Tumpukan Teknologi</h3>
                            <div className="flex flex-wrap gap-2">
                                {techStack.map(tech => (
                                    <Badge key={tech} variant="secondary">{tech}</Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
