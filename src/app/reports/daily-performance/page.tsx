
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Smile, Frown, Pencil, Save, Plus, Upload, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, differenceInDays, parse, isValid } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

type PerformanceData = {
    id: number;
    date: string;
    month: string;
    name: string;
    task_daily: number;
    total_items: number;
    job_desc: 'Picker' | 'Packer' | 'Putaway' | 'Interco' | 'Admin';
    shift: 'PAGI' | 'SORE';
    target: number;
    target_item: number;
    task_performance: number;
    items_performance: number;
    result: 'BERHASIL' | 'GAGAL';
};


const jobDescriptions = ["All", "Picker", "Packer", "Putaway", "Interco", "Admin"];

const ResultBadge = ({ result }: { result: 'BERHASIL' | 'GAGAL' }) => {
  const isSuccess = result === 'BERHASIL';
  return (
    <Badge
      className={cn(
        'flex items-center justify-center text-white w-24',
        isSuccess ? 'bg-green-500' : 'bg-red-500'
      )}
    >
      <span>{result}</span>
      {isSuccess ? <Smile className="ml-2 h-4 w-4" /> : <Frown className="ml-2 h-4 w-4" />}
    </Badge>
  );
};

type NewPerformanceData = Omit<PerformanceData, 'id' | 'month' | 'target' | 'target_item' | 'task_performance' | 'items_performance' | 'result'> & {
  date: string;
};


export default function DailyPerformancePage() {
    const { user } = useAuth();
    const [data, setData] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [jobFilter, setJobFilter] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedItems, setEditedItems] = useState<Record<number, Partial<Pick<PerformanceData, 'task_daily' | 'total_items'>>>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PerformanceData | null>(null);

    const [newEntry, setNewEntry] = useState<Omit<NewPerformanceData, 'date'>>({
        name: '',
        task_daily: 0,
        total_items: 0,
        job_desc: 'Picker',
        shift: 'PAGI',
    });
    const [newEntryDate, setNewEntryDate] = useState<Date | undefined>(new Date());

    const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'].includes(user.role);
    const canUpdate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(user.role);
    const canDelete = user?.role === 'Super Admin';

    const fetchPerformanceData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateRange?.from) params.append('from', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange?.to) params.append('to', format(dateRange.to, 'yyyy-MM-dd'));
            if (jobFilter !== 'All') params.append('job_desc', jobFilter);

            const response = await fetch(`/api/daily-performance?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch performance data');
            const result = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange, jobFilter]);

    useEffect(() => {
        fetchPerformanceData();
    }, [fetchPerformanceData]);

    const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );
    
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, dateRange, jobFilter]);

    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            if (differenceInDays(range.to, range.from) > 30) {
                 toast({
                    variant: 'destructive',
                    title: 'Date Range Too Large',
                    description: 'Please select a date range of 31 days or less.',
                });
                return;
            }
        }
        setDateRange(range);
    }


    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleExport = () => {
        if (data.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: 'There is no data to export.',
            });
            return;
        }
        const headers = ["date", "month", "name", "task_daily", "total_items", "job_desc", "shift", "task_performance", "items_performance", "result"];
        const csvContent = [
            headers.join(","),
            ...data.map(item => [
                format(new Date(item.date), "dd MMMM yyyy"),
                item.month,
                `"${item.name}"`,
                item.task_daily,
                item.total_items,
                item.job_desc,
                item.shift,
                item.task_performance,
                item.items_performance,
                item.result
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("download", `daily_performance_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Data has been exported to CSV." });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsSubmitting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length <= 1) throw new Error("CSV is empty or has only a header.");

                const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
                const requiredHeaders = ['date', 'name', 'task daily', 'total items', 'job-desc', 'shift'];
                if (!requiredHeaders.every(h => header.includes(h))) {
                    throw new Error(`Invalid CSV headers. Required: ${requiredHeaders.join(', ')}`);
                }
                
                const newEntries: any[] = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const entry: { [key: string]: string } = {};
                    header.forEach((h, i) => entry[h] = values[i]?.trim().replace(/"/g, ''));
                    
                    const entryDate = parse(entry.date, 'dd MMMM yyyy', new Date());
                    if (!isValid(entryDate)) {
                        console.warn(`Skipping line with invalid date: ${line}`);
                        return null;
                    }
                    
                    return {
                        date: format(entryDate, 'yyyy-MM-dd'),
                        name: entry.name,
                        task_daily: parseInt(entry['task daily'], 10),
                        total_items: parseInt(entry['total items'], 10),
                        job_desc: entry['job-desc'],
                        shift: entry.shift,
                    };
                }).filter(Boolean);

                const response = await fetch('/api/daily-performance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: newEntries, user })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload data');
                }

                await fetchPerformanceData();
                setUploadDialogOpen(false);
                toast({
                    title: "Success",
                    description: `${newEntries.length} entries uploaded successfully.`,
                });

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: error.message || "Failed to parse or upload CSV file.",
                });
            } finally {
              setIsSubmitting(false);
              if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleEditToggle = async () => {
      if (isEditing) {
          if (!user) return;
          const updates = Object.entries(editedItems).map(([id, changes]) => ({
              id: Number(id),
              ...changes
          }));
          
          if(updates.length === 0) {
             toast({ title: "No Changes", description: "No changes to save." });
             setIsEditing(false);
             return;
          }

          setIsSubmitting(true);
          try {
              const response = await fetch('/api/daily-performance', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ updates, user })
              });

              if (!response.ok) throw new Error('Failed to save changes.');
              
              await fetchPerformanceData();
              setEditedItems({});
              setIsEditing(false);
              toast({ title: "Success", description: "Performance data has been updated." });
          } catch(err: any) {
              toast({ variant: "destructive", title: "Save Failed", description: err.message });
          } finally {
              setIsSubmitting(false);
          }
      } else {
        setIsEditing(true);
      }
    };

    const handleItemChange = (id: number, field: 'task_daily' | 'total_items', value: string) => {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
            setEditedItems(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [field]: numericValue
                }
            }));
        } else if (value === '') {
             setEditedItems(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [field]: 0
                }
            }));
        }
    };
    
    const handleAddEntry = async () => {
        if (!newEntry.name || !newEntryDate || !user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Name and date are required fields.',
            });
            return;
        }
        setIsSubmitting(true);

        const newPerformanceEntry = {
            date: format(newEntryDate, 'yyyy-MM-dd'),
            ...newEntry
        };
        
        try {
            const response = await fetch('/api/daily-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: [newPerformanceEntry], user })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add entry');
            }

            await fetchPerformanceData();
            setAddDialogOpen(false);
            setNewEntry({
              name: '',
              task_daily: 0,
              total_items: 0,
              job_desc: 'Picker',
              shift: 'PAGI',
            });
            setNewEntryDate(new Date());
            toast({ title: 'Success', description: 'New performance entry added.' });

        } catch (err: any) {
             toast({ variant: 'destructive', title: 'Add Failed', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenDeleteDialog = (item: PerformanceData) => {
        setSelectedItem(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteItem = async () => {
        if (!selectedItem || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/daily-performance/${selectedItem.id}`, {
                method: 'DELETE',
                headers: {
                  'X-User-Name': user.name,
                  'X-User-Email': user.email,
                  'X-User-Role': user.role
                }
            });
            if (!response.ok) throw new Error('Failed to delete entry');
            
            await fetchPerformanceData();
            setDeleteDialogOpen(false);
            setSelectedItem(null);
            toast({ title: 'Success', description: 'Entry deleted.', variant: 'destructive'});
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Performance Report</h1>
                    <div className="flex gap-2">
                        {canCreate && (
                        <>
                        <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" disabled={isSubmitting}><Upload className="mr-2 h-4 w-4" />Upload</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Performance CSV</DialogTitle>
                                    <DialogDescription>Select a CSV file. The date format must be 'dd MMMM yyyy' (e.g., 24 July 2024).</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                   <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                                   </Button>
                                   <p className="text-xs text-muted-foreground mt-2">
                                        Don't have a template? <a href="/templates/daily_performance_template.csv" download className="underline text-primary">Download CSV template</a>
                                   </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Performance
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Data</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-name" className="text-right">Name</Label>
                                        <Input id="new-name" value={newEntry.name} onChange={(e) => setNewEntry({...newEntry, name: e.target.value})} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-date" className="text-right">Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !newEntryDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newEntryDate ? format(newEntryDate, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={newEntryDate} onSelect={setNewEntryDate} initialFocus/>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-job" className="text-right">Job Desc</Label>
                                        <Select value={newEntry.job_desc} onValueChange={(val: PerformanceData['job_desc']) => setNewEntry({...newEntry, job_desc: val})}>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select job" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Picker">Picker</SelectItem>
                                                <SelectItem value="Packer">Packer</SelectItem>
                                                <SelectItem value="Putaway">Putaway</SelectItem>
                                                <SelectItem value="Interco">Interco</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-shift" className="text-right">Shift</Label>
                                        <Select value={newEntry.shift} onValueChange={(val: 'PAGI' | 'SORE') => setNewEntry({...newEntry, shift: val})}>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select shift" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PAGI">PAGI</SelectItem>
                                                <SelectItem value="SORE">SORE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-task_daily" className="text-right">Task Daily</Label>
                                        <Input id="new-task_daily" type="number" value={newEntry.task_daily} onChange={(e) => setNewEntry({...newEntry, task_daily: parseInt(e.target.value) || 0})} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-total_items" className="text-right">Total Items</Label>
                                        <Input id="new-total_items" type="number" value={newEntry.total_items} onChange={(e) => setNewEntry({...newEntry, total_items: parseInt(e.target.value) || 0})} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddEntry} disabled={isSubmitting}>
                                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Submit
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        </>
                        )}
                        <Button onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>
                
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center pb-4">
                            <div>
                                <CardTitle>Performance Report</CardTitle>
                                <CardDescription>Detailed daily performance metrics of team members.</CardDescription>
                            </div>
                             {canUpdate && (
                             <Button variant="outline" onClick={handleEditToggle} disabled={isSubmitting}>
                                {isEditing ? (isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />) : <Pencil className="mr-2 h-4 w-4" />}
                                {isEditing ? 'Save' : 'Edit'}
                            </Button>
                             )}
                        </div>
                         <div className="flex items-center gap-4 pt-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={handleDateChange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            <Select value={jobFilter} onValueChange={setJobFilter}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Filter by Job Desc..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobDescriptions.map(job => (
                                        <SelectItem key={job} value={job}>{job}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Task Daily</TableHead>
                                        <TableHead>Total Items</TableHead>
                                        <TableHead>Job-Desc</TableHead>
                                        <TableHead>Shift</TableHead>
                                        <TableHead>Task Perf.</TableHead>
                                        <TableHead>Items Perf.</TableHead>
                                        <TableHead className='text-center'>Result</TableHead>
                                        {canDelete && <TableHead className='text-right'>Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                                                <TableCell>{item.month}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    {isEditing && canUpdate ? (
                                                        <Input 
                                                          type="number"
                                                          value={editedItems[item.id]?.task_daily ?? item.task_daily}
                                                          onChange={(e) => handleItemChange(item.id, 'task_daily', e.target.value)}
                                                          className="h-8 w-24"
                                                        />
                                                    ) : item.task_daily.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing && canUpdate ? (
                                                        <Input 
                                                          type="number"
                                                          value={editedItems[item.id]?.total_items ?? item.total_items}
                                                          onChange={(e) => handleItemChange(item.id, 'total_items', e.target.value)}
                                                          className="h-8 w-24"
                                                        />
                                                    ) : item.total_items.toLocaleString()}
                                                </TableCell>
                                                <TableCell><Badge variant="secondary">{item.job_desc}</Badge></TableCell>
                                                <TableCell>{item.shift}</TableCell>
                                                <TableCell>{item.task_performance}%</TableCell>
                                                <TableCell>{item.items_performance}%</TableCell>
                                                <TableCell className="text-center">
                                                    <ResultBadge result={item.result} />
                                                </TableCell>
                                                {canDelete && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(item)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                                No data found for the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {data.length > 0 ? currentPage : 0} of {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => setRowsPerPage(Number(value))}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={`${rowsPerPage}`} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 50, 100].map((pageSize) => (
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
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the performance entry for <span className="font-semibold">{selectedItem?.name}</span> on <span className="font-semibold">{selectedItem ? format(new Date(selectedItem.date), 'd MMM yyyy') : ''}</span>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteItem} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
