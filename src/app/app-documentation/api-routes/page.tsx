
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const apiRoutes = [
    {
        category: "Manajemen Pengguna (Users)",
        endpoints: [
            { method: "GET", path: "/api/users", description: "Mengambil daftar semua pengguna." },
            { method: "POST", path: "/api/users", description: "Membuat pengguna baru." },
            { method: "PATCH", path: "/api/users/[id]", description: "Memperbarui pengguna yang ada." },
            { method: "DELETE", path: "/api/users/[id]", description: "Menghapus pengguna." },
        ]
    },
    {
        category: "Tugas Admin (Admin Tasks)",
        endpoints: [
            { method: "GET", path: "/api/admin-tasks", description: "Mengambil semua tugas admin." },
            { method: "POST", path: "/api/admin-tasks", description: "Membuat tugas admin baru." },
            { method: "PATCH", path: "/api/admin-tasks/[id]", description: "Memperbarui tugas admin." },
            { method: "DELETE", path: "/api/admin-tasks/[id]", description: "Menghapus tugas admin." },
        ]
    },
    {
        category: "Backlog Marketplace",
        endpoints: [
            { method: "GET", path: "/api/backlog-items", description: "Mengambil semua item backlog." },
            { method: "POST", path: "/api/backlog-items", description: "Membuat item backlog baru (tunggal atau massal)." },
            { method: "PATCH", path: "/api/backlog-items/[id]", description: "Memperbarui item backlog." },
            { method: "DELETE", path: "/api/backlog-items/[id]", description: "Menghapus item backlog." },
        ]
    },
    {
        category: "Kinerja Harian (Daily Performance)",
        endpoints: [
            { method: "GET", path: "/api/daily-performance", description: "Mengambil data kinerja dengan filter." },
            { method: "POST", path: "/api/daily-performance", description: "Membuat entri kinerja baru (tunggal atau massal)." },
            { method: "PATCH", path: "/api/daily-performance", description: "Memperbarui beberapa entri kinerja sekaligus." },
            { method: "DELETE", path: "/api/daily-performance/[id]", description: "Menghapus entri kinerja." },
        ]
    },
     {
        category: "Data Master Lokasi",
        endpoints: [
            { method: "GET", path: "/api/locations", description: "Mengambil semua data lokasi gudang." },
            { method: "POST", path: "/api/locations", description: "Menambahkan lokasi baru (massal atau tunggal). Memerlukan hak akses Admin atau lebih tinggi." },
        ]
    },
    {
        category: "Toko Marketplace (Marketplace Stores)",
        endpoints: [
            { method: "GET", path: "/api/marketplace-stores", description: "Mengambil semua toko marketplace." },
            { method: "POST", path: "/api/marketplace-stores", description: "Membuat toko baru (tunggal atau massal)." },
            { method: "PATCH", path: "/api/marketplace-stores/[id]", description: "Memperbarui toko." },
            { method: "DELETE", path: "/api/marketplace-stores/[id]", description: "Menghapus toko." },
        ]
    },
    {
        category: "Dokumen Putaway (Goods Receipt)",
        endpoints: [
            { method: "GET", path: "/api/putaway-documents", description: "Mengambil semua dokumen putaway." },
            { method: "POST", path: "/api/putaway-documents", description: "Membuat dokumen putaway baru (tunggal atau massal)." },
            { method: "PATCH", path: "/api/putaway-documents/[id]", description: "Memperbarui dokumen putaway." },
            { method: "DELETE", path: "/api/putaway-documents/[id]", description: "Menghapus dokumen putaway." },
        ]
    },
    {
        category: "Dokumen Product Out (Goods Issue)",
        endpoints: [
            { method: "GET", path: "/api/product-out-documents", description: "Mengambil semua dokumen product out." },
            { method: "POST", path: "/api/product-out-documents", description: "Membuat dokumen product out baru (tunggal atau massal)." },
        ]
    },
     {
        category: "Dokumen Retur (Return Documents)",
        endpoints: [
            { method: "GET", path: "/api/return-documents", description: "Mengambil semua dokumen retur." },
            { method: "POST", path: "/api/return-documents", description: "Membuat dokumen retur baru (tunggal atau massal)." },
            { method: "PATCH", path: "/api/return-documents/[id]", description: "Memperbarui dokumen retur." },
            { method: "DELETE", path: "/api/return-documents/[id]", description: "Menghapus dokumen retur." },
        ]
    },
    {
        category: "Master Product & Stok",
        endpoints: [
            { method: "GET", path: "/api/master-product/batch-products", description: "Mengambil data stok agregat dari semua pergerakan barang." },
        ]
    },
    {
        category: "Manajemen Akses & Log",
        endpoints: [
            { method: "GET", path: "/api/menu-permissions/[userId]", description: "Mengambil hak akses menu untuk pengguna tertentu." },
            { method: "POST", path: "/api/menu-permissions", description: "Menyimpan atau memperbarui hak akses menu pengguna." },
            { method: "GET", path: "/api/log-activity", description: "Mengambil semua catatan aktivitas sistem." },
        ]
    },
];

const getMethodVariant = (method: string) => {
    switch (method) {
        case 'GET': return 'bg-blue-600 hover:bg-blue-600/90';
        case 'POST': return 'bg-green-600 hover:bg-green-600/90';
        case 'PATCH': return 'bg-yellow-500 hover:bg-yellow-500/90';
        case 'DELETE': return 'bg-red-600 hover:bg-red-600/90';
        default: return 'bg-gray-500 hover:bg-gray-500/90';
    }
}


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
                        <p>Semua respons API dikembalikan dalam format JSON. Setiap permintaan yang mengubah data (POST, PATCH, DELETE) akan secara otomatis dicatat dalam Log Aktivitas.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Rute API</CardTitle>
                        <CardDescription>Endpoint yang tersedia saat ini, dikelompokkan berdasarkan sumber daya.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                           {apiRoutes.map(category => (
                               <div key={category.category} className="border-b pb-4 last:border-b-0">
                                    <h3 className="text-lg font-semibold mb-3">{category.category}</h3>
                                    <div className="space-y-2">
                                    {category.endpoints.map(endpoint => (
                                        <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-3">
                                            <Badge variant="default" className={getMethodVariant(endpoint.method)}>{endpoint.method}</Badge>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint.path}</code>
                                            <span className="text-sm text-muted-foreground">- {endpoint.description}</span>
                                        </div>
                                    ))}
                                    </div>
                               </div>
                           ))}
                            <p className="text-sm text-muted-foreground text-center pt-4">Dokumentasi API akan diperbarui seiring dengan pengembangan fitur.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
