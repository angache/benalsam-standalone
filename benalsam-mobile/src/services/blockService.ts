import { supabase  } from '../services/supabaseClient';

interface BlockedUserData {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string;
}

interface BlockedUser {
  blocked_user_id: string;
  blocked_at: string;
  blocked_user: BlockedUserData[];
}

export const blockUser = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('block_user', {
      blocked_user_id: userId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { data: null, error };
  }
};

export const unblockUser = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('unblock_user', {
      blocked_user_id: userId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { data: null, error };
  }
};

export const isUserBlocked = async (blockedUserId: string) => {
  try {
    const { data, error } = await supabase.rpc('is_user_blocked', {
      blocker_id: (await supabase.auth.getUser()).data.user?.id,
      blocked_id: blockedUserId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return { data: null, error };
  }
};

export const getBlockedUsers = async (): Promise<{ data: BlockedUser[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        blocked_user_id,
        blocked_at,
        blocked_user:blocked_user_id (
          id,
          username,
          name,
          avatar_url
        )
      `)
      .order('blocked_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return { data: null, error };
  }
}; 