import { useQuery } from '@tanstack/react-query';
import { getRecentViews } from '../../services/recentViewsService';
import { useAuthStore } from '../../stores';

/**
 * Kullanıcının son görüntülediği ilanları getiren hook
 */
export const useRecentViews = (limit = 8) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['recent-views', user?.id, limit],
    queryFn: () => getRecentViews(user?.id || '', limit),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 