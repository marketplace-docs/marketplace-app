
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import type { AdminTask } from '@/types/admin-task';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';

export default function MonitoringManpowerPage() {
  const [tasks] = useLocalStorage<AdminTask[]>('adminTasks', []);

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Monitoring Manpower</h1>
        <Card>
          <CardHeader>
            <CardTitle>Update Manpower</CardTitle>
            <CardDescription>A list of tasks created by the admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>{task.job}</TableCell>
                        <TableCell>{task.shift}</TableCell>
                        <TableCell>{format(new Date(task.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No tasks created yet. Go to the Create Task page to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
