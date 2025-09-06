
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogActivityPage() {
  return (
    <MainLayout>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6">Log Activity</h1>
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                    This is a log of all activities in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Log activity content will be displayed here.</p>
            </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
