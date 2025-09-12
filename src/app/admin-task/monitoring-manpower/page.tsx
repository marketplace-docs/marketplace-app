
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Printer, Loader2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MonitoringManpowerPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const fetchTasks = useCallback(async () => {
    try {
        setLoading(true);
        const response = await fetch('/api/admin-tasks');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data);
        setError(null);
    } catch (e: any) {
        setError(e.message);
        toast({
            variant: "destructive",
            title: "Error fetching data",
            description: e.message,
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const totalPages = Math.ceil(tasks.length / rowsPerPage);
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  const handleOpenEditDialog = (task: AdminTask) => {
    setSelectedTask({ ...task });
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (task: AdminTask) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin-tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTask),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      await fetchTasks(); // Refetch all tasks to get the latest data
      setEditDialogOpen(false);
      setSelectedTask(null);
      toast({ title: "Success", description: "Task has been updated successfully." });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: e.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/admin-tasks/${selectedTask.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete task');
        }
        
        await fetchTasks(); // Refetch tasks
        setDeleteDialogOpen(false);
        setSelectedTask(null);
        toast({ title: "Success", description: "Task has been deleted.", variant: "destructive" });

        if (paginatedTasks.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: e.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePrint = () => {
      window.print();
  }

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Monitoring Manpower</h1>
        {error && (
            <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <div>
              <CardTitle>Update Manpower</CardTitle>
              <CardDescription>A list of tasks created by the admin.</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={handlePrint} id="print-button">
                <Printer className="h-4 w-4" />
                <span className="sr-only">Print</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg" id="printable-content">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right actions-column">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                  ) : paginatedTasks.length > 0 ? (
                    paginatedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>{task.job}</TableCell>
                        <TableCell>{task.shift}</TableCell>
                        <TableCell>{task.status}</TableCell>
                        <TableCell>{format(new Date(task.date), "eee, dd/MMM/yyyy HH:mm")}</TableCell>
                        <TableCell className="text-right actions-column">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(task)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(task)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No tasks created yet. Go to the Create Task page to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4 pagination-controls">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {tasks.length > 0 ? currentPage : 0} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={`${rowsPerPage}`}
                        onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                        }}
                        >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 25, 50, 100].map((pageSize) => (
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
          </CardContent>
        </Card>
      </div>

       {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                  <DialogDescription>
                      Make changes to the task here. Click save when you're done.
                  </DialogDescription>
              </DialogHeader>
              {selectedTask && (
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Name</Label>
                          <Input id="name" value={selectedTask.name} className="col-span-3" onChange={(e) => setSelectedTask({ ...selectedTask, name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="job" className="text-right">Job</Label>
                            <Select value={selectedTask.job} onValueChange={(value) => setSelectedTask({ ...selectedTask, job: value })}>
                                <SelectTrigger id="job" className="col-span-3">
                                    <SelectValue placeholder="Select Job" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Leader">Leader</SelectItem>
                                    <SelectItem value="Putaway">Putaway</SelectItem>
                                    <SelectItem value="Picker">Picker</SelectItem>
                                    <SelectItem value="Packer">Packer</SelectItem>
                                    <SelectItem value="Interco Transferan">Interco Transferan</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="shift" className="text-right">Shift</Label>
                            <Select value={selectedTask.shift} onValueChange={(value) => setSelectedTask({ ...selectedTask, shift: value })}>
                                <SelectTrigger id="shift" className="col-span-3">
                                    <SelectValue placeholder="Select Shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pagi">Pagi</SelectItem>
                                    <SelectItem value="Siang">Siang</SelectItem>
                                    <SelectItem value="Sore">Sore</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <Select value={selectedTask.status} onValueChange={(value) => setSelectedTask({ ...selectedTask, status: value })}>
                                <SelectTrigger id="status" className="col-span-3">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Event">Event</SelectItem>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                    <SelectItem value="Staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                  </div>
              )}
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                      This action cannot be undone. This will permanently delete the task for <span className="font-semibold">{selectedTask?.name}</span>.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteTask} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-content, #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .actions-column, #print-button, .pagination-controls {
            display: none;
          }
          @page {
            size: auto;
            margin: 0.5in;
          }
        }
      `}</style>
    </MainLayout>
  );
}
