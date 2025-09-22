
'use client';

import React from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileWarning } from 'lucide-react';

export default function MyOrdersPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">My Orders</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>My Orders</CardTitle>
                        <CardDescription>This page is under construction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                            <FileWarning className="h-16 w-16 mb-4" />
                            <h3 className="text-xl font-semibold">Coming Soon!</h3>
                            <p>This feature to display your orders is currently being built.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
