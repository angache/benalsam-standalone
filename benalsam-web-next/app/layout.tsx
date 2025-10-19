'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
