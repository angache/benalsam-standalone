'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ChatbotProvider } from '@/contexts/ChatbotContext'
import { useState, useEffect } from 'react'
import { initPerformanceTracking } from '@/utils/performance/performance'
import { shouldEnablePerformanceTracking } from '@/config/performance'
import { useAuth } from '@/hooks/useAuth'

/**
 * Performance Tracking Initializer Component
 * Initializes performance tracking based on user role and environment
 */
function PerformanceTrackingInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    // Only initialize on client-side
    if (typeof window === 'undefined') return

    // Check if performance tracking should be enabled
    const isEnabled = shouldEnablePerformanceTracking(user)

    if (isEnabled) {
      try {
        initPerformanceTracking()
      } catch (error) {
        // Silently fail - performance tracking is non-critical
        console.error('[Providers] Failed to initialize performance tracking', error)
      }
    }
  }, [user])

  return null
}

/**
 * All app providers combined
 * - AuthProvider for global auth state
 * - NotificationProvider for message notifications
 * - ThemeProvider for dark/light mode
 * - QueryClientProvider for React Query
 * - Toaster for toast notifications
 * - Performance tracking initialization
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
              <PerformanceTrackingInitializer />
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

