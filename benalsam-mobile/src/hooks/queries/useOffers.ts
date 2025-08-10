import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { queryKeys } from '../../lib/queryClient';
import {
  createOffer,
  fetchOfferDetails,
  updateOfferStatus,
  getSentOffers,
  getReceivedOffers,
  deleteOffer,
} from '../../services/offerService';
import { checkOfferLimit } from '../../services/premiumService';
import { Offer } from '../../types';

// ================================
// OFFER QUERY HOOKS
// ================================

// Sent offers hook
export const useSentOffers = (options?: UseQueryOptions<Offer[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<Offer[], Error>({
    queryKey: ['sent-offers', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error('User ID is required');
        const offers = await getSentOffers(user.id);
        return offers;
      } catch (error) {
        console.error('Error fetching sent offers:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 dakika fresh - offers sık değişir
    ...options,
  });
};

// Received offers hook
export const useReceivedOffers = (options?: UseQueryOptions<Offer[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<Offer[], Error>({
    queryKey: ['received-offers', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error('User ID is required');
        const offers = await getReceivedOffers(user.id);
        return offers;
      } catch (error) {
        console.error('Error fetching received offers:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 dakika fresh - offers sık değişir
    ...options,
  });
};

// Single offer details hook
export const useOfferDetails = (
  offerId: string,
  options?: UseQueryOptions<Offer, Error>
) => {
  return useQuery<Offer, Error>({
    queryKey: ['offer-details', offerId],
    queryFn: () => fetchOfferDetails(offerId),
    enabled: !!offerId,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh - offer details az değişir
    ...options,
  });
};

// Check offer limit hook (premium feature)


// ================================
// OFFER MUTATION HOOKS
// ================================

// Create offer mutation
export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation<Offer, Error, Partial<Offer>>({
    mutationFn: (offerData) => createOffer({
      ...offerData,
      offering_user_id: user?.id,
    }),
    
    onMutate: async (offerData) => {
      if (!user?.id) return;
      
      await queryClient.cancelQueries({ queryKey: ['sent-offers', user.id] });
      
      const previousSentOffers = queryClient.getQueryData<Offer[]>(['sent-offers', user.id]);
      
      if (previousSentOffers) {
        const optimisticOffer = {
          id: `temp-${Date.now()}`,
          ...offerData,
          offering_user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          is_optimistic: true,
        } as Offer;
        
        queryClient.setQueryData(['sent-offers', user.id], [optimisticOffer, ...previousSentOffers]);
      }
      
      return { previousSentOffers };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousSentOffers && user?.id) {
        queryClient.setQueryData(['sent-offers', user.id], context.previousSentOffers);
      }
    },
    
    onSuccess: (data, variables) => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['sent-offers', user.id] });
        queryClient.invalidateQueries({ queryKey: ['offer-limit', user.id] });
        
        if (variables.listing_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(variables.listing_id) });
        }
      }
    },
  });
};

// Update offer status mutation
export const useUpdateOfferStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation<Offer, Error, { offerId: string; newStatus: Offer['status'] }>({
    mutationFn: ({ offerId, newStatus }) => updateOfferStatus(offerId, newStatus),
    
    onMutate: async ({ offerId, newStatus }) => {
      if (!user?.id) return;
      
      await queryClient.cancelQueries({ queryKey: ['received-offers', user.id] });
      
      const previousReceivedOffers = queryClient.getQueryData<Offer[]>(['received-offers', user.id]);
      
      if (previousReceivedOffers) {
        const updatedOffers = previousReceivedOffers.map(offer => 
          offer.id === offerId 
            ? { ...offer, status: newStatus, updated_at: new Date().toISOString() }
            : offer
        );
        queryClient.setQueryData(['received-offers', user.id], updatedOffers);
      }
      
      const previousOfferDetails = queryClient.getQueryData<Offer>(['offer-details', offerId]);
      if (previousOfferDetails) {
        queryClient.setQueryData(['offer-details', offerId], {
          ...previousOfferDetails,
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previousReceivedOffers, previousOfferDetails };
    },
    
    onError: (err, variables, context) => {
      if (user?.id) {
        if (context?.previousReceivedOffers) {
          queryClient.setQueryData(['received-offers', user.id], context.previousReceivedOffers);
        }
        if (context?.previousOfferDetails) {
          queryClient.setQueryData(['offer-details', variables.offerId], context.previousOfferDetails);
        }
      }
    },
    
    onSuccess: (data, variables) => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['received-offers', user.id] });
        queryClient.invalidateQueries({ queryKey: ['offer-details', variables.offerId] });
        
        if (variables.newStatus === 'accepted') {
          queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
        }
      }
    },
  });
};

// Delete offer mutation
export const useDeleteOffer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation<void, Error, string>({
    mutationFn: (offerId) => deleteOffer(offerId),
    
    onMutate: async (offerId) => {
      if (!user?.id) return;
      
      await queryClient.cancelQueries({ queryKey: ['sent-offers', user.id] });
      
      const previousSentOffers = queryClient.getQueryData<Offer[]>(['sent-offers', user.id]);
      
      if (previousSentOffers) {
        const updatedOffers = previousSentOffers.filter(offer => offer.id !== offerId);
        queryClient.setQueryData(['sent-offers', user.id], updatedOffers);
      }
      
      return { previousSentOffers };
    },
    
    onError: (err, offerId, context) => {
      if (context?.previousSentOffers && user?.id) {
        queryClient.setQueryData(['sent-offers', user.id], context.previousSentOffers);
      }
    },
    
    onSuccess: (data, offerId) => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['sent-offers', user.id] });
        queryClient.removeQueries({ queryKey: ['offer-details', offerId] });
      }
    },
  });
};

// ================================
// HELPER HOOKS
// ================================

// Combined offer actions hook for easier usage
export const useOfferActions = () => {
  const createOfferMutation = useCreateOffer();
  const updateOfferStatusMutation = useUpdateOfferStatus();
  const deleteOfferMutation = useDeleteOffer();
  
  return {
    // Actions
    createOffer: createOfferMutation.mutateAsync,
    updateOfferStatus: updateOfferStatusMutation.mutateAsync,
    deleteOffer: deleteOfferMutation.mutateAsync,
    
    // Loading states
    isCreating: createOfferMutation.isPending,
    isUpdating: updateOfferStatusMutation.isPending,
    isDeleting: deleteOfferMutation.isPending,
    
    // Any action loading
    isLoading: createOfferMutation.isPending || updateOfferStatusMutation.isPending || deleteOfferMutation.isPending,
    
    // Errors
    createError: createOfferMutation.error,
    updateError: updateOfferStatusMutation.error,
    deleteError: deleteOfferMutation.error,
    
    // Success states
    createSuccess: createOfferMutation.isSuccess,
    updateSuccess: updateOfferStatusMutation.isSuccess,
    deleteSuccess: deleteOfferMutation.isSuccess,
  };
};

// Quick accept/reject helper
export const useOfferDecision = () => {
  const updateOfferStatusMutation = useUpdateOfferStatus();
  
  const acceptOffer = (offerId: string) => {
    return updateOfferStatusMutation.mutateAsync({ offerId, newStatus: 'accepted' });
  };
  
  const rejectOffer = (offerId: string) => {
    return updateOfferStatusMutation.mutateAsync({ offerId, newStatus: 'rejected' });
  };
  
  return {
    acceptOffer,
    rejectOffer,
    isLoading: updateOfferStatusMutation.isPending,
    error: updateOfferStatusMutation.error,
  };
}; 