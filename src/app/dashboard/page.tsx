
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { initialStores } from '@/lib/data';
import { DollarSign, Store, Users, Briefcase } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const recentActivities = [
    { id: '1', user: 'Arlan Saputra', action: 'Login', timestamp: `${today} 12:00:10` },
    { id: '2', user: 'Rudi Setiawan', action: 'Update User', timestamp: `${today} 11:15:22` },
    { id: '3', user: 'Admin System', action: 'Database Backup', timestamp: `${today} 11:00:00` },
    { id: '4', user: 'Nova Aurelia', action: 'Add Staff', timestamp: `${today} 10:05:45` },
    { id: '5', user: 'Nurul Tanzilla', action: 'Export Report', timestamp: `${today} 09:30:11` },
];

const backlogItems = initialStores.map(store => ({
    id: store.id,
    storeName: store.storeName,
    paymentAccepted: Math.floor(Math.random() * 500) + 50, 
    marketplace: store.nameStore,
    platform: store.marketplace,
}));

const marketplaceColors: { [key: string]: string } = {
  'Shopee': '#F97316',
  'Lazada': '#2563EB',
  'Tiktok': '#000000',
};

export default function DashboardPage() {
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const showToast = sessionStorage.getItem('showLoginSuccessToast');
            if (showToast) {
                toast({
                    title: "Welcome To Fulfillment Marketplace",
                    description: "You have successfully logged in.",
                });
                sessionStorage.removeItem('showLoginSuccessToast');
            }
        }
    }, [isClient, toast]);

    const totalPaymentAccepted = useMemo(() => {
        return backlogItems.reduce((acc, item) => acc + item.paymentAccepted, 0);
    }, []);

    const totalMarketplaceStore = useMemo(() => {
        const uniqueStores = new Set(initialStores.map(s => s.id));
        return uniqueStores.size;
      }, []);

    const chartData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    backlogItems.forEach(item => {
        if (!grouped[item.platform]) {
            grouped[item.platform] = 0;
        }
        grouped[item.platform] += item.paymentAccepted;
    });
    return Object.entries(grouped).map(([platform, paymentAccepted]) => ({
        name: platform,
        'Payment Accepted': paymentAccepted,
        fill: marketplaceColors[platform] || '#6366f1'
    })).sort((a, b) => b['Payment Accepted'] - a['Payment Accepted']);
  }, []);

    return (
      <MainLayout>
        <div className="w-full space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">A summary of your marketplace activities.</p>
            </div>
          
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payment Accepted</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPaymentAccepted.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">from all marketplaces</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Marketplace Stores</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMarketplaceStore}</div>
                        <p className="text-xs text-muted-foreground">across all platforms</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">25</div>
                        <p className="text-xs text-muted-foreground">including leaders and captains</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">10</div>
                        <p className="text-xs text-muted-foreground">based on database entries</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Backlog Overview</CardTitle>
                        <CardDescription>Payment accepted amounts by platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toLocaleString()}`}/>
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[0.8rem] font-bold">{label}</span>
                                                <span className="text-sm text-foreground">
                                                    {payload[0].value?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        )
                                    }
                                    return null
                                    }}
                                />
                                <Bar dataKey="Payment Accepted" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>A log of recent actions in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivities.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium">{activity.user}</TableCell>
                                    <TableCell>{activity.action}</TableCell>
                                    <TableCell className="text-muted-foreground">{activity.timestamp.split(' ')[1]}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
      </MainLayout>
    );
}
