
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
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

type LogEntry = {
    id: number;
    user_name: string;
    user_email: string;
    action: string;
    created_at: string;
    details: string;
};

export default function LogActivityPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/log-activity');
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            setLogs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);


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
         {error && (
            <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
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
                            <TableHead>Email</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : paginatedLogs.length > 0 ? (
                            paginatedLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.user_name}</TableCell>
                                    <TableCell>{log.user_email}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell>{format(new Date(log.created_at), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                                    <TableCell>{log.details}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        )}
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
                        {[5, 20, 50, 100].map((pageSize) => (
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
