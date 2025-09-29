
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, CheckSquare, Palette, Users, Archive, BarChart3, Database, Monitor, BrainCircuit, UserCheck, KeyRound, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Supabase"];

export default function AppSettingsPage() {
    const { toast } = useToast();

    const handleClearCache = () => {
        try {
            // Clear local storage and session storage
            localStorage.clear();
            sessionStorage.clear();
            
            toast({
                title: "Cache Cleared",
                description: "Local data has been cleared. The application will now hard reload to fetch the latest data from the server.",
            });
            
            // Perform a hard reload to bypass the browser cache
            setTimeout(() => {
                window.location.reload(true);
            }, 1500);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not clear cache. Please try clearing your browser data manually.",
            });
        }
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Pengaturan Aplikasi</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Market Place</CardTitle>
                        <CardDescription>Platform terintegrasi untuk optimalisasi gudang dan manajemen tugas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                            <h3 className="font-semibold text-lg mb-2">Dokumentasi Lengkap</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Untuk informasi lebih detail mengenai arsitektur, fitur, dan panduan penggunaan, silakan kunjungi halaman dokumentasi kami.
                            </p>
                            <Button asChild>
                                <Link href="/app-documentation">
                                    Lihat Dokumentasi
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance</CardTitle>
                        <CardDescription>Actions for application maintenance and troubleshooting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">Clear Cache & Hard Reload</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                This will clear all data stored in your browser (like your login session) and force the application to download the newest version from the server. Use this to solve data inconsistencies or display errors.
                            </p>
                            <Button variant="destructive" onClick={handleClearCache}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear Cache & Hard Reload
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
