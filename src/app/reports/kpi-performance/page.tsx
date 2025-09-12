
'use client';

import React, { useMemo, useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { performanceData, PerformanceData } from '@/lib/daily-performance-data';
import { Users, ClipboardList, TrendingUp, Briefcase, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';

const KpiCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const PerformanceRoleCard = ({ role }: { role: 'Picker' | 'Packer' | 'Putaway' | 'Interco' | 'Admin' }) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(2025, 8, 13),
        to: new Date(2025, 8, 13),
    });
    const [activeShift, setActiveShift] = useState<'ALL' | '1' | '2' | '3'>('ALL');

    const filteredData = useMemo(() => {
        let filtered = performanceData.filter(p => p.jobDesc === role);
        // Add filtering logic for date and shift when data structure supports it
        return filtered;
    }, [role]);

    const stats = useMemo(() => {
        const dataForStats = filteredData;
        return {
            totalManpower: new Set(dataForStats.map(d => d.name)).size,
            totalOrders: dataForStats.reduce((acc, curr) => acc + curr.taskDaily, 0),
            totalSku: dataForStats.reduce((acc, curr) => acc + curr.totalItems, 0), // Assuming totalItems is SKU
            avg: dataForStats.length > 0 ? (dataForStats.reduce((acc, curr) => acc + curr.taskDaily, 0) / dataForStats.length) : 0,
            totalItems: dataForStats.reduce((acc, curr) => acc + curr.totalItems, 0),
        }
    }, [filteredData]);
    
    const isDispatcher = role === 'Admin';


    const StatDisplay = ({ label, value }: { label: string, value: string | number }) => (
        <div className="text-center">
            <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );

    return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center pb-4 border-b">
                    <div className="grid grid-cols-5 gap-4 w-full text-center">
                       <StatDisplay label={role} value={stats.totalManpower} />
                       <StatDisplay label="Order" value={stats.totalOrders} />
                       {!isDispatcher && <StatDisplay label="SKU" value={stats.totalSku} />}
                       {!isDispatcher && <StatDisplay label="AVG" value={stats.avg.toFixed(0)} />}
                       {!isDispatcher && <StatDisplay label="ITEM" value={stats.totalItems} />}
                    </div>
                </div>
                 <div className="flex justify-between items-center pt-4 text-sm">
                    <div className="flex gap-4 items-center">
                        <span className="text-muted-foreground">From</span>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-[240px] justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? format(dateRange.from, "dd MMM yyyy HH:mm") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateRange?.from} onSelect={(d) => setDateRange(prev => ({...prev, from: d}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="flex gap-4 items-center">
                        <span className="text-muted-foreground">To</span>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-[240px] justify-start text-left font-normal", !dateRange?.to && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.to ? format(dateRange.to, "dd MMM yyyy HH:mm") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateRange?.to} onSelect={(d) => setDateRange(prev => ({...prev, to: d}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-2">
                         {['ALL', '1', '2', '3'].map(shift => (
                            <Badge 
                                key={shift} 
                                onClick={() => setActiveShift(shift as any)}
                                className={cn(
                                    "cursor-pointer text-lg px-3 py-1 rounded-full",
                                    activeShift === shift ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-700'
                                )}
                            >
                                {shift}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Orders</TableHead>
                            {!isDispatcher && <TableHead>SKU</TableHead>}
                            {!isDispatcher && <TableHead>Item</TableHead>}
                            {!isDispatcher && <TableHead>Avg</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={isDispatcher ? 2 : 5} className="h-24 text-center">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <AlertTriangle className="h-4 w-4" />
                                    No data available
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function KpiPerformancePage() {

    const kpiMetrics = useMemo(() => {
        const totalManpower = new Set(performanceData.map(p => p.name)).size;
        const totalTasks = performanceData.reduce((acc, p) => acc + p.taskDaily, 0);
        const averageProductivity = totalManpower > 0 ? (totalTasks / totalManpower) : 0;

        const tasksByJobDesc = performanceData.reduce((acc, p) => {
            const jobDesc = p.jobDesc.replace(' Marketplace', '').replace(' Wave', '');
            if (!acc[jobDesc]) {
                acc[jobDesc] = { totalTasks: 0, manpowerCount: 0, names: new Set() };
            }
            acc[jobDesc].totalTasks += p.taskDaily;
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
    }, []);

    const chartData = kpiMetrics.productivityByJobDesc.map(item => ({
        name: item.jobDesc,
        'Total Tugas': item.totalTasks,
    }));


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">KPI Performance</h1>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <KpiCard title="Total Manpower" value={kpiMetrics.totalManpower.toString()} icon={Users} />
                    <KpiCard title="Total Tugas Selesai" value={kpiMetrics.totalTasks.toLocaleString()} icon={ClipboardList} />
                    <KpiCard title="Produktivitas Rata-rata" value={`${kpiMetrics.averageProductivity.toFixed(2)} tugas/orang`} icon={TrendingUp} />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <PerformanceRoleCard role="Picker" />
                    <PerformanceRoleCard role="Packer" />
                    <PerformanceRoleCard role="Admin" />
                </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Produktivitas per Job Deskripsi</CardTitle>
                            <CardDescription>Rincian pencapaian tugas dan jumlah manpower berdasarkan deskripsi pekerjaan.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Grafik Total Tugas per Job Deskripsi</CardTitle>
                            <CardDescription>Visualisasi perbandingan total tugas yang diselesaikan oleh setiap tim.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

    