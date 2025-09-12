
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Smile, Frown, Pencil, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { performanceData as initialPerformanceData, PerformanceData } from '@/lib/daily-performance-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const jobDescriptions = ["All", "Picker Marketplace", "Admin Wave", "Packer Marketplace", "Picker", "Packer", "Putaway", "Interco", "Admin"];

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


    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleExport = () => {
        const headers = ["Date", "Month", "Name", "Task Daily", "Total Items", "Job-Desc", "Shift", "Task Performance", "Items Performance", "Result"];
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

    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Daily Performance</h1>
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
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
                                    onSelect={setDateRange}
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
