import { supabase } from '@/lib/supabaseClient';

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

export const addUserActivity = async (userId: string, activityType: string, title: string, description: string = '', relatedId: string | null = null): Promise<boolean> => {
  if (!userId || !activityType || !title) {
    console.error('Missing required parameters for user activity');
    return false;
  }
  
  if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
    console.error(`Invalid activity type: ${activityType}. Valid types:`, VALID_ACTIVITY_TYPES);
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
      console.error('Error adding user activity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding user activity:', error);
    return false;
  }
};

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
      console.error('Error getting user activities:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting user activities:', error);
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
      console.error('Error deleting user activity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting user activity:', error);
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
      console.error('Error clearing user activities:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing user activities:', error);
    return false;
  }
};

export const addToListingHistory = (listingId: string) => {
  if (!listingId) return;
  
  try {
    const history = getListingHistory();
    const updatedHistory = [listingId, ...history.filter(id => id !== listingId)].slice(0, 20);
    localStorage.setItem(LISTING_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error adding to listing history:', error);
  }
};

export const getListingHistory = (): string[] => {
  try {
    const history = localStorage.getItem(LISTING_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting listing history:', error);
    return [];
  }
};

export const clearListingHistory = () => {
  try {
    localStorage.removeItem(LISTING_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing listing history:', error);
  }
};

export const saveLastSearch = (searchCriteria: any) => {
  if (!searchCriteria) return;
  
  try {
    const searchData = {
      ...searchCriteria,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(searchData));
  } catch (error) {
    console.error('Error saving last search:', error);
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
    console.error('Error getting last search:', error);
    return null;
  }
};

export const clearLastSearch = () => {
  try {
    localStorage.removeItem(LAST_SEARCH_KEY);
  } catch (error) {
    console.error('Error clearing last search:', error);
  }
}; 