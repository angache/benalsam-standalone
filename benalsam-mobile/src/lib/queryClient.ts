import { QueryClient } from '@tanstack/react-query';

// Query Client konfigürasyonu
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache konfigürasyonu
      staleTime: 5 * 60 * 1000, // 5 dakika fresh kalır
      gcTime: 10 * 60 * 1000, // 10 dakika cache'de kalır (eski adı: cacheTime)
      
      // Network konfigürasyonu  
      retry: (failureCount, error: any) => {
        // Network hataları için 3 kez dene
        if (error?.message?.includes('Network') || error?.code === 'NETWORK_ERROR') {
          return failureCount < 3;
        }
        // 401, 403 gibi auth hataları için deneme
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Diğer hatalar için 1 kez dene
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetch ayarları
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Error handling
      throwOnError: false, // Errors will be handled in components
    },
    mutations: {
      // Mutation konfigürasyonu
      retry: (failureCount, error: any) => {
        // Network hataları için 2 kez dene
        if (error?.message?.includes('Network')) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Query keys - consistent key management
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  user: (id: string) => ['user', id] as const,
  
  // Listings
  listings: {
    all: ['listings'] as const,
    list: (filters?: any) => ['listings', 'list', filters] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    popular: () => ['listings', 'popular'] as const,
    todaysDeals: () => ['listings', 'todays-deals'] as const,
    mostOffered: () => ['listings', 'most-offered'] as const,
    filtered: (filters: any) => ['listings', 'filtered', filters] as const,
    userListings: (userId: string) => ['listings', 'user', userId] as const,
  },
  
  // Favorites
  favorites: {
    all: (userId: string) => ['favorites', userId] as const,
    status: (userId: string, listingIds: string[]) => ['favorites', 'status', userId, listingIds] as const,
  },
  
  // Conversations
  conversations: {
    all: (userId: string) => ['conversations', userId] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    unreadCounts: (userId: string) => ['conversations', 'unread-counts', userId] as const,
  },
  
  // Categories
  categories: {
    followed: (userId: string) => ['categories', 'followed', userId] as const,
    listings: (userId: string, limit?: number) => ['categories', 'listings', userId, limit] as const,
  },
  
  // Offers
  offers: {
    received: (userId: string) => ['offers', 'received', userId] as const,
    sent: (userId: string) => ['offers', 'sent', userId] as const,
  },
  
  // Premium
  premium: {
    features: (userId: string) => ['premium', 'features', userId] as const,
    analytics: (userId: string) => ['premium', 'analytics', userId] as const,
  },
  
  // Reviews
  reviews: {
    user: (userId: string) => ['reviews', 'user', userId] as const,
  },
} as const;

// Helper functions
export const invalidateListings = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
};

export const invalidateFavorites = (userId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all(userId) });
};

export const invalidateConversations = (userId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all(userId) });
}; 