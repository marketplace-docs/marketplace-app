
'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const showToast = sessionStorage.getItem('showLoginSuccessToast');
            if (showToast) {
                toast({
                    title: "Welcome To Fulfillment Marketplace",
                    className: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                });
                sessionStorage.removeItem('showLoginSuccessToast');
            }
        }
    }, [isClient, toast]);

    return (
      <MainLayout>
        <div className="w-full">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome to the dashboard.</p>
        </div>
      </MainLayout>
    );
}

    