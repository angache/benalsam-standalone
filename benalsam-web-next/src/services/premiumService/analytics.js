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
  'review_received'
];

export const getUserDashboardStats = async (userId) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
      p_user_id: userId
    });
    
    if (error) {
      logger.error('[PremiumService] Error getting dashboard stats', { error });
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    logger.error('[PremiumService] Error getting dashboard stats', { error });
    return null;
  }
};

export const getUserRecentActivities = async (userId, limit = 10) => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase.rpc('get_user_recent_activities', {
      p_user_id: userId,
      p_limit: limit
    });
    
    if (error) {
      logger.error('[PremiumService] Error getting recent activities', { error });
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('[PremiumService] Error getting recent activities', { error });
    return [];
  }
};

export const getUserCategoryStats = async (userId) => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase.rpc('get_user_category_stats', {
      p_user_id: userId
    });
    
    if (error) {
      logger.error('[PremiumService] Error getting category stats', { error });
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('[PremiumService] Error getting category stats', { error });
    return [];
  }
};

export const addUserActivity = async (userId, activityType, title, description = '', relatedId = null) => {
  if (!userId || !activityType || !title) {
    logger.error('[PremiumService] Missing required parameters for user activity');
    return false;
  }
  
  if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
    logger.error('[PremiumService] Invalid activity type', { activityType, validTypes: VALID_ACTIVITY_TYPES });
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
      logger.error('[PremiumService] Error adding user activity', { error });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[PremiumService] Error adding user activity', { error });
    return false;
  }
};

export const updateUserStatistics = async (userId, updates) => {
  if (!userId || !updates) return false;
  
  try {
    const { data, error } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      logger.error('[PremiumService] Error updating user statistics', { error });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[PremiumService] Error updating user statistics', { error });
    return false;
  }
};

export const updateCategoryStats = async (userId, category, offerCount, successCount, totalValue) => {
  if (!userId || !category) return false;
  
  try {
    const { data, error } = await supabase
      .from('user_category_stats')
      .upsert({
        user_id: userId,
        category: category,
        offer_count: offerCount,
        success_count: successCount,
        total_value: totalValue,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      logger.error('[PremiumService] Error updating category stats', { error });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[PremiumService] Error updating category stats', { error });
    return false;
  }
};

export const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return { trend: 'up', value: 100 };
  
  const change = ((current - previous) / previous) * 100;
  return {
    trend: change >= 0 ? 'up' : 'down',
    value: Math.abs(Math.round(change))
  };
};

export const calculatePerformanceMetrics = (stats) => {
  if (!stats) return {};
  
  const totalOffers = stats.total_offers || 0;
  const acceptedOffers = stats.accepted_offers || 0;
  const rejectedOffers = stats.rejected_offers || 0;
  const totalViews = stats.total_views || 0;
  
  return {
    successRate: totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0,
    responseRate: totalOffers > 0 ? Math.round(((acceptedOffers + rejectedOffers) / totalOffers) * 100) : 0,
    viewsPerOffer: totalOffers > 0 ? Math.round(totalViews / totalOffers) : 0,
    avgResponseTime: stats.avg_response_time_hours || 0
  };
};