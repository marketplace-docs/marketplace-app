'use client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
         <div className="text-2xl font-semibold">Loading...</div>
       </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 flex justify-center">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
