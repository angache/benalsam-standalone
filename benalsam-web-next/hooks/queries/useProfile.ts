import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/services/profileService';

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });
}; 