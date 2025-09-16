
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateCycleCountPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Create Cycle Count</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>New Cycle Count</CardTitle>
                        <CardDescription>This page is under construction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>The form to create a new cycle count will be available here soon.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
