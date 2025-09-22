
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";

export default function MonitoringOrdersPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Orders</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Order Monitoring</CardTitle>
                        <CardDescription>A complete overview of all order statuses and activities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Monitor className="h-16 w-16 mb-4" />
                            <h3 className="text-xl font-semibold">Content Coming Soon</h3>
                            <p>This page for monitoring all orders is under construction.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
