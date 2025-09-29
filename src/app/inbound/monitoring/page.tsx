
'use client';

import React from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Check, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with actual data fetching in the future
const mockInboundData = [
    { id: 1, reference: 'INB-001', sku: 'SKU001', barcode: '123456789', name: 'Product A', qty: 100, brand: 'Brand A', exp_date: '2025-12-31', received_by: 'User A', date: new Date().toISOString(), main_status: 'Assign' },
    { id: 2, reference: 'INB-002', sku: 'SKU002', barcode: '987654321', name: 'Product B', qty: 50, brand: 'Brand B', exp_date: '2026-06-30', received_by: 'User B', date: new Date().toISOString(), main_status: 'In Progress' },
    { id: 3, reference: 'INB-003', sku: 'SKU003', barcode: '555555555', name: 'Product C', qty: 200, brand: 'Brand C', exp_date: '2025-10-15', received_by: 'User A', date: new Date().toISOString(), main_status: 'Done' },
];

const InboundMonitoringTable = ({ data }: { data: typeof mockInboundData }) => (
    <div className="border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Exp Date</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Main Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length > 0 ? data.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.reference}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.exp_date}</TableCell>
                        <TableCell>{item.received_by}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant={item.main_status === 'Done' ? 'default' : 'secondary'}>{item.main_status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">No data available.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
);


export default function InboundMonitoringPage() {
    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Inbound Monitoring</h1>
                 <Card>
                    <CardHeader>
                        <CardTitle>Inbound Monitoring</CardTitle>
                        <CardDescription>Monitor the status and perform actions on inbound items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InboundMonitoringTable data={mockInboundData} />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
