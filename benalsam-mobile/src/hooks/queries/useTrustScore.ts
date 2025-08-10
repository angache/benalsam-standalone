import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { calculateTrustScore, updateTrustScore } from '../../services/trustScoreService';
import { supabase  } from '../../../services/supabaseClient';

// Query keys
export const trustScoreKeys = {
  all: ['trustScore'] as const,
  user: (userId: string) => [...trustScoreKeys.all, 'user', userId] as const,
  current: () => [...trustScoreKeys.all, 'current'] as const,
};

/**
 * Kullanıcının trust score'unu getirir
 */
export const useTrustScore = (userId?: string) => {
  const { user } = useAuthStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: trustScoreKeys.user(targetUserId!),
    queryFn: () => calculateTrustScore(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Public trust score hesaplama (edge function)
 */
const fetchPublicTrustScore = async (userId: string) => {
  try {
    const response = await fetch(
      `https://dnwreckpeenhbdtapmxr.supabase.co/functions/v1/calculate-trust-score`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching public trust score:', error);
    throw error;
  }
};

/**
 * Mevcut kullanıcının trust score'unu getirir (Frontend hesaplama)
 */
export const useCurrentUserTrustScore = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: trustScoreKeys.current(),
    queryFn: () => calculateTrustScore(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Belirli bir kullanıcının public trust score'unu getirir
 */
export const usePublicTrustScore = (userId: string) => {
  return useQuery({
    queryKey: trustScoreKeys.user(userId),
    queryFn: () => fetchPublicTrustScore(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Trust score güncelleme mutation'ı
 */
export const useUpdateTrustScore = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: updateTrustScore,
    onSuccess: (data, userId) => {
      // Trust score cache'ini güncelle
      queryClient.setQueryData(trustScoreKeys.user(userId), data);
      
      // Mevcut kullanıcı ise current query'yi de güncelle
      if (userId === user?.id) {
        queryClient.setQueryData(trustScoreKeys.current(), data);
      }
      
      // Profil bilgilerini de invalidate et (trust score profil içinde)
      queryClient.invalidateQueries({
        queryKey: ['profiles', 'user', userId]
      });
    },
    onError: (error) => {
      console.error('Trust score update failed:', error);
    }
  });
};

/**
 * Trust score işlemlerini kolaylaştıran helper hook
 */
export const useTrustScoreActions = () => {
  const updateTrustScoreMutation = useUpdateTrustScore();
  const { user } = useAuthStore();

  const refreshTrustScore = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    return updateTrustScoreMutation.mutateAsync(targetUserId);
  };

  return {
    refreshTrustScore,
    isUpdating: updateTrustScoreMutation.isPending,
    error: updateTrustScoreMutation.error,
    reset: updateTrustScoreMutation.reset,
  };
}; 