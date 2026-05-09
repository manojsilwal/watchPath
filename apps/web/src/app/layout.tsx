import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AppToaster } from '@/components/app-toaster';
import { AuthProvider } from '@/components/auth-provider';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WatchPath AI',
  description: 'Find where to watch any movie — legally, cheaply, and without fake links.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground">
        <AuthProvider>
          <SiteHeader />
          {children}
          <AppToaster />
        </AuthProvider>
      </body>
    </html>
  );
}
