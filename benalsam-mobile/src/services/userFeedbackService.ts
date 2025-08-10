import { supabase  } from '../services/supabaseClient';
import { ApiResponse, UserFeedback, FeedbackType } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

const VALID_FEEDBACK_TYPES: FeedbackType[] = ['bug_report', 'feature_request', 'general_feedback', 'complaint', 'praise'];

export const createFeedback = async (feedbackData: Partial<UserFeedback>): Promise<ApiResponse<UserFeedback>> => {
  try {
    // Validate required fields
    if (!feedbackData.user_id || !feedbackData.feedback_type || !feedbackData.content) {
      throw new ValidationError('User ID, feedback type, and content are required');
    }

    // Validate feedback type
    if (!VALID_FEEDBACK_TYPES.includes(feedbackData.feedback_type)) {
      throw new ValidationError(`Invalid feedback type. Must be one of: ${VALID_FEEDBACK_TYPES.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .insert([{
        user_id: feedbackData.user_id,
        feedback_type: feedbackData.feedback_type,
        content: feedbackData.content,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        user:profiles!user_feedback_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to create feedback', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in createFeedback:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const updateFeedbackStatus = async (
  feedbackId: string,
  status: UserFeedback['status']
): Promise<ApiResponse<UserFeedback>> => {
  try {
    if (!feedbackId || !status) {
      throw new ValidationError('Feedback ID and status are required');
    }

    const validStatuses = ['pending', 'in_review', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select(`
        *,
        user:profiles!user_feedback_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to update feedback status', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in updateFeedbackStatus:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getUserFeedback = async (userId: string): Promise<ApiResponse<UserFeedback[]>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select(`
        *,
        user:profiles!user_feedback_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch user feedback', error);
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserFeedback:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getFeedbackById = async (feedbackId: string): Promise<ApiResponse<UserFeedback>> => {
  try {
    if (!feedbackId) {
      throw new ValidationError('Feedback ID is required');
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select(`
        *,
        user:profiles!user_feedback_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', feedbackId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch feedback', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in getFeedbackById:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const deleteFeedback = async (feedbackId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!feedbackId) {
      throw new ValidationError('Feedback ID is required');
    }

    const { error } = await supabase
      .from('user_feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      throw new DatabaseError('Failed to delete feedback', error);
    }

    return { data: true };
  } catch (error) {
    console.error('Error in deleteFeedback:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
}; 