
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS } from "@/lib/constants";
import Link from "next/link";
import { Route, type LucideIcon } from "lucide-react";

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
            { label: "Monitoring Manpower", description: "Melihat, mengedit, dan menghapus data manpower yang telah dibuat. Hak akses disesuaikan per peran." },
            { label: "Task", description: "Dasbor operasional yang menampilkan ringkasan semua tugas gudang yang tertunda (pending), seperti Putaway dan Cycle Count." },
        ]
    },
    {
        label: "Putaway",
        icon: NAV_LINKS.find(l => l.label === "Putaway")!.icon,
        description: "Manajemen proses penerimaan dan penempatan barang ke lokasi penyimpanan di gudang.",
        children: [
            { label: "Create", description: "Mencatat dokumen penerimaan barang baru, mendukung input massal via CSV." },
            { label: "Monitoring Document", description: "Melihat, mengedit, dan mengelola semua dokumen penerimaan barang." },
            { label: "Go-Putaway", description: "Fitur untuk memindahkan stok antar lokasi gudang dengan cepat dan akurat." },
            { label: "Update Expired", description: "Memperbarui lokasi, tanggal kedaluwarsa, atau memecah stok (split batch) untuk produk yang sudah ada." },
            { label: "Task", description: "Menampilkan daftar dokumen putaway yang statusnya masih 'Pending' dan memerlukan tindakan segera." },
        ]
    },
    {
        label: "Return",
        icon: NAV_LINKS.find(l => l.label === "Return")!.icon,
        description: "Mengelola proses pengembalian barang dari pelanggan atau ekspedisi.",
        children: [
            { label: "Create", description: "Mencatat dokumen retur baru." },
            { label: "Monitoring Document", description: "Melihat dan mengelola semua dokumen retur yang tercatat." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum untuk proses penanganan retur." },
        ]
    },
    {
        label: "Cycle Count",
        icon: NAV_LINKS.find(l => l.label === "Cycle Count")!.icon,
        description: "Modul lengkap untuk manajemen stok opname (Cycle Count) dengan alur kerja terstruktur.",
        children: [
            { label: "Create", description: "Membuat tugas cycle count baru berdasarkan filter SKU, brand, lokasi, dll., lalu menugaskannya ke 'Person In Charge'." },
            { label: "CC Location", description: "Fitur cepat untuk melakukan hitungan fisik langsung di sebuah lokasi. Hasilnya akan menjadi dokumen baru yang perlu divalidasi." },
            { label: "Monitoring Cycle Count", description: "Memantau semua dokumen cycle count (Pending, In Progress, Completed). Dari sini, atasan dapat melakukan validasi hasil hitungan." },
            { label: "Task", description: "Halaman khusus untuk 'penghitung' (counter) untuk melihat semua tugas cycle count yang ditugaskan kepada mereka." },
        ]
    },
    {
        label: "e-Commerce",
        icon: NAV_LINKS.find(l => l.label === "e-Commerce")!.icon,
        description: "Mengelola seluruh alur kerja pesanan dari marketplace, mulai dari pesanan masuk hingga barang keluar dari gudang.",
        children: [
            { label: "My Orders", description: "Mengelola pesanan manual, mengunggah pesanan via CSV, dan membuat 'wave' untuk diproses oleh tim picker." },
            { label: "Monitoring Orders", description: "Memantau status semua 'wave' yang telah dibuat (Wave Progress, Wave Done), melihat detail pesanan di dalamnya, dan membatalkan wave." },
            { label: "Go-Picker", description: "Fitur untuk tim picker. Memindai pesanan, mengambil barang dari lokasi, dan mengonfirmasi pengambilan yang secara otomatis memotong stok." },
            { label: "Outbound", description: "Stasiun kerja untuk tim packer. Memindai pesanan yang sudah di-pick, memverifikasi detail, dan mengonfirmasi bahwa pesanan sudah dikemas." },
            { label: "Outbound Monitoring", description: "Melihat riwayat lengkap semua pesanan yang telah di-pick dan di-pack, termasuk siapa yang mengerjakan dan kapan." },
            { label: "Out of Stock", description: "Pusat manajemen untuk pesanan yang tidak dapat dipenuhi (OOS). Memungkinkan admin mengirim kembali pesanan ke antrian packing atau menghapusnya." },
        ]
    },
    {
        label: "Master Product",
        icon: NAV_LINKS.find(l => l.label === "Master Product")!.icon,
        description: "Pusat data untuk semua informasi terkait produk, stok, dan lokasi gudang.",
        children: [
            { label: "Batch Product", description: "Menampilkan data stok terkini yang diagregasi per batch (berdasarkan lokasi & tanggal kedaluwarsa)." },
            { label: "Stock In", description: "Menampilkan riwayat lengkap semua barang yang masuk ke gudang (goods receipt)." },
            { label: "Stock Log", description: "Menampilkan riwayat lengkap semua pergerakan stok (masuk, keluar, dan pembaruan internal)." },
            { label: "Location", description: "Mengelola data master semua lokasi gudang. Mendukung penambahan massal via upload CSV." },
        ]
    },
    {
        label: "Marketplace",
        icon: NAV_LINKS.find(l => l.label === "Marketplace")!.icon,
        description: "Mengelola toko dan operasional yang terkait dengan platform marketplace.",
        children: [
            { label: "Create", description: "Mendaftarkan toko marketplace baru." },
            { label: "Monitoring Store", description: "Melihat dan mengelola daftar toko yang sudah ada." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum untuk operasional Marketplace." },
        ]
    },
    {
        label: "Reports",
        icon: NAV_LINKS.find(l => l.label === "Reports")!.icon,
        description: "Menyajikan laporan dan analisis data operasional untuk pengambilan keputusan.",
        children: [
            { label: "Backlog", description: "Menampilkan data backlog pesanan dari berbagai marketplace, lengkap dengan visualisasi grafik." },
            { label: "Daily Performance", description: "Melihat, menambah, dan mengelola laporan kinerja harian per individu." },
            { label: "KPI Performance", description: "Menganalisis Key Performance Indicator (KPI) tim berdasarkan data kinerja harian." },
        ]
    },
    {
        label: "Database",
        icon: NAV_LINKS.find(l => l.label === "Database")!.icon,
        description: "Modul untuk manajemen data master, pengguna, dan hak akses sistem.",
        children: [
             { label: "Master Product", description: "Mengelola data master produk, mendukung upload massal via CSV." },
            { label: "User Management", description: "Mengelola data pengguna, termasuk menambah, mengedit (Super Admin bisa mengubah Role), dan menghapus (hanya Super Admin)." },
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
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

    
