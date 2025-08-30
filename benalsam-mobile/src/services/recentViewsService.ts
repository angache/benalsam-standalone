import { supabase } from './supabaseClient';
import { ListingWithUser } from './listingService/core';

export interface RecentView {
  id: string;
  user_id: string;
  listing_id: string;
  viewed_at: string;
  listing?: ListingWithUser;
}

export interface RecentViewsResponse {
  recentViews: RecentView[];
  totalCount: number;
}

/**
 * Kullanıcının son görüntülediği ilanları getir
 */
export const getRecentViews = async (
  userId: string,
  limit: number = 8
): Promise<RecentViewsResponse> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log('👁️ Getting recent views for user:', userId);

    const { data: recentViews, error } = await supabase
      .from('user_behaviors')
      .select(`
        id,
        user_id,
        listing_id,
        created_at,
        listings!inner(
          id,
          title,
          description,
          budget,
          category,
          condition,
          location,
          image_url,
          main_image_url,
          additional_image_urls,
          views_count,
          favorites_count,
          created_at,
          status,
          profiles!inner(
            id,
            name,
            avatar_url,
            rating,
            trust_score
          )
        )
      `)
      .eq('user_id', userId)
      .eq('action', 'view')
      .eq('listings.status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent views:', error);
      throw new Error(`Failed to fetch recent views: ${error.message}`);
    }

    // Transform data to match ListingWithUser format
    const transformedViews: RecentView[] = (recentViews || []).map((view: any) => ({
      id: view.id,
      user_id: view.user_id,
      listing_id: view.listing_id,
      viewed_at: view.created_at,
      listing: view.listings as unknown as ListingWithUser,
    }));

    console.log('👁️ Recent views found:', transformedViews.length);

    return {
      recentViews: transformedViews,
      totalCount: transformedViews.length,
    };
  } catch (error) {
    console.error('Error in getRecentViews:', error);
    throw error;
  }
};

/**
 * Son görüntülenen ilanları temizle (eski kayıtları sil)
 */
export const clearOldRecentViews = async (userId: string, daysToKeep: number = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('user_behaviors')
      .delete()
      .eq('user_id', userId)
      .eq('action', 'view')
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error clearing old recent views:', error);
    } else {
      console.log('👁️ Old recent views cleared');
    }
  } catch (error) {
    console.error('Error in clearOldRecentViews:', error);
  }
}; 