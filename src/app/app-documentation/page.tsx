
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS } from "@/lib/constants";
import Link from "next/link";
import { Route, type LucideIcon, ArrowLeftRight } from "lucide-react";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Supabase"];

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
            { label: "Create", description: "Membuat data manpower baru untuk pekerjaan spesifik, seperti Leader, Putaway, Picker, Packer, dll." },
            { label: "Monitoring Manpower", description: "Melihat, mengedit, dan menghapus data manpower yang telah dibuat. Dilengkapi fitur cetak dan hak akses yang disesuaikan per peran pengguna." },
            { label: "Task", description: "Dasbor operasional yang menampilkan ringkasan semua tugas gudang yang tertunda (pending), seperti dokumen Putaway yang belum selesai dan tugas Cycle Count yang menunggu validasi." },
        ]
    },
     {
        label: "Inbound",
        icon: NAV_LINKS.find(l => l.label === "Inbound")!.icon,
        description: "Manajemen proses penerimaan barang dari supplier atau entitas eksternal lainnya, memastikan data tercatat akurat sebelum masuk ke gudang.",
        children: [
            { label: "Create", description: "Membuat dokumen penerimaan (inbound) baru. Fitur ini memungkinkan pencarian data produk via SKU/Barcode untuk pengisian otomatis dan menambahkan beberapa item ke dalam satu dokumen." },
            { label: "Monitoring", description: "Memantau semua dokumen inbound, melihat detail progres putaway untuk setiap item, termasuk durasi dan kuantitas yang sudah selesai ditempatkan di lokasi penyimpanan." },
            { label: "Task", description: "Menampilkan daftar dokumen inbound yang statusnya masih 'Assign' dan memerlukan tindakan putaway segera." },
            { label: "Transfer From Vendor", description: "Fitur khusus untuk mencatat penerimaan barang yang berasal dari transfer vendor, memisahkannya dari alur inbound reguler." },
        ]
    },
    {
        label: "Putaway",
        icon: NAV_LINKS.find(l => l.label === "Putaway")!.icon,
        description: "Manajemen proses penempatan barang dari area penerimaan (staging) ke lokasi penyimpanan definitif di gudang. Alur kerja ini memastikan setiap barang tercatat di lokasi yang benar.",
        children: [
            { label: "Go-Putaway", description: "Fitur untuk operator gudang. Scan dokumen inbound, verifikasi produk, lalu scan lokasi tujuan untuk menyelesaikan proses putaway secara akurat dan efisien." },
            { label: "Monitoring", description: "Melihat riwayat lengkap semua dokumen putaway yang telah selesai, termasuk detail pergerakan barang dari dokumen sumber ke lokasi tujuan, serta siapa yang mengerjakannya." },
             { label: "Task", description: "Menampilkan daftar tugas putaway yang statusnya masih 'Pending' dan memerlukan tindakan segera oleh operator." },
        ]
    },
    {
        label: "Return",
        icon: NAV_LINKS.find(l => l.label === "Return")!.icon,
        description: "Mengelola proses pengembalian barang dari pelanggan atau ekspedisi, memastikan setiap item retur terdokumentasi dengan baik.",
        children: [
            { label: "Create", description: "Mencatat dokumen retur baru dengan detail lengkap seperti nomor dokumen, SKU, alasan retur, dan penerima." },
            { label: "Monitoring", description: "Melihat, mengedit, dan menghapus semua dokumen retur yang tercatat. Dilengkapi fitur upload dan export massal via CSV." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum dan panduan kerja untuk tim yang menangani proses retur barang." },
        ]
    },
    {
        label: "Cycle Count",
        icon: NAV_LINKS.find(l => l.label === "Cycle Count")!.icon,
        description: "Modul lengkap untuk manajemen stock opname (Cycle Count) dengan alur kerja terstruktur untuk memastikan akurasi data stok.",
        children: [
            { label: "Create", description: "Membuat tugas cycle count baru berdasarkan filter SKU, brand, atau lokasi, lalu menugaskannya ke 'Person In Charge' dengan batas waktu." },
            { label: "CC Location", description: "Fitur cepat untuk melakukan hitungan fisik langsung di sebuah lokasi. Hasilnya akan menjadi dokumen baru yang perlu divalidasi oleh atasan." },
            { label: "Monitoring Cycle Count", description: "Memantau semua dokumen cycle count (Pending, In Progress, Completed). Dari sini, atasan dapat melihat detail hitungan dan melakukan validasi." },
            { label: "Task", description: "Halaman khusus untuk 'penghitung' (counter) untuk melihat semua tugas cycle count yang ditugaskan kepada mereka dan yang statusnya masih aktif." },
        ]
    },
     {
        label: "e-Commerce",
        icon: NAV_LINKS.find(l => l.label === "e-Commerce")!.icon,
        description: "Mengelola seluruh alur kerja pesanan dari marketplace, mulai dari pesanan masuk, proses picking & packing, hingga barang keluar dari gudang.",
        children: [
            { label: "My Orders", description: "Pusat pengelolaan pesanan manual. Memungkinkan filter OOS, filter SKU sama, upload pesanan massal via CSV, dan yang terpenting, membuat 'wave' (maks. 150 order) untuk diproses tim picker." },
            { label: "Monitoring Orders", description: "Memantau status semua 'wave' (progress, done), melihat detail pesanan di dalamnya, membatalkan wave (rollback otomatis), dan mencetak picklist per-wave." },
            { label: "Reprint-Label", description: "Fitur khusus untuk mencetak ulang label pengiriman jika terjadi kerusakan atau kehilangan." },
            { label: "Go-Picker", description: "Alur kerja terpemandu untuk picker dengan validasi scan (order, lokasi, produk) untuk akurasi maksimal dan mencegah kesalahan pengambilan barang." },
            { label: "Out of Stock", description: "Pusat manajemen untuk pesanan yang tidak dapat dipenuhi (OOS). Memungkinkan admin mengirim pesanan langsung ke proses packing dari lokasi alternatif atau melaporkannya ke CS." },
            { label: "Outbound", description: "Stasiun kerja untuk tim packer. Memvalidasi produk dan kemasan via scan sebelum mencetak label pengiriman, memastikan tidak ada barang yang tertukar." },
             { label: "Outbound Monitoring", description: "Melihat riwayat lengkap semua pesanan yang telah di-pick dan di-pack, termasuk siapa yang mengerjakan dan kapan." },
            { label: "Dispatcher", description: "Stasiun kerja tim logistik. Memindai paket, menimbang berat, dan mengubah status menjadi 'Shipped' atau 'Delivered' sebagai konfirmasi pengiriman." },
             { label: "Shipment Monitoring", description: "Melihat riwayat semua paket yang telah dikirim (Shipped) atau telah sampai di tujuan (Delivered)." },
             { label: "Handover 3PL", description: "Fitur serah terima massal ke kurir (3PL). Scan banyak paket sekaligus untuk mengubah statusnya menjadi 'Delivered' secara efisien." },
        ]
    },
     {
        label: "Batch Product",
        icon: NAV_LINKS.find(l => l.label === "Batch Product")!.icon,
        description: "Pusat data untuk semua informasi terkait produk, stok, dan lokasi gudang. Memberikan visibilitas penuh terhadap inventaris.",
        children: [
            { label: "Product Stock", description: "Menampilkan data stok terkini yang diagregasi per batch (berdasarkan SKU, lokasi & tanggal kedaluwarsa). Dilengkapi fitur untuk mengatasi anomali stok negatif." },
            { label: "Stock Log", description: "Menampilkan riwayat lengkap semua pergerakan stok (masuk, keluar, dan penyesuaian internal) dengan detail kuantitas sebelum dan sesudah transaksi." },
            { label: "Location", description: "Mengelola data master semua lokasi gudang, termasuk tipe lokasi. Mendukung penambahan lokasi baru secara massal via upload CSV." },
        ]
    },
     {
        label: "Internal Transfer",
        icon: NAV_LINKS.find(l => l.label === "Internal Transfer")!.icon,
        description: "Modul untuk memindahkan stok antar lokasi internal atau antara gudang dan entitas lain seperti B2B dan B2C.",
        children: [
            { label: "Transfer From Warehouse", description: "Memindahkan stok dari satu lokasi penyimpanan ke lokasi lain di dalam gudang secara terstruktur." },
            { label: "Transfer From B2B", description: "Mentransfer stok yang dialokasikan untuk B2B ke lokasi lain di gudang, misalnya untuk kebutuhan B2C." },
            { label: "Transfer From B2C", description: "Mentransfer stok yang dialokasikan untuk B2C (jual umum) ke lokasi lain, misalnya untuk alokasi B2B." },
            { label: "Monitoring", description: "Melihat riwayat lengkap semua transaksi internal transfer yang pernah terjadi, baik masuk maupun keluar." },
        ]
    },
    {
        label: "Marketplace",
        icon: NAV_LINKS.find(l => l.label === "Marketplace")!.icon,
        description: "Mengelola toko dan operasional yang terkait dengan platform marketplace.",
        children: [
            { label: "Create", description: "Mendaftarkan toko marketplace baru ke dalam sistem." },
            { label: "Monitoring Store", description: "Melihat, mengedit, menghapus, serta mengelola daftar toko yang sudah ada, dengan fitur upload dan export massal." },
            { label: "Task", description: "Menampilkan daftar tanggung jawab umum dan panduan kerja untuk tim operasional Marketplace." },
            { label: "Sync", description: "Menarik data pesanan secara otomatis dari platform terhubung (Shopee, Lazada, Tiktok) yang statusnya 'Siap Dikirim' dan memasukkannya ke antrian 'My Orders'." }
        ]
    },
    {
        label: "Reports",
        icon: NAV_LINKS.find(l => l.label === "Reports")!.icon,
        description: "Menyajikan laporan dan analisis data operasional untuk pengambilan keputusan.",
        children: [
            { label: "Backlog", description: "Menampilkan data backlog pesanan dari berbagai marketplace, lengkap dengan visualisasi grafik untuk analisis tren." },
            { label: "Daily Performance", description: "Melihat, menambah, dan mengelola laporan kinerja harian per individu, dengan fitur upload dan edit massal." },
            { label: "KPI Performance", description: "Menganalisis Key Performance Indicator (KPI) tim berdasarkan data kinerja harian yang sudah terinput, lengkap dengan visualisasi data." },
        ]
    },
    {
        label: "Database",
        icon: NAV_LINKS.find(l => l.label === "Database")!.icon,
        description: "Modul untuk manajemen data master, pengguna, dan hak akses sistem. Pusat kontrol untuk admin.",
        children: [
             { label: "Master Product", description: "Mengelola data induk produk, mendukung upload massal via CSV untuk efisiensi input data." },
            { label: "User Management", description: "Mengelola data pengguna, termasuk menambah, mengedit (Super Admin bisa mengubah Role), dan menghapus (hanya Super Admin)." },
            { label: "Role", description: "Menampilkan daftar peran (role) yang ada di dalam sistem beserta penjelasannya." },
            { label: "Menu Permission", description: "Fitur eksklusif Super Admin untuk mengatur hak akses setiap pengguna terhadap menu-menu di aplikasi." },
            { label: "Log Activity", description: "Melihat jejak audit dari semua aktivitas penting yang terjadi di sistem, seperti login, logout, create, update, dan delete data." },
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
                                        {link.icon && <link.icon className="h-5 w-5 text-primary" />}
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
