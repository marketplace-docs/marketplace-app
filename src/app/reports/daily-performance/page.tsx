
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { taskCompletionData, resourceUtilizationData, recentActivities } from '@/lib/data';

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Completed': 'default',
    'In Progress': 'secondary',
    'Assigned': 'outline',
    'On Hold': 'destructive',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function DailyPerformancePage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Daily Performance</h1>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Task Completion</CardTitle>
                            <CardDescription>Weekly overview of completed vs. pending tasks.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={taskCompletionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '14px' }} />
                                        <Bar dataKey="completed" fill="#16a34a" name="Completed" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pending" fill="#dc2626" name="Pending" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Utilization</CardTitle>
                            <CardDescription>Current utilization of key resources.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={resourceUtilizationData} dataKey="utilization" nameKey="resource" cx="50%" cy="50%" outerRadius={80} label>
                                             {resourceUtilizationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '14px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-1">
                         <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>Quick performance numbers.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <span>Total Tasks</span>
                                <span className="font-bold">1059</span>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-md border-green-500 text-green-600">
                                <span>Total Completed</span>
                                <span className="font-bold">1028</span>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-md border-red-500 text-red-600">
                                <span>Total Pending</span>
                                <span className="font-bold">31</span>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <span>Avg. Completion Time</span>
                                <span className="font-bold">2.5 hours</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>A log of recent task updates and activities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Task ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivities.map(activity => (
                                    <TableRow key={activity.id}>
                                        <TableCell className="font-medium">{activity.user}</TableCell>
                                        <TableCell>{activity.taskId}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[activity.status] || 'default'}>{activity.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{activity.timestamp}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

