import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'Market Place',
  description: 'Warehouse optimization and task management platform.',
  icons: {
    icon: 'https://storage.googleapis.com/studioprototype.appspot.com/users/studio-user-91b72e50-9a3e-4d51-a279-43a136f755a5/app-vxU1VnFhJ2E/9a95786b-a25e-49b0-9742-8a9d18e7e838_1721591834.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased h-screen')}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
