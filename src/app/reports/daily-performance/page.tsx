
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Smile, Frown, Pencil, Save, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, differenceInDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { performanceData as initialPerformanceData, PerformanceData } from '@/lib/daily-performance-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const jobDescriptions = ["All", "Picker", "Packer", "Putaway", "Interco", "Admin"];

const ResultBadge = ({ result }: { result: 'BERHASIL' | 'GAGAL' }) => {
  const isSuccess = result === 'BERHASIL';
  return (
    <Badge
      className={cn(
        'flex items-center justify-center text-white',
        isSuccess ? 'bg-green-500' : 'bg-red-500'
      )}
    >
      <span>{result}</span>
      {isSuccess ? <Smile className="ml-2 h-4 w-4" /> : <Frown className="ml-2 h-4 w-4" />}
    </Badge>
  );
};

type NewPerformanceData = Omit<PerformanceData, 'id' | 'month' | 'target' | 'targetItem' | 'taskPerformance' | 'itemsPerformance' | 'result'> & {
  date: string;
};


export default function DailyPerformancePage() {
    const [data, setData] = useState<PerformanceData[]>(initialPerformanceData);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(2025, 0, 2),
        to: new Date(2025, 0, 2),
    });
    const [jobFilter, setJobFilter] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedItems, setEditedItems] = useState<Record<number, Partial<Pick<PerformanceData, 'taskDaily' | 'totalItems'>>>>({});

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [newEntry, setNewEntry] = useState<NewPerformanceData>({
        date: format(new Date(), 'yyyy-MM-dd'),
        name: '',
        taskDaily: 0,
        totalItems: 0,
        jobDesc: 'Picker',
        shift: 'PAGI',
    });

    const filteredData = useMemo(() => {
        let filtered = data;
        if (dateRange?.from && dateRange?.to) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
            });
        }
        if (jobFilter !== "All") {
            filtered = filtered.filter(item => item.jobDesc === jobFilter);
        }
        return filtered;
    }, [data, dateRange, jobFilter]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );
    
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, dateRange, jobFilter]);

    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            if (differenceInDays(range.to, range.from) > 6) {
                 toast({
                    variant: 'destructive',
                    title: 'Date Range Too Large',
                    description: 'Please select a date range of 7 days or less.',
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
        const headers = ["Date", "Month", "Name", "Task Daily", "Total Items", "Job-Desc", "Shift", "Task Perf.", "Items Perf.", "Result"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                format(new Date(item.date), "dd MMMM yyyy"),
                item.month,
                item.name,
                item.taskDaily,
                item.totalItems,
                item.jobDesc,
                item.shift,
                `${item.taskPerformance}%`,
                `${item.itemsPerformance}%`,
                item.result
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `daily_performance_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Data has been exported to CSV." });
    };

    const handleEditToggle = () => {
      if (isEditing) {
          const updatedData = data.map(item => {
              const editedItem = editedItems[item.id];
              if (editedItem) {
                  const newTaskDaily = editedItem.taskDaily ?? item.taskDaily;
                  const newTotalItems = editedItem.totalItems ?? item.totalItems;
                  
                  const taskPerformance = item.target > 0 ? Math.round((newTaskDaily / item.target) * 100) : 0;
                  const itemsPerformance = item.targetItem > 0 ? Math.round((newTotalItems / item.targetItem) * 100) : 0;

                  return {
                      ...item,
                      taskDaily: newTaskDaily,
                      totalItems: newTotalItems,
                      taskPerformance: taskPerformance,
                      itemsPerformance: itemsPerformance,
                      result: taskPerformance >= 100 ? 'BERHASIL' : 'GAGAL',
                  };
              }
              return item;
          });
          setData(updatedData);
          setEditedItems({});
          toast({ title: "Success", description: "Performance data has been updated." });
      }
      setIsEditing(!isEditing);
    };

    const handleItemChange = (id: number, field: 'taskDaily' | 'totalItems', value: string) => {
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
    
    const handleAddEntry = () => {
        if (!newEntry.name || !newEntry.date) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Name and date are required fields.',
            });
            return;
        }

        const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const entryDate = new Date(newEntry.date);
        
        // Mock targets, this should be based on your business logic
        const target = 400;
        const targetItem = 1000;
        
        const taskPerformance = target > 0 ? Math.round((newEntry.taskDaily / target) * 100) : 0;
        const itemsPerformance = targetItem > 0 ? Math.round((newEntry.totalItems / targetItem) * 100) : 0;

        const newPerformanceEntry: PerformanceData = {
            id: newId,
            date: entryDate.toISOString(),
            month: format(entryDate, 'MMMM - yy'),
            name: newEntry.name,
            taskDaily: newEntry.taskDaily,
            totalItems: newEntry.totalItems,
            jobDesc: newEntry.jobDesc,
            shift: newEntry.shift,
            target: target,
            targetItem: targetItem,
            taskPerformance: taskPerformance,
            itemsPerformance: itemsPerformance,
            result: taskPerformance >= 100 ? 'BERHASIL' : 'GAGAL',
        };

        setData(prevData => [...prevData, newPerformanceEntry]);
        setAddDialogOpen(false);
        setNewEntry({
          date: format(new Date(), 'yyyy-MM-dd'),
          name: '',
          taskDaily: 0,
          totalItems: 0,
          jobDesc: 'Picker',
          shift: 'PAGI',
        });
        toast({ title: 'Success', description: 'New performance entry added.' });
    };

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Performance Report</h1>
                    <div className="flex gap-2">
                        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Performance
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Performance Entry</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-name" className="text-right">Name</Label>
                                        <Input id="new-name" value={newEntry.name} onChange={(e) => setNewEntry({...newEntry, name: e.target.value})} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-date" className="text-right">Date</Label>
                                        <Input id="new-date" type="date" value={newEntry.date} onChange={(e) => setNewEntry({...newEntry, date: e.target.value})} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-job" className="text-right">Job Desc</Label>
                                        <Select value={newEntry.jobDesc} onValueChange={(val: PerformanceData['jobDesc']) => setNewEntry({...newEntry, jobDesc: val})}>
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
                                        <Label htmlFor="new-taskDaily" className="text-right">Task Daily</Label>
                                        <Input id="new-taskDaily" type="number" value={newEntry.taskDaily} onChange={(e) => setNewEntry({...newEntry, taskDaily: parseInt(e.target.value) || 0})} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-totalItems" className="text-right">Total Items</Label>
                                        <Input id="new-totalItems" type="number" value={newEntry.totalItems} onChange={(e) => setNewEntry({...newEntry, totalItems: parseInt(e.target.value) || 0})} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddEntry}>Add Entry</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>
                
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Performance Report</CardTitle>
                                <CardDescription>Detailed daily performance metrics of team members.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleEditToggle}>
                                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                                {isEditing ? 'Save' : 'Edit'}
                            </Button>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                                                <TableCell>{item.month}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Input 
                                                          type="number"
                                                          value={editedItems[item.id]?.taskDaily ?? item.taskDaily}
                                                          onChange={(e) => handleItemChange(item.id, 'taskDaily', e.target.value)}
                                                          className="h-8 w-24"
                                                        />
                                                    ) : item.taskDaily.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Input 
                                                          type="number"
                                                          value={editedItems[item.id]?.totalItems ?? item.totalItems}
                                                          onChange={(e) => handleItemChange(item.id, 'totalItems', e.target.value)}
                                                          className="h-8 w-24"
                                                        />
                                                    ) : item.totalItems.toLocaleString()}
                                                </TableCell>
                                                <TableCell><Badge variant="secondary">{item.jobDesc}</Badge></TableCell>
                                                <TableCell>{item.shift}</TableCell>
                                                <TableCell>{item.taskPerformance}%</TableCell>
                                                <TableCell>{item.itemsPerformance}%</TableCell>
                                                <TableCell className="text-center">
                                                    <ResultBadge result={item.result} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                                No data found for the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredData.length > 0 ? currentPage : 0} of {totalPages}
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
        </MainLayout>
    );
}
