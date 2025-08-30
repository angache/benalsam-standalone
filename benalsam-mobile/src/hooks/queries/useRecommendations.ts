import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSmartRecommendations, 
  trackUserBehavior, 
  analyzeUserPreferences,
  type RecommendationResult,
  type UserBehavior,
  type UserPreferences
} from '../../services/recommendationService';
import { useAuthStore } from '../../stores';

/**
 * Smart recommendations hook
 */
export const useSmartRecommendations = (
  limit = 10,
  algorithm: 'hybrid' | 'collaborative' | 'content' | 'popularity' | 'seller' = 'hybrid'
) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['smart-recommendations', user?.id, limit, algorithm],
    queryFn: () => getSmartRecommendations(user?.id || '', limit, algorithm),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * User preferences analysis hook
 */
export const useUserPreferencesAnalysis = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['user-preferences-analysis', user?.id],
    queryFn: () => analyzeUserPreferences(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 dakika
    gcTime: 60 * 60 * 1000, // 1 saat
    retry: 1,
  });
};

/**
 * User behavior tracking mutation
 */
export const useTrackUserBehavior = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: ({ 
      listingId, 
      action, 
      metadata 
    }: { 
      listingId: string; 
      action: UserBehavior['action']; 
      metadata?: Partial<UserBehavior>;
    }) => {
      // Anonymous user'lar için session-based tracking
      const userId = user?.id || `anonymous_${Date.now()}`;
      return trackUserBehavior(userId, listingId, action, metadata);
    },
    onSuccess: () => {
      // Invalidate recommendations to refresh them (sadece authenticated user'lar için)
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['smart-recommendations'] });
        queryClient.invalidateQueries({ queryKey: ['user-preferences-analysis'] });
      }
    },
    onError: (error) => {
      console.error('Error tracking user behavior:', error);
      // Analytics hatası kritik değil, sadece log
    },
  });
};

/**
 * View tracking hook (convenience)
 */
export const useTrackView = () => {
  const trackBehavior = useTrackUserBehavior();
  
  return {
    trackView: (listingId: string, metadata?: Partial<UserBehavior>) => {
      return trackBehavior.mutate({
        listingId,
        action: 'view',
        metadata,
      });
    },
    isLoading: trackBehavior.isPending,
  };
};

/**
 * Favorite tracking hook (convenience)
 */
export const useTrackFavorite = () => {
  const trackBehavior = useTrackUserBehavior();
  
  return {
    trackFavorite: (listingId: string, metadata?: Partial<UserBehavior>) => {
      return trackBehavior.mutate({
        listingId,
        action: 'favorite',
        metadata,
      });
    },
    isLoading: trackBehavior.isPending,
  };
};

/**
 * Offer tracking hook (convenience)
 */
export const useTrackOffer = () => {
  const trackBehavior = useTrackUserBehavior();
  
  return {
    trackOffer: (listingId: string, metadata?: Partial<UserBehavior>) => {
      return trackBehavior.mutate({
        listingId,
        action: 'offer',
        metadata,
      });
    },
    isLoading: trackBehavior.isPending,
  };
};

/**
 * Contact tracking hook (convenience)
 */
export const useTrackContact = () => {
  const trackBehavior = useTrackUserBehavior();
  
  return {
    trackContact: (listingId: string, metadata?: Partial<UserBehavior>) => {
      return trackBehavior.mutate({
        listingId,
        action: 'contact',
        metadata,
      });
    },
    isLoading: trackBehavior.isPending,
  };
};

/**
 * Seller-focused recommendations hook
 * Kullanıcının envanterine göre öneriler
 */
export const useSellerRecommendations = (limit = 8) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['seller-recommendations', user?.id, limit],
    queryFn: () => getSmartRecommendations(user?.id || '', limit, 'seller'),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 20 * 60 * 1000, // 20 dakika
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 