
'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type BacklogItem = {
  id: string;
  task: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
};

const initialBacklogItems: BacklogItem[] = [
  { id: 'BK-001', task: 'Integrate new payment gateway', status: 'In Progress', priority: 'Urgent', dueDate: '2024-10-15' },
  { id: 'BK-002', task: 'Develop user profile page', status: 'To Do', priority: 'High', dueDate: '2024-10-22' },
  { id: 'BK-003', task: 'Fix login authentication bug', status: 'Done', priority: 'High', dueDate: '2024-09-28' },
  { id: 'BK-004', task: 'Update homepage banner for Q4 promotion', status: 'To Do', priority: 'Medium', dueDate: '2024-10-05' },
  { id: 'BK-005', task: 'Refactor legacy API endpoints', status: 'Cancelled', priority: 'Low', dueDate: '2024-11-01' },
  { id: 'BK-006', task: 'Create weekly performance report template', status: 'Done', priority: 'Medium', dueDate: '2024-09-25' },
  { id: 'BK-007', task: 'Onboard new marketing team members', status: 'In Progress', priority: 'High', dueDate: '2024-10-10' },
  { id: 'BK-008', task: 'Optimize database query performance', status: 'To Do', priority: 'Urgent', dueDate: '2024-10-18' },
  { id: 'BK-009', task: 'Research and implement push notifications', status: 'To Do', priority: 'Medium', dueDate: '2024-11-05' },
  { id: 'BK-010', task: 'Design new email templates', status: 'To Do', priority: 'Low', dueDate: '2024-10-30' },
];

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'To Do': 'secondary',
  'In Progress': 'default',
  'Done': 'outline',
  'Cancelled': 'destructive',
};

const priorityVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Low': 'secondary',
  'Medium': 'default',
  'High': 'outline',
  'Urgent': 'destructive',
};


export default function BacklogPage() {
  const [backlogItems] = useState<BacklogItem[]>(initialBacklogItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  const totalPages = Math.ceil(backlogItems.length / rowsPerPage);
  const paginatedItems = backlogItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };


  return (
    <div className="w-full max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Backlog</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            A list of all pending and completed tasks in the backlog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-medium">{item.task}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[item.status]}>
                      {item.status}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={priorityVariantMap[item.priority]}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
            Page {backlogItems.length > 0 ? currentPage : 0} of {totalPages}
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
  );
}
