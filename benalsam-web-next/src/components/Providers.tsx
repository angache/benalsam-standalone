'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { useState } from 'react'

/**
 * All app providers combined
 * - AuthProvider for global auth state
 * - NotificationProvider for message notifications
 * - ThemeProvider for dark/light mode
 * - QueryClientProvider for React Query
 * - Toaster for toast notifications
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <AuthProvider>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
          <ReactQueryDevtools 
            initialIsOpen={false} 
            buttonPosition="bottom-left"
          />
        </QueryClientProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

