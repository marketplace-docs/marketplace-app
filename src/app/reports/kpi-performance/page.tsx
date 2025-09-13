
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import type { PerformanceData } from '@/lib/daily-performance-data';
import { Users, ClipboardList, TrendingUp, Briefcase, Calendar as CalendarIcon, Clock, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const KpiCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: React.ElementType, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
             {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

const PerformanceRoleCard = ({ role, data, isLoading }: { role: 'Picker' | 'Packer' | 'Putaway' | 'Admin' | 'Interco', data: PerformanceData[], isLoading: boolean }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const filteredData = useMemo(() => {
        const roleMapping: Record<string, string[]> = {
            'Picker': ['Picker', 'Picker Marketplace'],
            'Packer': ['Packer', 'Packer Marketplace'],
            'Admin': ['Admin', 'Admin Wave'],
            'Putaway': ['Putaway'],
            'Interco': ['Interco']
        };

        const targetJobDescs = roleMapping[role] || [role];
        
        return data.filter(p => targetJobDescs.includes(p.job_desc));
    }, [role, data]);
    
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        return filteredData.slice(
            (currentPage - 1) * rowsPerPage,
            currentPage * rowsPerPage
        );
    }, [filteredData, currentPage, rowsPerPage]);

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, data]);

    const stats = useMemo(() => {
        const dataForStats = filteredData;
        const totalManpower = new Set(dataForStats.map(d => d.name)).size;
        const totalOrders = dataForStats.reduce((acc, curr) => acc + curr.task_daily, 0);
        const totalItems = dataForStats.reduce((acc, curr) => acc + curr.total_items, 0);
        const avg = totalManpower > 0 ? (totalOrders / totalManpower) : 0;
        
        const totalSku = new Set(dataForStats.map(d => d.name)).size;
        const totalQty = totalItems;

        return {
            totalManpower,
            totalOrders,
            totalSku,
            avg,
            totalItems,
            totalQty,
        }
    }, [filteredData]);
    
    const isPutaway = role === 'Putaway';
    const isPickerOrPacker = role === 'Picker' || role === 'Packer';

    const StatDisplay = ({ label, value }: { label: string, value: string | number }) => (
        <div className="text-center">
             {isLoading ? <Loader2 className="h-6 w-6 mx-auto animate-spin" /> : <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>}
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );

    return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center pb-4 border-b">
                    <div className="grid grid-cols-5 gap-4 w-full text-center">
                       <StatDisplay label={role} value={stats.totalManpower} />
                       <StatDisplay label={isPutaway ? "Document" : "Order"} value={stats.totalOrders} />
                       {isPutaway && <StatDisplay label="SKU" value={stats.totalSku} />}
                       {isPutaway && <StatDisplay label="Qty" value={stats.totalQty} />}
                       {isPickerOrPacker && <StatDisplay label="ITEM" value={stats.totalItems} />}
                       <StatDisplay label="AVG" value={stats.avg.toFixed(0)} />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground pt-4">Data for role: {role}</p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>{isPutaway ? "Document" : "Orders"}</TableHead>
                            {isPickerOrPacker && <TableHead>Item</TableHead>}
                            <TableHead>Avg</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={isPickerOrPacker ? 4 : 3} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.task_daily.toLocaleString()}</TableCell>
                                    {isPickerOrPacker && <TableCell>{item.total_items.toLocaleString()}</TableCell>}
                                    <TableCell>{stats.avg.toFixed(0)}</TableCell>
                                </TableRow>
                            ))
                         ) : (
                            <TableRow>
                                <TableCell colSpan={isPickerOrPacker ? 4 : 3} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertTriangle className="h-4 w-4" />
                                        No data available for this role in the selected range.
                                    </div>
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {filteredData.length > 0 ? currentPage : 0} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={`${rowsPerPage}`}
                        onValueChange={(value) => { setRowsPerPage(Number(value)); }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 25, 50].map((pageSize) => (
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
            </CardFooter>
        </Card>
    );
}

export default function KpiPerformancePage() {
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(1)), // Start of current month
        to: new Date(), // Today
    });

    const fetchPerformanceData = useCallback(async (range: DateRange | undefined) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (range?.from) params.append('from', format(range.from, 'yyyy-MM-dd'));
            if (range?.to) params.append('to', format(range.to, 'yyyy-MM-dd'));
            
            const response = await fetch(`/api/daily-performance?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch performance data');
            const result = await response.json();
            setPerformanceData(result);
        } catch (err: any) {
            setError(err.message);
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchPerformanceData(dateRange);
    }, [dateRange, fetchPerformanceData]);


    const kpiMetrics = useMemo(() => {
        const totalManpower = new Set(performanceData.map(p => p.name)).size;
        const totalTasks = performanceData.reduce((acc, p) => acc + p.task_daily, 0);
        const averageProductivity = totalManpower > 0 ? (totalTasks / totalManpower) : 0;

        const tasksByJobDesc = performanceData.reduce((acc, p) => {
            const jobDesc = p.job_desc.replace(' Marketplace', '').replace(' Wave', '');
            if (!acc[jobDesc]) {
                acc[jobDesc] = { totalTasks: 0, manpowerCount: 0, names: new Set() };
            }
            acc[jobDesc].totalTasks += p.task_daily;
            acc[jobDesc].names.add(p.name);
            acc[jobDesc].manpowerCount = acc[jobDesc].names.size;
            return acc;
        }, {} as { [key: string]: { totalTasks: number; manpowerCount: number, names: Set<string> } });

        const productivityByJobDesc = Object.entries(tasksByJobDesc).map(([jobDesc, data]) => ({
            jobDesc,
            totalTasks: data.totalTasks,
            manpowerCount: data.manpowerCount,
            productivity: data.manpowerCount > 0 ? (data.totalTasks / data.manpowerCount) : 0,
        })).sort((a,b) => b.totalTasks - a.totalTasks);

        return {
            totalManpower,
            totalTasks,
            averageProductivity,
            productivityByJobDesc
        };
    }, [performanceData]);

    const chartData = kpiMetrics.productivityByJobDesc.map(item => ({
        name: item.jobDesc,
        'Total Tugas': item.totalTasks,
    }));


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-2xl font-bold">KPI Performance</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filter by Date:</span>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : format(dateRange.from, "LLL dd, y")) : (<span>Pick a date</span>)}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <KpiCard title="Total Manpower" value={kpiMetrics.totalManpower.toString()} icon={Users} isLoading={loading} />
                    <KpiCard title="Total Tugas Selesai" value={kpiMetrics.totalTasks.toLocaleString()} icon={ClipboardList} isLoading={loading} />
                    <KpiCard title="Produktivitas Rata-rata" value={`${kpiMetrics.averageProductivity.toFixed(2)} tugas/orang`} icon={TrendingUp} isLoading={loading} />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <PerformanceRoleCard role="Picker" data={performanceData} isLoading={loading} />
                    <PerformanceRoleCard role="Packer" data={performanceData} isLoading={loading} />
                    <PerformanceRoleCard role="Putaway" data={performanceData} isLoading={loading} />
                    <PerformanceRoleCard role="Admin" data={performanceData} isLoading={loading} />
                </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Produktivitas per Job Deskripsi</CardTitle>
                            <CardDescription>Rincian pencapaian tugas dan jumlah manpower berdasarkan deskripsi pekerjaan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loading ? (
                                <div className="h-48 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Job Desc</TableHead>
                                            <TableHead className="text-right">Total Manpower</TableHead>
                                            <TableHead className="text-right">Total Tugas</TableHead>
                                            <TableHead className="text-right">Produktivitas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {kpiMetrics.productivityByJobDesc.map(item => (
                                            <TableRow key={item.jobDesc}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-muted-foreground" /> 
                                                    {item.jobDesc}
                                                </TableCell>
                                                <TableCell className="text-right">{item.manpowerCount}</TableCell>
                                                <TableCell className="text-right">{item.totalTasks.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{item.productivity.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Grafik Total Tugas per Job Deskripsi</CardTitle>
                            <CardDescription>Visualisasi perbandingan total tugas yang diselesaikan oleh setiap tim.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {loading ? (
                                <div className="h-[350px] w-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartData}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value as number)} />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => [new Intl.NumberFormat('id-ID').format(value as number), "Total Tugas"]}
                                                cursor={{ fill: 'hsl(var(--accent))' }}
                                            />
                                            <Bar dataKey="Total Tugas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                                <LabelList dataKey="Total Tugas" position="right" className="fill-foreground" fontSize={12} formatter={(value: number) => value.toLocaleString()} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

