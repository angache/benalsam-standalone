import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserProfile, incrementProfileView } from '../../services/profileService';
import { getUserActivities, addUserActivity } from '../../services/userActivityService';
import { useAuthStore } from '../../stores';
import { supabase  } from '../../../services/supabaseClient';

// ===========================
// QUERY KEYS
// ===========================
export const authKeys = {
  all: ['auth'] as const,
  user: (userId?: string) => [...authKeys.all, 'user', userId] as const,
  profile: (userId?: string) => [...authKeys.all, 'profile', userId] as const,
  activities: (userId?: string) => [...authKeys.all, 'activities', userId] as const,
};

// ===========================
// QUERY HOOKS
// ===========================

/**
 * Kullanıcı profil bilgilerini getirir
 */
export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: authKeys.profile(userId),
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 0, // Her zaman yeni veri çek
    gcTime: 1 * 60 * 1000, // 1 dakika
    retry: 3, // Hata durumunda 3 kez dene
    retryDelay: 1000, // Hatalar arası 1 saniye bekle
  });
};

/**
 * Mevcut kullanıcının profil bilgilerini getirir
 */
export const useMyProfile = () => {
  const { user } = useAuthStore();
  return useUserProfile(user?.id);
};

/**
 * Kullanıcı aktivitelerini getirir
 */
export const useUserActivities = (userId?: string, limit = 20) => {
  return useQuery({
    queryKey: [...authKeys.activities(userId), limit],
    queryFn: () => getUserActivities(userId!, limit),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 dakika (aktiviteler dinamik)
    gcTime: 3 * 60 * 1000, // 3 dakika
  });
};

/**
 * Mevcut kullanıcının aktivitelerini getirir
 */
export const useMyActivities = (limit = 20) => {
  const { user } = useAuthStore();
  return useUserActivities(user?.id, limit);
};



// ===========================
// MUTATION HOOKS
// ===========================

/**
 * Profil güncelleme mutation'ı
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, updateProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: any) => {
      const result = await updateProfile(updates);
      return { updates, result };
    },
    onMutate: async (updates) => {
      if (!user?.id) return;

      // Mevcut sorguları durdur
      await queryClient.cancelQueries({ queryKey: authKeys.profile(user.id) });

      // Önceki durumu sakla
      const previousProfile = queryClient.getQueryData(authKeys.profile(user.id));

      // Cache'i optimistic olarak güncelle
      queryClient.setQueryData(
        authKeys.profile(user.id),
        (oldData: any) => {
          // Avatar URL güncellemesi için özel kontrol
          if (updates.avatar_url === null) {
            const newData = { ...oldData };
            delete newData.avatar_url;
            return newData;
          }
          return { ...oldData, ...updates };
        }
      );

      return { previousProfile };
    },
    onError: (error, variables, context) => {
      // Hata durumunda eski datayı geri yükle
      if (user?.id && context?.previousProfile) {
        queryClient.setQueryData(authKeys.profile(user.id), context.previousProfile);
      }
      console.error('Profile update failed:', error);
    },
    onSettled: async (data, error, variables, context) => {
      if (!user?.id) return;

      // Cache'i yenile
      await queryClient.invalidateQueries({
        queryKey: authKeys.profile(user.id),
        exact: true,
      });

      // Veriyi hemen yeniden çek
      await queryClient.refetchQueries({
        queryKey: authKeys.profile(user.id),
        exact: true,
      });

      // İlgili diğer cache'leri de yenile
      await queryClient.invalidateQueries({
        queryKey: authKeys.all,
        exact: false,
      });
    }
  });
};

/**
 * Profil görüntülenme sayısını artırma mutation'ı
 */
export const useIncrementProfileView = () => {
  return useMutation({
    mutationFn: incrementProfileView,
    // Bu background işlem olduğu için özel handling gerekmez
  });
};

/**
 * Kullanıcı aktivitesi ekleme mutation'ı
 */
export const useAddUserActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      activityType,
      title,
      description = '',
      relatedId = null
    }: {
      activityType: string;
      title: string;
      description?: string;
      relatedId?: string | null;
    }) => addUserActivity(user?.id!, activityType, title, description, relatedId),
    onSuccess: () => {
      // Aktivite listelerini invalidate et
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: authKeys.activities(user.id)
        });
      }
    }
  });
};

/**
 * Profil güncelleme ile optimistic update
 */
export const useUpdateProfileOptimistic = () => {
  const queryClient = useQueryClient();
  const { user, updateProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: any) => {
      await updateProfile(updates);
      return updates;
    },
    onMutate: async (updates) => {
      // Optimistic update için eski datayı sakla
      const previousProfile = queryClient.getQueryData(authKeys.profile(user?.id));
      
      // Optimistic update yap
      if (user?.id) {
        queryClient.setQueryData(
          authKeys.profile(user.id),
          (oldData: any) => ({ ...oldData, ...updates })
        );
      }
      
      return { previousProfile };
    },
    onError: (error, updates, context) => {
      // Hata durumunda eski datayı geri yükle
      if (user?.id && context?.previousProfile) {
        queryClient.setQueryData(authKeys.profile(user.id), context.previousProfile);
      }
    },
    onSettled: () => {
      // Her durumda cache'i yenile
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: authKeys.profile(user.id)
        });
      }
    }
  });
};

// ===========================
// HELPER HOOKS
// ===========================



/**
 * Profil işlemlerini kolaylaştıran helper hook
 */
export const useProfileActions = () => {
  const updateProfileMutation = useUpdateProfileOptimistic();
  const addActivityMutation = useAddUserActivity();
  const incrementViewMutation = useIncrementProfileView();

  const updateProfile = async (updates: any) => {
    try {
      await updateProfileMutation.mutateAsync(updates);
      
      // Profil güncelleme aktivitesi ekle
      await addActivityMutation.mutateAsync({
        activityType: 'profile_updated',
        title: 'Profil güncellendi',
        description: 'Profil bilgileri güncellendi',
      });
    } catch (error) {
      throw error;
    }
  };

  const viewProfile = async (userId: string) => {
    // Background'da profil görüntülenme sayısını artır
    incrementViewMutation.mutate(userId);
  };

  return {
    updateProfile,
    viewProfile,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
}; 