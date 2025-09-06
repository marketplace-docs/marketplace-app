
'use client';

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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  CheckCircle,
  Truck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { taskCompletionData, resourceUtilizationData, recentActivities } from '@/lib/data';
import type { ChartConfig } from '@/lib/data';
import { MainLayout } from '@/components/layout/main-layout';


const chartConfig = {
  completed: { label: 'Completed', color: 'hsl(var(--chart-1))' },
  pending: { label: 'Pending', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const resourceChartConfig = {
  staff: { label: 'Staff', color: '#8884d8' },
  equipment: { label: 'Equipment', color: '#82ca9d' },
  space: { label: 'Space', color: '#ffc658' },
} satisfies ChartConfig;

export default function DashboardPage() {
    return (
      <MainLayout>
        <div className="w-full max-w-7xl grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">589</div>
                <p className="text-xs text-muted-foreground">+12 since last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">All operational</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">+2 since yesterday</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Over Time</CardTitle>
                <CardDescription>Weekly completed vs. pending tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskCompletionData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Completed
                                  </span>
                                  <span className="font-bold text-foreground">
                                    {payload[0].value}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Pending
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {payload[1].value}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="pending"
                      stackId="a"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Current utilization of key resources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={resourceUtilizationData} layout="vertical">
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="resource" type="category" tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="utilization" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                A log of the most recent activities in the system.
              </CardDescription>
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
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.user}</TableCell>
                      <TableCell>{activity.taskId}</TableCell>
                      <TableCell>
                        <Badge variant={
                            activity.status === 'Completed' ? 'default' :
                            activity.status === 'In Progress' ? 'secondary' : 'outline'
                        } className="capitalize">
                            {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{activity.timestamp}</TableCell>
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
