import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/production-logger';

const VALID_ACTIVITY_TYPES = [
  'listing_created',
  'listing_updated', 
  'listing_deleted',
  'offer_sent',
  'offer_received',
  'offer_accepted',
  'offer_rejected',
  'message_sent',
  'profile_updated',
  'favorite_added',
  'review_given',
  'review_received',
  'listing_viewed'
];

const LISTING_HISTORY_KEY = 'benalsam_listing_history';
const LAST_SEARCH_KEY = 'benalsam_last_search';

/**
 * Adds a user activity to the database.
 * 
 * Valid activity types:
 * - listing_created, listing_updated, listing_deleted
 * - offer_sent, offer_received, offer_accepted, offer_rejected
 * - message_sent, profile_updated, favorite_added
 * - review_given, review_received, listing_viewed
 * 
 * @param userId - The UUID of the user
 * @param activityType - Type of activity (must be in VALID_ACTIVITY_TYPES)
 * @param title - Activity title
 * @param description - Optional activity description
 * @param relatedId - Optional related entity ID (e.g., listing ID, message ID)
 * @returns Promise resolving to true if successful, false otherwise
 * 
 * @example
 * ```typescript
 * await addUserActivity(
 *   'user-123',
 *   'listing_created',
 *   'Yeni İlan Oluşturuldu',
 *   'iPhone 13 ilanı oluşturuldu',
 *   'listing-456'
 * )
 * ```
 */
export const addUserActivity = async (userId: string, activityType: string, title: string, description: string = '', relatedId: string | null = null): Promise<boolean> => {
  if (!userId || !activityType || !title) {
    logger.error('[UserActivityService] Missing required parameters for user activity');
    return false;
  }
  
  if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
    logger.error(`[UserActivityService] Invalid activity type: ${activityType}`, { validTypes: VALID_ACTIVITY_TYPES });
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_title: title,
        activity_description: description,
        related_id: relatedId
      });
    
    if (error) {
      logger.error('[UserActivityService] Error adding user activity', { error });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[UserActivityService] Error adding user activity', { error });
    return false;
  }
};

/**
 * Fetches user activities from the database.
 * Returns activities ordered by creation date (newest first).
 * 
 * @param userId - The UUID of the user
 * @param limit - Maximum number of activities to return (default: 20)
 * @returns Promise resolving to array of activity objects
 * 
 * @example
 * ```typescript
 * const activities = await getUserActivities('user-123', 50)
 * activities.forEach(activity => {
 *   console.log(activity.activity_title)
 * })
 * ```
 */
export const getUserActivities = async (userId: string, limit: number = 20) => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error('[UserActivityService] Error getting user activities', { error });
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('[UserActivityService] Error getting user activities', { error });
    return [];
  }
};

export const getRecentActivities = async (userId: string, limit: number = 10) => {
  return getUserActivities(userId, limit);
};

export const deleteUserActivity = async (activityId: string, userId: string): Promise<boolean> => {
  if (!activityId || !userId) return false;
  
  try {
    const { error } = await supabase
      .from('user_activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('[UserActivityService] Error deleting user activity', { error });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[UserActivityService] Error deleting user activity', { error });
    return false;
  }
};

export const clearUserActivities = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { error } = await supabase
      .from('user_activities')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      logger.error('[UserActivityService] Error clearing user activities', { error });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[UserActivityService] Error clearing user activities', { error });
    return false;
  }
};

/**
 * Adds a listing ID to the user's viewing history in localStorage.
 * Maintains a maximum of 20 most recent listings.
 * 
 * @param listingId - The UUID of the listing to add
 * 
 * @example
 * ```typescript
 * addToListingHistory('listing-123')
 * const history = getListingHistory() // ['listing-123', ...]
 * ```
 */
export const addToListingHistory = (listingId: string) => {
  if (!listingId) return;
  
  try {
    const history = getListingHistory();
    const updatedHistory = [listingId, ...history.filter(id => id !== listingId)].slice(0, 20);
    localStorage.setItem(LISTING_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    logger.error('[UserActivityService] Error adding to listing history', { error });
  }
};

export const getListingHistory = (): string[] => {
  try {
    const history = localStorage.getItem(LISTING_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    logger.error('[UserActivityService] Error getting listing history', { error });
    return [];
  }
};

export const clearListingHistory = () => {
  try {
    localStorage.removeItem(LISTING_HISTORY_KEY);
  } catch (error) {
    logger.error('[UserActivityService] Error clearing listing history', { error });
  }
};

export const saveLastSearch = (searchCriteria: Record<string, unknown>) => {
  if (!searchCriteria) return;
  
  try {
    const searchData = {
      ...searchCriteria,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(searchData));
  } catch (error) {
    logger.error('[UserActivityService] Error saving last search', { error });
  }
};

export const getLastSearch = () => {
  try {
    const lastSearch = localStorage.getItem(LAST_SEARCH_KEY);
    if (!lastSearch) return null;
    
    const searchData = JSON.parse(lastSearch);
    const searchTime = new Date(searchData.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - searchTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      localStorage.removeItem(LAST_SEARCH_KEY);
      return null;
    }
    
    return searchData;
  } catch (error) {
    logger.error('[UserActivityService] Error getting last search', { error });
    return null;
  }
};

export const clearLastSearch = () => {
  try {
    localStorage.removeItem(LAST_SEARCH_KEY);
  } catch (error) {
    logger.error('[UserActivityService] Error clearing last search', { error });
  }
}; 