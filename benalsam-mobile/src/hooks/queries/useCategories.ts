import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { queryKeys } from '../../lib/queryClient';
import {
  followCategory,
  unfollowCategory,
  checkIfFollowingCategory,
  fetchFollowedCategories,
  fetchListingsForFollowedCategories,
  FollowedCategory,
  CategoryWithListings as ServiceCategoryWithListings,
} from '../../services/categoryFollowService';
import {
  followUser,
  unfollowUser,
  checkIfFollowing,
  fetchFollowingUsers,
  fetchFollowers,
} from '../../services/followService';
import { ListingWithUser } from '../../services/listingService/core';

// Types
interface CategoryWithListings {
  category_name: string;
  created_at: string;
  listings: ListingWithUser[];
}

// ================================
// CATEGORY FOLLOWING HOOKS
// ================================

// User's followed categories hook
export const useFollowedCategories = (options?: UseQueryOptions<FollowedCategory[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<FollowedCategory[], Error>({
    queryKey: queryKeys.categories.followed(user?.id || ''),
    queryFn: async () => {
      const result = await fetchFollowedCategories(user?.id || '');
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch followed categories');
      }
      return result.data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh - categories az değişir
    ...options,
  });
};

// Listings for followed categories hook
export const useFollowedCategoryListings = (
  limitPerCategory = 3,
  options?: UseQueryOptions<ServiceCategoryWithListings[], Error>
) => {
  const { user } = useAuthStore();
  
  return useQuery<ServiceCategoryWithListings[], Error>({
    queryKey: queryKeys.categories.listings(user?.id || '', limitPerCategory),
    queryFn: async () => {
      const result = await fetchListingsForFollowedCategories(user?.id || '', limitPerCategory, user?.id || null);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch category listings');
      }
      return result.data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 dakika fresh - listings sık değişir
    ...options,
  });
};

// Check if following a category hook
export const useIsCategoryFollowing = (
  categoryName: string,
  options?: UseQueryOptions<boolean, Error>
) => {
  const { user } = useAuthStore();
  
  return useQuery<boolean, Error>({
    queryKey: ['category-following-status', user?.id, categoryName],
    queryFn: async () => {
      const result = await checkIfFollowingCategory(user?.id || '', categoryName);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to check category follow status');
      }
      return result.data || false;
    },
    enabled: !!user?.id && !!categoryName,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh
    ...options,
  });
};

// Follow category mutation
export const useFollowCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (categoryName: string) => followCategory(user?.id || '', categoryName),
    
    onMutate: async (categoryName: string) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.followed(user.id) });
      
      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<any[]>(queryKeys.categories.followed(user.id));
      
      // Optimistically add the new category
      if (previousCategories) {
        const newCategory = {
          category_name: categoryName,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData(queryKeys.categories.followed(user.id), [...previousCategories, newCategory]);
      }
      
      // Update follow status
      queryClient.setQueryData(['category-following-status', user.id, categoryName], true);
      
      return { previousCategories };
    },
    
    onError: (err, categoryName, context) => {
      // Rollback on error
      if (context?.previousCategories && user?.id) {
        queryClient.setQueryData(queryKeys.categories.followed(user.id), context.previousCategories);
        queryClient.setQueryData(['category-following-status', user.id, categoryName], false);
      }
    },
    
    onSettled: (data, error, categoryName) => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.followed(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.listings(user.id) });
        queryClient.invalidateQueries({ queryKey: ['category-following-status', user.id, categoryName] });
      }
    },
  });
};

// Unfollow category mutation
export const useUnfollowCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (categoryName: string) => unfollowCategory(user?.id || '', categoryName),
    
    onMutate: async (categoryName: string) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.followed(user.id) });
      
      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<any[]>(queryKeys.categories.followed(user.id));
      
      // Optimistically remove the category
      if (previousCategories) {
        const updatedCategories = previousCategories.filter(cat => cat.category_name !== categoryName);
        queryClient.setQueryData(queryKeys.categories.followed(user.id), updatedCategories);
      }
      
      // Update follow status
      queryClient.setQueryData(['category-following-status', user.id, categoryName], false);
      
      return { previousCategories };
    },
    
    onError: (err, categoryName, context) => {
      // Rollback on error
      if (context?.previousCategories && user?.id) {
        queryClient.setQueryData(queryKeys.categories.followed(user.id), context.previousCategories);
        queryClient.setQueryData(['category-following-status', user.id, categoryName], true);
      }
    },
    
    onSettled: (data, error, categoryName) => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.followed(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.listings(user.id) });
        queryClient.invalidateQueries({ queryKey: ['category-following-status', user.id, categoryName] });
      }
    },
  });
};

// ================================
// USER FOLLOWING HOOKS
// ================================

// User's following list hook
export const useFollowingUsers = (
  userId?: string,
  options?: UseQueryOptions<any[], Error>
) => {
  const { user } = useAuthStore();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['following-users', targetUserId],
    queryFn: () => fetchFollowingUsers(targetUserId || ''),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh
    ...options,
  });
};

// User's followers list hook
export const useFollowers = (
  userId?: string,
  options?: UseQueryOptions<any[], Error>
) => {
  const { user } = useAuthStore();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['followers', targetUserId],
    queryFn: () => fetchFollowers(targetUserId || ''),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh
    ...options,
  });
};

// Check if following a user hook
export const useIsUserFollowing = (
  followingUserId: string,
  options?: UseQueryOptions<boolean, Error>
) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['user-following-status', user?.id, followingUserId],
    queryFn: () => checkIfFollowing(user?.id || '', followingUserId),
    enabled: !!user?.id && !!followingUserId && user?.id !== followingUserId,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh
    ...options,
  });
};

// Follow user mutation
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (followingUserId: string) => followUser(user?.id || '', followingUserId),
    
    onMutate: async (followingUserId: string) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Update follow status
      queryClient.setQueryData(['user-following-status', user.id, followingUserId], true);
      
      return { followingUserId };
    },
    
    onError: (err, followingUserId, context) => {
      // Rollback on error
      if (user?.id && context?.followingUserId) {
        queryClient.setQueryData(['user-following-status', user.id, followingUserId], false);
      }
    },
    
    onSettled: (data, error, followingUserId) => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['following-users', user.id] });
        queryClient.invalidateQueries({ queryKey: ['followers', followingUserId] });
        queryClient.invalidateQueries({ queryKey: ['user-following-status', user.id, followingUserId] });
      }
    },
  });
};

// Unfollow user mutation
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (followingUserId: string) => unfollowUser(user?.id || '', followingUserId),
    
    onMutate: async (followingUserId: string) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Update follow status
      queryClient.setQueryData(['user-following-status', user.id, followingUserId], false);
      
      return { followingUserId };
    },
    
    onError: (err, followingUserId, context) => {
      // Rollback on error
      if (user?.id && context?.followingUserId) {
        queryClient.setQueryData(['user-following-status', user.id, followingUserId], true);
      }
    },
    
    onSettled: (data, error, followingUserId) => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['following-users', user.id] });
        queryClient.invalidateQueries({ queryKey: ['followers', followingUserId] });
        queryClient.invalidateQueries({ queryKey: ['user-following-status', user.id, followingUserId] });
      }
    },
  });
};

// ================================
// HELPER HOOKS
// ================================

// Toggle category follow helper hook
export const useToggleCategoryFollow = () => {
  const followCategoryMutation = useFollowCategory();
  const unfollowCategoryMutation = useUnfollowCategory();
  
  const toggleCategoryFollow = async (categoryName: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      return unfollowCategoryMutation.mutateAsync(categoryName);
    } else {
      return followCategoryMutation.mutateAsync(categoryName);
    }
  };
  
  return {
    toggleCategoryFollow,
    isLoading: followCategoryMutation.isPending || unfollowCategoryMutation.isPending,
    error: followCategoryMutation.error || unfollowCategoryMutation.error,
  };
};

// Toggle user follow helper hook
export const useToggleUserFollow = () => {
  const followUserMutation = useFollowUser();
  const unfollowUserMutation = useUnfollowUser();
  
  const toggleUserFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      return unfollowUserMutation.mutateAsync(userId);
    } else {
      return followUserMutation.mutateAsync(userId);
    }
  };
  
  return {
    toggleUserFollow,
    isLoading: followUserMutation.isPending || unfollowUserMutation.isPending,
    error: followUserMutation.error || unfollowUserMutation.error,
  };
}; 