'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS } from "@/lib/constants";
import Link from "next/link";
import { Route, type LucideIcon, Warehouse, Database } from "lucide-react";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Firebase", "Supabase"];

type FeatureDescription = {
    label: string;
    icon: LucideIcon;
    description: string;
    children: {
        label: string;
        description: string;
    }[];
};

const featureDescriptions: FeatureDescription[] = [
    {
        label: "Admin Task",
        icon: NAV_LINKS.find(l => l.label === "Admin Task")!.icon,
        description: "Modul untuk mengelola tugas-tugas administratif dan sumber daya manusia harian di gudang.",
        children: [
            { label: "Create", description: "Membuat data manpower baru untuk pekerjaan spesifik." },
            { label: "Monitoring Manpower", description: "Melihat, mengedit, dan menghapus data manpower yang telah dibuat. Hanya Super Admin yang dapat melakukan modifikasi." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum untuk peran Admin." },
        ]
    },
    {
        label: "Putaway",
        icon: NAV_LINKS.find(l => l.label === "Putaway")!.icon,
        description: "Manajemen proses penerimaan dan penempatan barang ke lokasi penyimpanan di gudang. Input lokasi menggunakan dropdown untuk mencegah kesalahan ketik.",
        children: [
            { label: "Create", description: "Mencatat dokumen penerimaan barang baru secara manual (hanya Super Admin)." },
            { label: "Monitoring Document", description: "Melihat, mengedit, mengelola, dan mengunggah massal semua dokumen penerimaan barang (hanya Super Admin)." },
            { label: "Update Expired", description: "Memperbarui lokasi, tanggal kedaluwarsa, atau memecah stok (split batch) untuk produk yang sudah ada (hanya Super Admin)." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum untuk proses Putaway." },
        ]
    },
    {
        label: "Return",
        icon: NAV_LINKS.find(l => l.label === "Return")!.icon,
        description: "Mengelola proses pengembalian barang dari pelanggan atau ekspedisi.",
        children: [
            { label: "Create", description: "Mencatat dokumen retur baru (hanya Super Admin)." },
            { label: "Monitoring Document", description: "Melihat dan mengelola semua dokumen retur yang tercatat (hanya Super Admin)." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum untuk proses penanganan retur." },
        ]
    },
    {
        label: "Master Product",
        icon: NAV_LINKS.find(l => l.label === "Master Product")!.icon,
        description: "Pusat data untuk semua informasi terkait produk, stok, dan lokasi gudang.",
        children: [
            { label: "Batch Product", description: "Menampilkan data stok terkini yang diagregasi per batch (berdasarkan lokasi & tanggal kedaluwarsa)." },
            { label: "Product In", description: "Menampilkan total stok masuk (goods receipt) yang diagregasi per SKU." },
            { label: "Product Out", description: "Mencatat dan menampilkan semua data barang keluar (goods issue). Pencatatan hanya bisa oleh Super Admin." },
            { label: "Stock Log", description: "Menampilkan riwayat lengkap semua pergerakan stok (masuk, keluar, dan pembaruan internal)." },
            { label: "Location", description: "Mengelola data master semua lokasi gudang. Mendukung penambahan massal via upload CSV dengan format 'name,type'." },
        ]
    },
    {
        label: "Marketplace",
        icon: NAV_LINKS.find(l => l.label === "Marketplace")!.icon,
        description: "Mengelola toko dan operasional yang terkait dengan platform marketplace.",
        children: [
            { label: "Create", description: "Mendaftarkan toko marketplace baru (hanya Super Admin)." },
            { label: "Monitoring Store", description: "Melihat dan mengelola daftar toko yang sudah ada. Modifikasi hanya bisa oleh Super Admin." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum untuk operasional Marketplace." },
        ]
    },
    {
        label: "Reports",
        icon: NAV_LINKS.find(l => l.label === "Reports")!.icon,
        description: "Menyajikan laporan dan analisis data operasional untuk pengambilan keputusan.",
        children: [
            { label: "Backlog", description: "Menampilkan data backlog pesanan dari berbagai marketplace, lengkap dengan visualisasi grafik. Modifikasi hanya bisa oleh Super Admin." },
            { label: "Daily Performance", description: "Melihat, menambah, dan mengelola laporan kinerja harian per individu. Modifikasi hanya bisa oleh Super Admin." },
            { label: "KPI Performance", description: "Menganalisis Key Performance Indicator (KPI) tim berdasarkan data kinerja harian." },
        ]
    },
    {
        label: "Database",
        icon: NAV_LINKS.find(l => l.label === "Database")!.icon,
        description: "Modul untuk manajemen data master, pengguna, dan hak akses sistem (khusus Super Admin).",
        children: [
            { label: "User Management", description: "Mengelola data pengguna, termasuk menambah, mengedit, dan menghapus (hanya Super Admin)." },
            { label: "Role", description: "Menampilkan daftar peran (role) yang ada di dalam sistem." },
            { label: "Menu Permission", description: "Mengatur hak akses setiap pengguna terhadap menu-menu di aplikasi (hanya Super Admin)." },
            { label: "Log Activity", description: "Melihat jejak audit dari semua aktivitas penting yang terjadi di sistem." },
        ]
    }
];

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
                        <CardTitle>Penjelasan Fitur</CardTitle>
                        <CardDescription>Rincian fungsi dari setiap modul utama dalam aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {featureDescriptions.map(feature => (
                            <div key={feature.label} className="border-b pb-4 last:border-b-0">
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    <feature.icon className="h-5 w-5 text-primary" />
                                    {feature.label}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                                <ul className="space-y-2 list-disc list-inside text-sm pl-4">
                                    {feature.children.map(child => (
                                        <li key={child.label}>
                                            <span className="font-semibold">{child.label}:</span> {child.description}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
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
                             <div>
                                <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    Database Setup
                                </h3>
                                <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground pl-2">
                                    <li>
                                        <Link href="/app-documentation/database-setup" className="hover:text-primary hover:underline">
                                            Table Scripts
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
