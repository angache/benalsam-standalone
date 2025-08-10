import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserPremiumStatus,
  checkPremiumFeature,
  getPremiumLimits,
  getUserActivePlan,
  getUserMonthlyUsage,
  getPlanFeatures,
  createSubscription,
  checkUserPremiumStatus,
  checkOfferLimit,
  incrementUserUsage
} from '../../services/premiumService';
import { useAuthStore } from '../../stores';

// ===========================
// QUERY KEYS
// ===========================
export const premiumKeys = {
  all: ['premium'] as const,
  premiumStatus: (userId?: string) => [...premiumKeys.all, 'status', userId] as const,
  activePlan: (userId?: string) => [...premiumKeys.all, 'activePlan', userId] as const,
  monthlyUsage: (userId?: string) => [...premiumKeys.all, 'monthlyUsage', userId] as const,
  limits: (userId?: string) => [...premiumKeys.all, 'limits', userId] as const,
  features: () => [...premiumKeys.all, 'features'] as const,
  feature: (userId?: string, feature?: string) => [...premiumKeys.all, 'feature', userId, feature] as const,
  offerLimit: (userId?: string) => [...premiumKeys.all, 'offerLimit', userId] as const,
};

// ===========================
// QUERY HOOKS
// ===========================

/**
 * Kullanıcının premium abonelik durumunu getirir
 */
export const useUserPremiumStatus = (userId?: string) => {
  return useQuery({
    queryKey: premiumKeys.premiumStatus(userId),
    queryFn: () => getUserPremiumStatus(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Mevcut kullanıcının premium abonelik durumunu getirir
 */
export const useMyPremiumStatus = () => {
  const { user } = useAuthStore();
  return useUserPremiumStatus(user?.id);
};

/**
 * Kullanıcının aktif planını getirir
 */
export const useUserActivePlan = (userId?: string) => {
  return useQuery({
    queryKey: premiumKeys.activePlan(userId),
    queryFn: () => getUserActivePlan(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 15 * 60 * 1000, // 15 dakika
  });
};

/**
 * Mevcut kullanıcının aktif planını getirir
 */
export const useMyActivePlan = () => {
  const { user } = useAuthStore();
  return useUserActivePlan(user?.id);
};

/**
 * Kullanıcının aylık kullanım istatistiklerini getirir
 */
export const useUserMonthlyUsage = (userId?: string) => {
  return useQuery({
    queryKey: premiumKeys.monthlyUsage(userId),
    queryFn: () => getUserMonthlyUsage(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 dakika (kullanım sık değişir)
    gcTime: 5 * 60 * 1000, // 5 dakika
  });
};

/**
 * Mevcut kullanıcının aylık kullanım istatistiklerini getirir
 */
export const useMyMonthlyUsage = () => {
  const { user } = useAuthStore();
  return useUserMonthlyUsage(user?.id);
};

/**
 * Kullanıcının premium limitlerini getirir
 */
export const useUserPremiumLimits = (userId?: string) => {
  return useQuery({
    queryKey: premiumKeys.limits(userId),
    queryFn: () => getPremiumLimits(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 15 * 60 * 1000, // 15 dakika
  });
};

/**
 * Mevcut kullanıcının premium limitlerini getirir
 */
export const useMyPremiumLimits = () => {
  const { user } = useAuthStore();
  return useUserPremiumLimits(user?.id);
};

/**
 * Tüm plan özelliklerini getirir (static data)
 */
export const usePlanFeatures = () => {
  return useQuery({
    queryKey: premiumKeys.features(),
    queryFn: getPlanFeatures,
    staleTime: 60 * 60 * 1000, // 1 saat (static data)
    gcTime: 2 * 60 * 60 * 1000, // 2 saat
  });
};

/**
 * Belirli bir premium özellik erişimini kontrol eder
 */
export const usePremiumFeature = (feature?: string) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: premiumKeys.feature(user?.id, feature),
    queryFn: () => checkPremiumFeature(user?.id!, feature!),
    enabled: !!user?.id && !!feature,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * Kullanıcının teklif verme limitini kontrol eder
 */
export const useOfferLimit = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: premiumKeys.offerLimit(user?.id),
    queryFn: () => checkOfferLimit(user?.id!),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 saniye (limit kontrolleri sık)
    gcTime: 2 * 60 * 1000, // 2 dakika
  });
};

/**
 * Kullanıcının premium durumunu kontrol eder (alternative method)
 */
export const useCheckUserPremiumStatus = (userId?: string) => {
  return useQuery({
    queryKey: [...premiumKeys.premiumStatus(userId), 'check'],
    queryFn: () => checkUserPremiumStatus(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

// ===========================
// MUTATION HOOKS
// ===========================

/**
 * Premium abonelik oluşturma mutation'ı
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ planSlug, paymentMethod = 'stripe' }: { planSlug: string; paymentMethod?: string }) =>
      createSubscription(user?.id!, planSlug, paymentMethod),
    onSuccess: () => {
      // Premium-related cache'leri invalidate et
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: premiumKeys.premiumStatus(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: premiumKeys.activePlan(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: premiumKeys.limits(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: premiumKeys.monthlyUsage(user.id)
        });
      }
    },
    onError: (error) => {
      console.error('Subscription creation failed:', error);
    }
  });
};

/**
 * Kullanım artırma mutation'ı
 */
export const useIncrementUsage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (feature: string) => incrementUserUsage(user?.id!, feature),
    onSuccess: () => {
      // Monthly usage cache'ini invalidate et
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: premiumKeys.monthlyUsage(user.id)
        });
        queryClient.invalidateQueries({
          queryKey: premiumKeys.offerLimit(user.id)
        });
      }
    }
  });
};

// ===========================
// HELPER HOOKS
// ===========================

/**
 * Kullanıcının premium durumunu kapsamlı şekilde kontrol eder
 */
export const useIsPremiumUser = () => {
  const { data: premiumStatus, isLoading: statusLoading } = useMyPremiumStatus();
  const { data: activePlan, isLoading: planLoading } = useMyActivePlan();
  
  const isPremium = premiumStatus?.status === 'active' || !!activePlan;
  const planType = activePlan?.plan_slug || premiumStatus?.plan_type || 'basic';
  
  return {
    isPremium,
    planType,
    premiumStatus,
    activePlan,
    isLoading: statusLoading || planLoading,
  };
};

/**
 * Premium özellikleri için toplu kontrol hook'u
 */
export const usePremiumFeatures = () => {
  const { data: featuredAccess } = usePremiumFeature('featured_listing');
  const { data: urgentAccess } = usePremiumFeature('urgent_listing');
  const { data: showcaseAccess } = usePremiumFeature('showcase_listing');
  const { data: analyticsAccess } = usePremiumFeature('analytics');
  const { data: prioritySupport } = usePremiumFeature('priority_support');

  return {
    canUseFeatured: featuredAccess,
    canUseUrgent: urgentAccess,
    canUseShowcase: showcaseAccess,
    canUseAnalytics: analyticsAccess,
    hasPrioritySupport: prioritySupport,
  };
};

/**
 * Premium işlemlerini kolaylaştıran helper hook
 */
export const usePremiumActions = () => {
  const createSubscriptionMutation = useCreateSubscription();
  const incrementUsageMutation = useIncrementUsage();
  const { data: planFeatures } = usePlanFeatures();
  const { data: myLimits } = useMyPremiumLimits();
  const { data: myUsage } = useMyMonthlyUsage();

  const subscribeToPlan = async (planSlug: string, paymentMethod?: string) => {
    try {
      const result = await createSubscriptionMutation.mutateAsync({ planSlug, paymentMethod });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const trackUsage = async (feature: string) => {
    try {
      await incrementUsageMutation.mutateAsync(feature);
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  const getRemainingUsage = (feature: string) => {
    if (!myLimits || !myUsage) return null;
    
    const limit = (myLimits as any)[feature] || 0;
    const used = (myUsage as any)[feature] || 0;
    
    return limit === -1 ? 'unlimited' : Math.max(0, limit - used);
  };

  const canUseFeature = (feature: string) => {
    const remaining = getRemainingUsage(feature);
    return remaining === 'unlimited' || (typeof remaining === 'number' && remaining > 0);
  };

  return {
    // Actions
    subscribeToPlan,
    trackUsage,
    
    // Utilities
    getRemainingUsage,
    canUseFeature,
    
    // Data
    planFeatures,
    myLimits,
    myUsage,
    
    // Loading states
    isSubscribing: createSubscriptionMutation.isPending,
    subscriptionError: createSubscriptionMutation.error,
  };
}; 