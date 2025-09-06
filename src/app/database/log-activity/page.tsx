
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LogEntry = {
    id: number;
    user: string;
    action: string;
    date: string;
    details: string;
};

const initialLogs: LogEntry[] = [
    { id: 1, user: 'Arlan Saputra', action: 'Login', date: '2024-07-29 08:00:15', details: 'User logged in successfully.' },
    { id: 2, user: 'Rudi Setiawan', action: 'Update User', date: '2024-07-29 08:10:22', details: 'Updated role for user "Diki Mauli" to Captain.' },
    { id: 3, user: 'Admin System', action: 'Automatic Backup', date: '2024-07-29 09:00:00', details: 'Database backup completed successfully.' },
    { id: 4, user: 'Nova Aurelia', action: 'Add Staff', date: '2024-07-29 09:05:45', details: 'Added 5 new staff members via CSV upload.' },
    { id: 5, user: 'Nurul Tanzilla', action: 'Export Report', date: '2024-07-29 09:30:11', details: 'Exported "Admin Picklist Report".' },
    { id: 6, user: 'Arlan Saputra', action: 'Update Schedule', date: '2024-07-29 10:00:00', details: 'Updated name for LEADER PAGI.' },
    { id: 7, user: 'Regina Rifana', action: 'Delete User', date: '2024-07-29 10:15:30', details: 'Deleted user "Old User".' },
    { id: 8, user: 'Rudi Setiawan', action: 'Edit Backlog', date: '2024-07-29 11:00:50', details: 'Updated payment accepted for "Shopee Jung Saem Mool".' },
    { id: 9, user: 'Arlan Saputra', action: 'Logout', date: '2024-07-29 11:30:00', details: 'User logged out.' },
    { id: 10, user: 'Nova Aurelia', action: 'Login', date: '2024-07-29 12:00:10', details: 'User logged in successfully.' },
];

export default function LogActivityPage() {
    const [logs] = useState<LogEntry[]>(initialLogs);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const totalPages = Math.ceil(logs.length / rowsPerPage);
    const paginatedLogs = logs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

  return (
    <MainLayout>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6">Log Activity</h1>
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                    This is a log of all activities in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">{log.user}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.date}</TableCell>
                                <TableCell>{log.details}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Page {logs.length > 0 ? currentPage : 0} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                    value={`${rowsPerPage}`}
                    onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={rowsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[5, 10, 20].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </MainLayout>
  );
}
