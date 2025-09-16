'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonitoringCycleCountPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Monitoring Cycle Count</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Cycle Count Monitoring</CardTitle>
                        <CardDescription>This page is under construction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>The dashboard for monitoring cycle count progress and results will be here.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
