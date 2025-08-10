import { supabase  } from '../services/supabaseClient';
import { ApiResponse, MonthlyUsageStats } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

export const getCurrentMonthStats = async (userId: string): Promise<ApiResponse<MonthlyUsageStats>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await supabase
      .from('monthly_usage_stats')
      .select(`
        *,
        user:profiles!monthly_usage_stats_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch current month stats', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in getCurrentMonthStats:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getMonthlyStats = async (userId: string, month: string): Promise<ApiResponse<MonthlyUsageStats>> => {
  try {
    if (!userId || !month) {
      throw new ValidationError('User ID and month are required');
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new ValidationError('Month must be in YYYY-MM format');
    }

    const { data, error } = await supabase
      .from('monthly_usage_stats')
      .select(`
        *,
        user:profiles!monthly_usage_stats_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch monthly stats', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in getMonthlyStats:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const initializeMonthlyStats = async (userId: string, month: string): Promise<ApiResponse<MonthlyUsageStats>> => {
  try {
    if (!userId || !month) {
      throw new ValidationError('User ID and month are required');
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new ValidationError('Month must be in YYYY-MM format');
    }

    // Check if stats already exist for this month
    const { data: existingStats } = await supabase
      .from('monthly_usage_stats')
      .select('id')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (existingStats) {
      throw new ValidationError('Monthly stats already exist');
    }

    const { data, error } = await supabase
      .from('monthly_usage_stats')
      .insert([{
        user_id: userId,
        month,
        total_listings_created: 0,
        total_offers_made: 0,
        total_offers_received: 0,
        total_messages_sent: 0,
        total_reviews_given: 0,
        total_reviews_received: 0,
        total_successful_trades: 0,
        total_views_received: 0,
        total_favorites_received: 0,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        user:profiles!monthly_usage_stats_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to initialize monthly stats', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in initializeMonthlyStats:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const incrementMonthlyStatistic = async (
  userId: string,
  field: keyof Pick<MonthlyUsageStats,
    'total_listings_created' |
    'total_offers_made' |
    'total_offers_received' |
    'total_messages_sent' |
    'total_reviews_given' |
    'total_reviews_received' |
    'total_successful_trades' |
    'total_views_received' |
    'total_favorites_received'
  >,
  amount: number = 1
): Promise<ApiResponse<MonthlyUsageStats>> => {
  try {
    if (!userId || !field) {
      throw new ValidationError('User ID and field are required');
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Ensure stats exist for current month
    const { data: existingStats } = await supabase
      .from('monthly_usage_stats')
      .select('id')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    if (!existingStats) {
      await initializeMonthlyStats(userId, currentMonth);
    }

    const { data, error } = await supabase.rpc('increment_monthly_statistic', {
      p_user_id: userId,
      p_month: currentMonth,
      p_field: field,
      p_amount: amount
    });

    if (error) {
      throw new DatabaseError('Failed to increment monthly statistic', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in incrementMonthlyStatistic:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getMonthlyStatsHistory = async (
  userId: string,
  limit: number = 12
): Promise<ApiResponse<MonthlyUsageStats[]>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data, error } = await supabase
      .from('monthly_usage_stats')
      .select(`
        *,
        user:profiles!monthly_usage_stats_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to fetch monthly stats history', error);
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getMonthlyStatsHistory:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
}; 