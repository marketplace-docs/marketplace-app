
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
            });
            sessionStorage.removeItem('showLoginSuccessToast');
        }
    }, [toast]);

    return (
      <MainLayout>
        <div className="w-full max-w-7xl">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome to the dashboard.</p>
        </div>
      </MainLayout>
    );
}
