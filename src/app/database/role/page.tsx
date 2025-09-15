
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const roles = [
    { role: 'Super Admin', title: 'Akses penuh ke semua fitur, konfigurasi sistem, dan manajemen pengguna.' },
    { role: 'Manager', title: 'Akses ke laporan, analisis data, dan manajemen tim di bawahnya.' },
    { role: 'Supervisor', title: 'Kontrol operasional harian, monitoring manpower, dan manajemen tugas tim.' },
    { role: 'Captain', title: 'Memimpin tim lapangan (Picker, Packer, dll) dan memastikan target tercapai.' },
    { role: 'Admin', title: 'Akses fitur administrasi seperti input data, cetak dokumen, dan laporan dasar.' },
    { role: 'Staff', title: 'Akses terbatas pada fitur sesuai job-desk operasional (misal: hanya halaman Putaway).' },
];

export default function RolePage() {
  return (
    <MainLayout>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6">Database Role</h1>
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              A list of all the roles in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Title</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((item) => (
                  <TableRow key={item.role}>
                    <TableCell className="font-medium">{item.role}</TableCell>
                    <TableCell>{item.title}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

    