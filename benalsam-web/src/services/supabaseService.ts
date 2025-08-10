import { processImagesForSupabase } from '@/services/imageService';
import { 
    getOrCreateConversation as getOrCreateConversationService,
    fetchMessages as fetchMessagesService,
    sendMessage as sendMessageService,
    fetchConversationDetails as fetchConversationDetailsService,
    subscribeToMessages as subscribeToMessagesService
} from '@/services/conversationService';
import {
    createOffer as createOfferService,
    fetchSentOffers as fetchSentOffersService,
    fetchReceivedOffers as fetchReceivedOffersService,
    updateOfferStatus as updateOfferStatusService,
    deleteOffer as deleteOfferService
} from '@/services/offerService';
import {
    createReview as createReviewService,
    fetchUserReviews as fetchUserReviewsService,
    canUserReview as canUserReviewService
} from '@/services/reviewService';
import {
    createListingReport as createListingReportService
} from '@/services/reportService';
import {
    addFavorite as addFavoriteService,
    removeFavorite as removeFavoriteService,
    fetchUserFavoriteListings as fetchUserFavoriteListingsService,
    fetchUserFavoriteStatusForListings as fetchUserFavoriteStatusForListingsService
} from '@/services/favoriteService';
import {
    followUser as followUserService,
    unfollowUser as unfollowUserService,
    checkIfFollowing as checkIfFollowingService,
    fetchFollowingUsers as fetchFollowingUsersService,
    fetchFollowers as fetchFollowersService
} from '@/services/followService';
import {
    followCategory as followCategoryService,
    unfollowCategory as unfollowCategoryService,
    checkIfFollowingCategory as checkIfFollowingCategoryService,
    fetchFollowedCategories as fetchFollowedCategoriesService,
    fetchListingsForFollowedCategories as fetchListingsForFollowedCategoriesService
} from '@/services/categoryFollowService';
import {
    fetchListings as fetchListingsService,
    createListing as createListingService,
    updateListingStatus as updateListingStatusService,
    deleteListing as deleteListingService
} from '@/services/listingService';
import {
    fetchUserProfile as fetchUserProfileService
} from '@/services/profileService';
import {
    fetchInventoryItems as fetchInventoryItemsService,
    addInventoryItem as addInventoryItemService,
    updateInventoryItem as updateInventoryItemService,
    deleteInventoryItem as deleteInventoryItemService
} from '@/services/inventoryService';

export { 
    processImagesForSupabase,
    getOrCreateConversationService as getOrCreateConversation,
    fetchMessagesService as fetchMessages,
    sendMessageService as sendMessage,
    fetchConversationDetailsService as fetchConversationDetails,
    subscribeToMessagesService as subscribeToMessages,
    createOfferService as createOffer,
    fetchSentOffersService as fetchSentOffers,
    fetchReceivedOffersService as fetchReceivedOffers,
    updateOfferStatusService as updateOfferStatus,
    deleteOfferService as deleteOffer,
    createReviewService as createReview,
    fetchUserReviewsService as fetchUserReviews,
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
    fetchUserProfileService as fetchUserProfile,
    fetchInventoryItemsService as fetchInventoryItems,
    addInventoryItemService as addInventoryItem,
    updateInventoryItemService as updateInventoryItem,
    deleteInventoryItemService as deleteInventoryItem
}; 