
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CCLocationPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">CC Location</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Cycle Count by Location</CardTitle>
                        <CardDescription>This page is under construction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>The interface for performing cycle counts based on location will be available here.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
