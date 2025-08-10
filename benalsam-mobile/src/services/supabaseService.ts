import { processImagesForSupabase } from './imageService';
import { 
    getOrCreateConversation as getOrCreateConversationService,
    fetchMessages as fetchMessagesService,
    sendMessage as sendMessageService,
    fetchConversationDetails as fetchConversationDetailsService
} from './conversationService';
import {
    createOffer as createOfferService,
    getSentOffers as getSentOffersService,
    getReceivedOffers as getReceivedOffersService,
    updateOfferStatus as updateOfferStatusService,
    deleteOffer as deleteOfferService
} from './offerService';
import {
    createReview as createReviewService,
    getUserReviews as getUserReviewsService,
    canUserReview as canUserReviewService
} from './reviewService';
import {
    createListingReport as createListingReportService
} from './reportService';
import {
    addFavorite as addFavoriteService,
    removeFavorite as removeFavoriteService,
    fetchUserFavoriteListings as fetchUserFavoriteListingsService,
    fetchUserFavoriteStatusForListings as fetchUserFavoriteStatusForListingsService
} from './favoriteService';
import {
    followUser as followUserService,
    unfollowUser as unfollowUserService,
    checkIfFollowing as checkIfFollowingService,
    fetchFollowingUsers as fetchFollowingUsersService,
    fetchFollowers as fetchFollowersService
} from './followService';
import {
    followCategory as followCategoryService,
    unfollowCategory as unfollowCategoryService,
    checkIfFollowingCategory as checkIfFollowingCategoryService,
    fetchFollowedCategories as fetchFollowedCategoriesService,
    fetchListingsForFollowedCategories as fetchListingsForFollowedCategoriesService
} from './categoryFollowService';
import {
    fetchListings as fetchListingsService,
    createListing as createListingService,
    updateListingStatus as updateListingStatusService,
    deleteListing as deleteListingService,
    fetchAttributeStatistics as fetchAttributeStatisticsService,
    searchByAttributeValues as searchByAttributeValuesService
} from './listingService';
import {
    fetchUserProfile as fetchUserProfileService
} from './profileService';
import {
    fetchInventoryItems as fetchInventoryItemsService,
    addInventoryItem as addInventoryItemService,
    updateInventoryItem as updateInventoryItemService,
    deleteInventoryItem as deleteInventoryItemService
} from './inventoryService';
import { supabase  } from '../services/supabaseClient';
import { User, UserProfile, AuthCredentials, RegisterData, ApiResponse } from '../types';
import { AuthenticationError, DatabaseError, ValidationError, handleError } from '../utils/errors';

export { 
    processImagesForSupabase,
    getOrCreateConversationService as getOrCreateConversation,
    fetchMessagesService as fetchMessages,
    sendMessageService as sendMessage,
    fetchConversationDetailsService as fetchConversationDetails,
    createOfferService as createOffer,
    getSentOffersService as getSentOffers,
    getReceivedOffersService as getReceivedOffers,
    updateOfferStatusService as updateOfferStatus,
    deleteOfferService as deleteOffer,
    createReviewService as createReview,
    getUserReviewsService as getUserReviews,
    canUserReviewService as canUserReview,
    createListingReportService as createListingReport,
    addFavoriteService as addFavorite,
    removeFavoriteService as removeFavorite,
    fetchUserFavoriteListingsService as fetchUserFavoriteListings,
    fetchUserFavoriteStatusForListingsService as fetchUserFavoriteStatusForListings,
    followUserService as followUser,
    unfollowUserService as unfollowUser,
    checkIfFollowingService as checkIfFollowing,
    fetchFollowingUsersService as fetchFollowingUsers,
    fetchFollowersService as fetchFollowers,
    followCategoryService as followCategory,
    unfollowCategoryService as unfollowCategory,
    checkIfFollowingCategoryService as checkIfFollowingCategory,
    fetchFollowedCategoriesService as fetchFollowedCategories,
    fetchListingsForFollowedCategoriesService as fetchListingsForFollowedCategories,
    fetchListingsService as fetchListings,
    createListingService as createListing,
    updateListingStatusService as updateListingStatus,
    deleteListingService as deleteListing,
    fetchAttributeStatisticsService as fetchAttributeStatistics,
    searchByAttributeValuesService as searchByAttributeValues,
    fetchUserProfileService as fetchUserProfile,
    fetchInventoryItemsService as fetchInventoryItems,
    addInventoryItemService as addInventoryItem,
    updateInventoryItemService as updateInventoryItem,
    deleteInventoryItemService as deleteInventoryItem
};



export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

export const resetPassword = async (email: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new AuthenticationError('Failed to send password reset email', error);
    }

    return { data: true };
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return { error: handleError(error).error };
  }
};

export const updatePassword = async (newPassword: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!newPassword) {
      throw new ValidationError('New password is required');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new AuthenticationError('Failed to update password', error);
    }

    return { data: true };
  } catch (error) {
    console.error('Error in updatePassword:', error);
    return { error: handleError(error).error };
  }
};

export { supabase };





export const subscribeToMessagesChannel = (channelId: string, callback: (message: any) => void) => {
  const subscription = supabase
    .channel(`messages:${channelId}`)
    .on('INSERT', (payload: any) => {
      callback(payload.new);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}; 