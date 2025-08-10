import { supabase  } from '../services/supabaseClient';
import { ApiResponse, UserStatistics } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

export const getUserStatistics = async (userId: string): Promise<ApiResponse<UserStatistics>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data, error } = await supabase
      .from('user_statistics')
      .select(`
        *,
        user:profiles!user_statistics_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch user statistics', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in getUserStatistics:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const updateUserStatistics = async (userId: string, updates: Partial<UserStatistics>): Promise<ApiResponse<UserStatistics>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Remove read-only fields
    const { id, user_id, created_at, updated_at, user, ...validUpdates } = updates;

    const { data, error } = await supabase
      .from('user_statistics')
      .update({
        ...validUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(`
        *,
        user:profiles!user_statistics_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to update user statistics', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in updateUserStatistics:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const initializeUserStatistics = async (userId: string): Promise<ApiResponse<UserStatistics>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if statistics already exist
    const { data: existingStats } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingStats) {
      return { data: existingStats };
    }

    const { data, error } = await supabase
      .from('user_statistics')
      .insert([{
        user_id: userId,
        total_offers: 0,
        accepted_offers: 0,
        rejected_offers: 0,
        pending_offers: 0,
        total_views: 0,
        total_messages_sent: 0,
        total_messages_received: 0,
        avg_response_time_hours: 0,
        success_rate: 0,
        created_at: new Date().toISOString()
      }])
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error in initializeUserStatistics:', error);
      return { error: { code: error.code || 'unknown', message: error.message, details: error.details } };
    }

    return { data };
  } catch (error: any) {
    console.error('Error in initializeUserStatistics:', error);
    return { error: { code: error.code || 'unknown', message: error.message, details: error.details } };
  }
};

export const incrementUserStatistic = async (
  userId: string,
  field: keyof Pick<UserStatistics,
    'total_offers' |
    'accepted_offers' |
    'rejected_offers' |
    'pending_offers' |
    'total_views' |
    'total_messages_sent' |
    'total_messages_received'
  >,
  amount: number = 1
): Promise<ApiResponse<UserStatistics>> => {
  try {
    if (!userId || !field) {
      throw new ValidationError('User ID and field are required');
    }

    const { data, error } = await supabase.rpc('increment_user_statistic', {
      p_user_id: userId,
      p_field: field,
      p_amount: amount
    });

    if (error) {
      throw new DatabaseError('Failed to increment user statistic', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in incrementUserStatistic:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const updateUserResponseTime = async (
  userId: string,
  responseTimeInSeconds: number
): Promise<ApiResponse<UserStatistics>> => {
  try {
    if (!userId || responseTimeInSeconds === undefined) {
      throw new ValidationError('User ID and response time are required');
    }

    const { data: currentStats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('avg_response_time_hours, total_offers')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new DatabaseError('Failed to fetch current statistics', fetchError);
    }

    // Calculate new average response time
    const totalResponses = currentStats.total_offers;
    const currentAverage = currentStats.avg_response_time_hours || 0;
    const responseTimeInHours = responseTimeInSeconds / 3600; // Convert seconds to hours
    const newAverage = ((currentAverage * totalResponses) + responseTimeInHours) / (totalResponses + 1);

    const { data, error } = await supabase
      .from('user_statistics')
      .update({
        avg_response_time_hours: newAverage,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(`
        *,
        user:profiles!user_statistics_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to update response time', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in updateUserResponseTime:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const updateCompletionRate = async (userId: string): Promise<ApiResponse<UserStatistics>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data: stats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('total_offers, accepted_offers')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new DatabaseError('Failed to fetch statistics', fetchError);
    }

    const completionRate = stats.total_offers > 0
      ? (stats.accepted_offers / stats.total_offers) * 100
      : 0;

    const { data, error } = await supabase
      .from('user_statistics')
      .update({
        success_rate: completionRate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(`
        *,
        user:profiles!user_statistics_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to update completion rate', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in updateCompletionRate:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
}; 