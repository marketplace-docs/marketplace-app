
'use client';

import { MainLayout } from '@/components/layout/main-layout';

export default function DashboardPage() {
    return (
      <MainLayout>
        <div className="w-full max-w-7xl">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome to the dashboard.</p>
        </div>
      </MainLayout>
    );
}
