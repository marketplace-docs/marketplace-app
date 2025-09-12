
'use client';

import React, { useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { performanceData, PerformanceData } from '@/lib/daily-performance-data';
import { Users, ClipboardList, TrendingUp, Briefcase } from 'lucide-react';

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

export default function KpiPerformancePage() {

    const kpiMetrics = useMemo(() => {
        const totalManpower = new Set(performanceData.map(p => p.name)).size;
        const totalTasks = performanceData.reduce((acc, p) => acc + p.taskDaily, 0);
        const averageProductivity = totalManpower > 0 ? (totalTasks / totalManpower) : 0;

        const tasksByJobDesc = performanceData.reduce((acc, p) => {
            if (!acc[p.jobDesc]) {
                acc[p.jobDesc] = { totalTasks: 0, manpowerCount: 0, names: new Set() };
            }
            acc[p.jobDesc].totalTasks += p.taskDaily;
            acc[p.jobDesc].names.add(p.name);
            acc[p.jobDesc].manpowerCount = acc[p.jobDesc].names.size;
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

