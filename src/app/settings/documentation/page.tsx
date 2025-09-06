
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code } from "lucide-react";

export default function DocumentationPage() {
    return (
      <MainLayout>
        <div className="w-full space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dokumentasi Aplikasi</h1>
                <p className="text-muted-foreground">Panduan lengkap untuk memahami dan menggunakan dasbor Fulfillment Marketplace.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Pendahuluan</CardTitle>
                    <CardDescription>Selamat datang di dokumentasi Fulfillment Marketplace. Aplikasi ini dirancang untuk membantu Anda mengelola berbagai aspek operasional gudang dan marketplace secara efisien.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p>Aplikasi ini menyediakan fitur-fitur penting seperti manajemen absensi staf, pelaporan, pemantauan backlog pesanan, pengelolaan data pengguna, serta pengaturan aplikasi. Dokumentasi ini akan memandu Anda melalui struktur, logika, dan fungsionalitas setiap halaman.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Struktur & Logika Aplikasi</CardTitle>
                    <CardDescription>Memahami bagaimana aplikasi ini dibangun dan bekerja.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Struktur Folder</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p>Aplikasi ini menggunakan Next.js App Router. Berikut adalah struktur folder utamanya:</p>
                                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                    <li><b>/src/app</b>: Direktori utama untuk semua halaman dan rute aplikasi.</li>
                                    <li><b>/src/components</b>: Berisi semua komponen UI yang dapat digunakan kembali, seperti Tombol, Kartu, dan Tata Letak.</li>
                                    <li><b>/src/hooks</b>: Berisi custom hooks, seperti <code>useAuth</code> untuk menangani logika otentikasi.</li>
                                    <li><b>/src/lib</b>: Berisi fungsi utilitas, konstanta (seperti link navigasi), dan data awal.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Logika Otentikasi</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p>Logika otentikasi ditangani oleh <code>useAuth</code> hook yang berada di <code>/src/hooks/use-auth.tsx</code>.</p>
                                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                    <li><b>Login</b>: Proses login memvalidasi email dan password yang dimasukkan. Jika berhasil, informasi pengguna disimpan di Local Storage dan pengguna diarahkan ke halaman dasbor.</li>
                                    <li><b>Logout</b>: Menghapus data pengguna dari Local Storage dan mengarahkan kembali ke halaman login.</li>
                                    <li><b>Perlindungan Rute</b>: Komponen <code>MainLayout</code> membungkus sebagian besar halaman. Komponen ini memeriksa status login pengguna. Jika pengguna tidak login, mereka akan secara otomatis diarahkan ke halaman login, melindungi halaman-halaman internal.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Manajemen State</AccordionTrigger>
                            <AccordionContent>
                            Aplikasi ini menggunakan React Hooks (<code>useState</code>, <code>useEffect</code>, <code>useContext</code>) untuk manajemen state lokal di setiap halaman. Untuk state global seperti informasi pengguna, digunakan React Context (<code>AuthContext</code>).
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Panduan Rute Aplikasi</CardTitle>
                    <CardDescription>Penjelasan fungsionalitas dari setiap halaman yang tersedia di menu navigasi.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Menu</TableHead>
                                <TableHead>Sub-Menu</TableHead>
                                <TableHead>Fungsionalitas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Dashboard</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>Halaman utama setelah login. Saat ini berfungsi sebagai halaman selamat datang.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Tasks</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>Halaman yang dipersiapkan untuk fitur manajemen tugas di masa mendatang.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium" rowSpan={2}>Admin Marketplace</TableCell>
                                <TableCell>Absensi Manpower</TableCell>
                                <TableCell>Mengelola jadwal dan kehadiran staf. Anda dapat menambah, mengedit, mengurutkan, dan mencetak jadwal staf. Fitur impor & ekspor data via CSV juga tersedia.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Reports</TableCell>
                                <TableCell>Membuat dan mengelola laporan admin picklist, dipisahkan berdasarkan tipe (Instan/Reguler).</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Backlog</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>Menampilkan data backlog dari berbagai marketplace dalam bentuk tabel dan grafik. Memungkinkan impor/ekspor dan pengeditan data.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium" rowSpan={3}>Database</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Mengelola data pengguna. Anda dapat melihat, mengedit, dan menghapus pengguna dari sistem.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Role</TableCell>
                                <TableCell>Menampilkan daftar peran (role) yang ada di dalam sistem, seperti Super Admin dan Admin.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Log Activity</TableCell>
                                <TableCell>Menampilkan log atau catatan dari semua aktivitas penting yang terjadi di dalam aplikasi.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium" rowSpan={2}>Settings</TableCell>
                                <TableCell>APP</TableCell>
                                <TableCell>Halaman untuk mengatur preferensi aplikasi seperti profil pengguna, notifikasi, dan tema.</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Documentation</TableCell>
                                <TableCell>Halaman yang sedang Anda lihat saat ini, berisi panduan penggunaan aplikasi.</TableCell>
                            </TableRow>
                        </TableBody>
                   </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pertanyaan Umum (FAQ)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Bagaimana cara saya login?</AccordionTrigger>
                            <AccordionContent>
                            Gunakan salah satu email yang terdaftar (contoh: arlan.saputra@marketplace.com) dengan password 'Marketplace@123!!!'.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Bagaimana cara mengelola pengguna?</AccordionTrigger>
                            <AccordionContent>
                            Arahkan ke menu 'Database', lalu pilih 'User'. Di sana Anda dapat melihat, mengedit, dan menghapus pengguna.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Bisakah saya mengekspor data?</AccordionTrigger>
                            <AccordionContent>
                            Ya, di halaman seperti 'Backlog' dan 'Absensi Manpower', terdapat tombol 'Export' untuk mengunduh data dalam format CSV.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

        </div>
      </MainLayout>
    )
}

    