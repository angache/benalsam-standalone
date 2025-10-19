import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: 1000,
      // Performance optimizations
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: false, // Don't refetch on component mount if data exists
    },
    mutations: {
      retry: 1, // Reduce mutation retries
      retryDelay: 500,
    },
  },
})

