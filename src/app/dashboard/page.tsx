
'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
    const { toast } = useToast();

    useEffect(() => {
        const showToast = sessionStorage.getItem('showLoginSuccessToast');
        if (showToast) {
            toast({
                title: "Welcome To Fulfillment Marketplace",
                description: "You have successfully logged in.",
            });
            sessionStorage.removeItem('showLoginSuccessToast');
        }
    }, [toast]);

    return (
      <MainLayout>
        <div className="w-full space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Dashboard content has been cleared.</p>
            </div>
        </div>
      </MainLayout>
    );
}
