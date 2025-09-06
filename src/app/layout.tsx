import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'Market Place',
  description: 'Warehouse optimization and task management platform.',
  icons: {
    icon: 'data:image/png;base64,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',
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
