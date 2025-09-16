
'use client';

import { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SetupDbPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCreateTable = async (tableName: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/setup-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: tableName }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to create table ${tableName}.`);
            }

            toast({
                title: 'Success',
                description: result.message,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Database Setup</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Initialize Database Tables</CardTitle>
                        <CardDescription>
                            Use this page to create the necessary tables in your Supabase database. 
                            Click the button for the table you want to create. This action is safe to run multiple times.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <p className="font-medium">Cycle Count Documents Table:</p>
                            <Button onClick={() => handleCreateTable('cycle_count_docs')} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create `cycle_count_docs`
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
