
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Check, Send } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

type InboundItem = {
  id: number;
  reference: string;
  sku: string;
  barcode: string;
  name: string;
  qty: number;
  brand: string;
  expDate: string;
  receivedBy: string;
  date: string;
  status: 'Assign' | 'In Progress' | 'Done' | 'Cancelled' | 'Return';
};

const mockInboundData: InboundItem[] = [
  { id: 1, reference: 'PO-2024-001', sku: 'SKU001', barcode: '1234567890123', name: 'Product A', qty: 100, brand: 'BrandX', expDate: '2025-12-31', receivedBy: 'John Doe', date: new Date().toISOString(), status: 'Assign' },
  { id: 2, reference: 'PO-2024-002', sku: 'SKU002', barcode: '1234567890124', name: 'Product B', qty: 200, brand: 'BrandY', expDate: '2026-06-30', receivedBy: 'Jane Smith', date: new Date().toISOString(), status: 'In Progress' },
  { id: 3, reference: 'PO-2024-003', sku: 'SKU003', barcode: '1234567890125', name: 'Product C', qty: 50, brand: 'BrandZ', expDate: '2024-10-31', receivedBy: 'John Doe', date: new Date().toISOString(), status: 'Done' },
];

const statusVariantMap: Record<InboundItem['status'], "default" | "secondary" | "destructive" | "outline"> = {
    'Assign': 'default',
    'In Progress': 'secondary',
    'Done': 'default',
    'Cancelled': 'destructive',
    'Return': 'destructive',
};


export default function InboundPage() {
    const [inboundList] = useState<InboundItem[]>(mockInboundData);
    const [inboundMonitoringList] = useState<InboundItem[]>(mockInboundData);

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Inbound</h1>

                <Tabs defaultValue="list">
                    <TabsList>
                        <TabsTrigger value="list">Inbound List</TabsTrigger>
                        <TabsTrigger value="monitoring">Inbound Monitoring</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list">
                        <Card>
                            <CardHeader>
                                <CardTitle>Inbound List</CardTitle>
                                <CardDescription>List of all incoming items.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inboundList.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.reference}</TableCell>
                                                <TableCell>{item.sku}</TableCell>
                                                <TableCell>{item.barcode}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>{item.qty}</TableCell>
                                                <TableCell>{item.brand}</TableCell>
                                                <TableCell>{format(new Date(item.expDate), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{item.receivedBy}</TableCell>
                                                <TableCell>{format(new Date(item.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="monitoring">
                        <Card>
                            <CardHeader>
                                <CardTitle>Inbound Monitoring</CardTitle>
                                <CardDescription>Monitor and process incoming items.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inboundMonitoringList.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.reference}</TableCell>
                                                <TableCell>{item.sku}</TableCell>
                                                <TableCell>{item.barcode}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>{item.qty}</TableCell>
                                                <TableCell>{item.brand}</TableCell>
                                                <TableCell>{format(new Date(item.expDate), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{item.receivedBy}</TableCell>
                                                <TableCell>{format(new Date(item.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                <TableCell><Badge variant={statusVariantMap[item.status] || 'default'}>{item.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon"><Check className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}
