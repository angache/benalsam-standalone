import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview, fetchUserReviews, canUserReview } from '../../services/reviewService';
import { useAuthStore } from '../../stores';

// ===========================
// QUERY KEYS
// ===========================
export const reviewKeys = {
  all: ['reviews'] as const,
  userReviews: (userId?: string) => [...reviewKeys.all, 'user', userId] as const,
  canReview: (userId?: string, offerId?: string) => [...reviewKeys.all, 'canReview', userId, offerId] as const,
};

// ===========================
// QUERY HOOKS
// ===========================

/**
 * Kullanıcının aldığı yorumları getirir
 */
export const useUserReviews = (userId?: string) => {
  return useQuery({
    queryKey: reviewKeys.userReviews(userId),
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 5 * 60 * 1000, // 5 dakika
  });
};

/**
 * Kullanıcının belirli bir teklif için yorum yapıp yapmayacağını kontrol eder
 */
export const useCanUserReview = (offerId?: string) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: reviewKeys.canReview(user?.id, offerId),
    queryFn: () => canUserReview(user?.id!, offerId!),
    enabled: !!user?.id && !!offerId,
    staleTime: 30 * 1000, // 30 saniye (daha sık kontrol)
    gcTime: 2 * 60 * 1000, // 2 dakika
  });
};

// ===========================
// MUTATION HOOKS
// ===========================

/**
 * Yeni yorum oluşturur
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: createReview,
    onSuccess: (data, variables) => {
      // Başarılı yorum sonrası cache'i güncelle
      if (data && variables.reviewee_id) {
        // Yorum yapılan kullanıcının review listesini invalidate et
        queryClient.invalidateQueries({
          queryKey: reviewKeys.userReviews(variables.reviewee_id)
        });
        
        // Bu teklif için artık yorum yapılamayacağını göster
        queryClient.setQueryData(
          reviewKeys.canReview(user?.id, variables.offer_id),
          false
        );
        
        // Tüm canReview sorgularını invalidate et (güvenlik için)
        queryClient.invalidateQueries({
          queryKey: reviewKeys.all,
          predicate: (query) => query.queryKey.includes('canReview')
        });
      }
    },
    onError: (error) => {
      console.error('Review creation failed:', error);
    }
  });
};

// ===========================
// HELPER HOOKS
// ===========================

/**
 * Mevcut kullanıcının yorumlarını getirir
 */
export const useMyReviews = () => {
  const { user } = useAuthStore();
  return useUserReviews(user?.id);
};

/**
 * Yorum işlemlerini kolaylaştıran helper hook
 */
export const useReviewActions = () => {
  const createReviewMutation = useCreateReview();
  
  const submitReview = async (reviewData: {
    reviewee_id: string;
    offer_id: string;
    rating: number;
    comment?: string;
  }) => {
    const { user } = useAuthStore.getState();
    
    if (!user?.id) {
      throw new Error('Yorum yapmak için giriş yapmalısınız');
    }

    return createReviewMutation.mutateAsync({
      reviewer_id: user.id,
      ...reviewData
    });
  };

  return {
    submitReview,
    isSubmitting: createReviewMutation.isPending,
    error: createReviewMutation.error,
    reset: createReviewMutation.reset,
  };
}; 