'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ChatbotProvider } from '@/contexts/ChatbotContext'
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
            // Request deduplication is enabled by default in React Query
            // Multiple components requesting the same query will share the same request
            refetchOnMount: true, // Refetch if data is stale
            refetchOnReconnect: true, // Refetch when connection is restored
            // Background refetch configuration
            refetchInterval: false, // Disable by default, enable per-query if needed
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
            <ChatbotProvider>
              {children}
              <Toaster />
            </ChatbotProvider>
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

