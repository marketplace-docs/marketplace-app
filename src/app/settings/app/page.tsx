
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, CheckSquare, Palette, Users, Archive, BarChart3, Database, Monitor, BrainCircuit, UserCheck, KeyRound } from "lucide-react";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Firebase"];

export default function AppSettingsPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Dokumentasi Aplikasi</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Market Place</CardTitle>
                        <CardDescription>Platform terintegrasi untuk optimalisasi gudang dan manajemen tugas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Fitur Utama</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <BrainCircuit className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Prioritas Tugas Cerdas:</span> Menggunakan AI untuk memprioritaskan tugas berdasarkan tenggat waktu, dependensi, dan ketersediaan sumber daya.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <UserCheck className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Penugasan Real-time:</span> Secara dinamis menugaskan pekerjaan kepada staf gudang berdasarkan beban kerja dan keahlian mereka.</span>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <KeyRound className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Autentikasi Pengguna:</span> Sistem autentikasi yang aman untuk mengelola profil pengguna dan hak akses secara terpusat.</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Panduan Gaya</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#3F51B5' }} />
                                    <span><span className="font-semibold">Warna Primer:</span> Biru kuat (#3F51B5) untuk melambangkan kepercayaan dan efisiensi.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#EEEEEE', border: '1px solid #ccc' }} />
                                    <span><span className="font-semibold">Warna Latar:</span> Abu-abu muda (#EEEEEE) untuk tampilan yang bersih dan profesional.</span>
                                </li>
                                 <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#9FA8DA' }} />
                                    <span><span className="font-semibold">Warna Aksen:</span> Ungu lembut (#9FA8DA) untuk sentuhan modern yang elegan.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Palette className="h-4 w-4 text-primary flex-shrink-0" />
                                    <span><span className="font-semibold">Font:</span> 'PT Sans' untuk nuansa modern namun tetap hangat dan mudah dibaca.</span>
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
