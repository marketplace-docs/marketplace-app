'use client';

import React from 'react';
import type { Leader, Staff } from './page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PrintableScheduleProps {
  leaders: Leader[];
  staff: Staff[];
}

export function PrintableSchedule({ leaders, staff }: PrintableScheduleProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-10 bg-white text-black">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Fulfillment Marketplace</h1>
        <p className="text-lg">Absensi Marketplace, {currentDate}</p>
      </div>

      <div className="mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-700 hover:bg-indigo-700">
              <TableHead className="text-white font-bold w-1/3">Jabatan</TableHead>
              <TableHead className="text-white font-bold">Nama</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaders.map((leader) => (
              <TableRow key={leader.role} className="even:bg-gray-100">
                <TableCell className="font-medium">{leader.role}</TableCell>
                <TableCell>{leader.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mb-12">
        <Table>
            <TableHeader>
                <TableRow className="bg-indigo-500 hover:bg-indigo-500">
                    <TableHead className="text-white font-bold">Name</TableHead>
                    <TableHead className="text-white font-bold">Job</TableHead>
                    <TableHead className="text-white font-bold">Shift</TableHead>
                    <TableHead className="text-white font-bold">Time Work</TableHead>
                    <TableHead className="text-white font-bold">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {staff.map((person) => (
                    <TableRow key={person.id}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.job}</TableCell>
                        <TableCell>{person.shift}</TableCell>
                        <TableCell>{person.time}</TableCell>
                        <TableCell>{person.status}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mt-20">
        <div>
          <p>Admin Shift Pagi,</p>
          <p className="mt-20">(.....................)</p>
        </div>
        <div>
          <p>Admin Shift Sore,</p>
          <p className="mt-20">(.....................)</p>
        </div>
        <div>
          <p>Leader,</p>
          <p className="mt-20">(.....................)</p>
        </div>
      </div>
    </div>
  );
}
