import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'Market Place',
  description: 'Warehouse optimization and task management platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABeElEQVR4AcWXW2rCQBCG/xYvYdJt8QB6AV3rCuid9AR6A72B3oB38R5aU5uCBWiFBEfSAs3YfbGnBEY2DRgYmP/MPzPzL5nMLH+sLV/8YABwB5yA23EAfA+vY4S2s115+wW2wz36A6TA7SAdcCVk/wHwD3gDNgDnwCwCbzD8t3f9A7yAr+oAzsAjYAT84U4vAKvAFrAEnoBvwL/vAG/ABfAcuAM+gBcY/b7e+wP01gGeAPyB4e8t3QGgA3wDXt+eC7sBfIGh79cRcAoYgTdgE+yB4T8+AF6AD+AGeLoBfA0cgc9g+AtbBvAJOARmOQLgO+AD8JoBjzVncg3gG9u2APwEflhrCwVAhA+wAy4B+C6A63351gV2A183wF9g+Lu3AXi2AZwF73kKXA80k6U+dAV45tQd/uYV4H1eAGs/2PFxLQDvBdhxADwN7R1ZgdcA1kFjBwD5gSsi9QOoQG++Hg/A1V3AduAGuALmAYB3WtsA8BG4D80AYWp1A5wA04bOxa5A6+v2wA8c/P2LL/7g//AJnKd3kQc79C0AAAAASUVORK5CYII=" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased h-full')}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
