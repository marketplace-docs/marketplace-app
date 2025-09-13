
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdateExpiredPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Update Expired</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Update Expired Product</CardTitle>
                        <CardDescription>This page is for updating expired products. Content will be available soon.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Page content will be added here.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
