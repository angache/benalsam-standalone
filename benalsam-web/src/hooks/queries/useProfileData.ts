import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserReviews } from '@/services/reviewService';
import { checkIfFollowing } from '@/services/followService';

// Profile bilgilerini getiren hook
export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

// Kullanıcı ilanlarını getiren hook
export const useUserListings = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-listings', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('listings')
        .select('*, user:profiles!user_id(id, name, avatar_url, rating)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

// Kullanıcı yorumlarını getiren hook
export const useUserReviews = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return await fetchUserReviews(userId);
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

// Takip durumunu kontrol eden hook
export const useFollowStatus = (followerId: string | undefined, followingId: string | undefined) => {
  return useQuery({
    queryKey: ['follow-status', followerId, followingId],
    queryFn: async () => {
      if (!followerId || !followingId) return false;
      return await checkIfFollowing(followerId, followingId);
    },
    enabled: !!(followerId && followingId && followerId !== followingId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    retry: 1,
    retryDelay: 500,
  });
};

// Tüm profile verilerini paralel olarak getiren hook
export const useProfileData = (userId: string | undefined, currentUserId: string | undefined) => {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['profile', userId],
        queryFn: async () => {
          if (!userId) throw new Error('User ID is required');
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;
          return data;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      {
        queryKey: ['user-listings', userId],
        queryFn: async () => {
          if (!userId) throw new Error('User ID is required');
          
          const { data, error } = await supabase
            .from('listings')
            .select('*, user:profiles!user_id(id, name, avatar_url, rating)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        },
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      {
        queryKey: ['user-reviews', userId],
        queryFn: async () => {
          if (!userId) throw new Error('User ID is required');
          return await fetchUserReviews(userId);
        },
        enabled: !!userId,
        staleTime: 3 * 60 * 1000,
        gcTime: 8 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
      },
      {
        queryKey: ['follow-status', currentUserId, userId],
        queryFn: async () => {
          if (!currentUserId || !userId || currentUserId === userId) return false;
          return await checkIfFollowing(currentUserId, userId);
        },
        enabled: !!(currentUserId && userId && currentUserId !== userId),
        staleTime: 1 * 60 * 1000,
        gcTime: 3 * 60 * 1000,
        retry: 1,
        retryDelay: 500,
      },
    ],
  });

  const [profileQuery, listingsQuery, reviewsQuery, followQuery] = queries;

  return {
    profile: profileQuery.data,
    listings: listingsQuery.data || [],
    reviews: reviewsQuery.data || [],
    isFollowing: followQuery.data || false,
    isLoading: profileQuery.isLoading || listingsQuery.isLoading || reviewsQuery.isLoading,
    isError: profileQuery.isError || listingsQuery.isError || reviewsQuery.isError,
    error: profileQuery.error || listingsQuery.error || reviewsQuery.error,
    refetch: () => {
      profileQuery.refetch();
      listingsQuery.refetch();
      reviewsQuery.refetch();
      followQuery.refetch();
    },
  };
}; 