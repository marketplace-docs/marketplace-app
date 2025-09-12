
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS } from "@/lib/constants";
import Link from "next/link";
import { Route } from "lucide-react";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Firebase"];

export default function AppDocumentationPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Dokumentasi Aplikasi</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Tentang Aplikasi</CardTitle>
                        <CardDescription>Informasi umum mengenai platform Market Place.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Aplikasi <span className="font-semibold text-primary">Market Place</span> adalah sebuah platform terintegrasi yang dirancang untuk melakukan optimalisasi proses gudang dan manajemen tugas secara efisien. Dibuat untuk menyederhanakan alur kerja, meningkatkan produktivitas, dan memberikan visibilitas penuh terhadap operasional harian.</p>
                        <p>Dibuat dan dikembangkan oleh: <span className="font-semibold text-primary">Arlan Saputra</span>.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tumpukan Teknologi</CardTitle>
                        <CardDescription>Framework dan teknologi yang menjadi fondasi aplikasi ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {techStack.map(tech => (
                                <Badge key={tech} variant="secondary" className="text-sm px-3 py-1">{tech}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Struktur Rute & Fitur Aplikasi</CardTitle>
                        <CardDescription>Berikut adalah daftar semua rute dan fitur yang tersedia dalam aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {NAV_LINKS.map(link => (
                                <div key={link.label}>
                                    <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
                                        <link.icon className="h-5 w-5 text-primary" />
                                        {link.label}
                                    </h3>
                                    {link.children ? (
                                        <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground pl-2">
                                            {link.children.map(child => (
                                                <li key={child.label}>
                                                    <Link href={child.href} className="hover:text-primary hover:underline">
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground pl-4">Rute utama tanpa submenu.</p>
                                    )}
                                </div>
                            ))}
                             <div>
                                <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
                                    <Route className="h-5 w-5 text-primary" />
                                    API Routes
                                </h3>
                                <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground pl-2">
                                    <li>
                                        <Link href="/app-documentation/api-routes" className="hover:text-primary hover:underline">
                                            API Documentation
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
