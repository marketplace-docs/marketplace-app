
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
    { role: 'Super Admin', title: 'Akses penuh, bisa manage semua user, role, permission, dan konfigurasi sistem.' },
    { role: 'Admin / Leader', title: 'Bisa mengatur tim, monitoring task, approval tertentu, tapi tidak bisa ubah konfigurasi global.' },
    { role: 'Supervisor', title: 'Kontrol operasional harian, monitoring manpower, report, task management.' },
    { role: 'Operator / Staff', title: 'Hanya bisa akses fitur sesuai job role (misalnya input OOS, print picklist, update status).' },
    { role: 'Viewer / Auditor', title: 'Hanya bisa melihat data & laporan tanpa bisa mengubah.' },
    { role: 'CX / Return Handler', title: 'Khusus menangani klaim barang, damaged/lost, komunikasi ke customer.' },
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
