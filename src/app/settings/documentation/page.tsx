
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentationPage() {
    return (
        <div className="w-full max-w-7xl space-y-8">
            <h1 className="text-3xl font-bold">Documentation</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>Welcome to the documentation. Here you will find information on how to use the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p>This is the documentation page. Information on how to use the app will be available here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
