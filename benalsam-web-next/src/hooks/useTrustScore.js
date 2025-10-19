import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores';
import { calculateTrustScore, updateTrustScore } from '../services/trustScoreService';

// Query keys
export const trustScoreKeys = {
  all: ['trustScore'],
  user: (userId) => [...trustScoreKeys.all, 'user', userId],
  current: () => [...trustScoreKeys.all, 'current'],
};

/**
 * Kullanıcının trust score'unu getirir
 */
export const useTrustScore = (userId) => {
  const { currentUser } = useAuthStore();
  const targetUserId = userId || currentUser?.id;

  return useQuery({
    queryKey: trustScoreKeys.user(targetUserId),
    queryFn: () => calculateTrustScore(targetUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Mevcut kullanıcının trust score'unu getirir
 */
export const useCurrentUserTrustScore = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: trustScoreKeys.current(),
    queryFn: () => calculateTrustScore(currentUser?.id),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Trust score güncelleme mutation'ı
 */
export const useUpdateTrustScore = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: updateTrustScore,
    onSuccess: (data, userId) => {
      // Trust score cache'ini güncelle
      queryClient.setQueryData(trustScoreKeys.user(userId), data);
      
      // Mevcut kullanıcı ise current query'yi de güncelle
      if (userId === currentUser?.id) {
        queryClient.setQueryData(trustScoreKeys.current(), data);
      }
    },
  });
};

/**
 * Trust score actions hook'u
 */
export const useTrustScoreActions = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  const refreshTrustScore = async (userId) => {
    const targetUserId = userId || currentUser?.id;
    
    try {
      // Cache'i invalidate et
      await queryClient.invalidateQueries({
        queryKey: trustScoreKeys.user(targetUserId),
      });
      
      // Mevcut kullanıcı ise current query'yi de invalidate et
      if (targetUserId === currentUser?.id) {
        await queryClient.invalidateQueries({
          queryKey: trustScoreKeys.current(),
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error refreshing trust score:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    refreshTrustScore,
  };
}; 