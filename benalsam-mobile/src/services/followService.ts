import { supabase  } from '../services/supabaseClient';

export const followUser = async (followerId: string, followingId: string) => {
  if (!followerId || !followingId) {
    return null;
  }
  if (followerId === followingId) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .insert([{ follower_id: followerId, following_id: followingId }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { 
        return { follower_id: followerId, following_id: followingId, already_following: true };
      }
      console.error('Error following user:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Unexpected error in followUser:', e);
    return null;
  }
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  if (!followerId || !followingId) {
    return false;
  }
  try {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Unexpected error in unfollowUser:', e);
    return false;
  }
};

export const checkIfFollowing = async (followerId: string, followingId: string) => {
  if (!followerId || !followingId) {
    return false;
  }
  try {
    const { data, error, count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
    return (count || 0) > 0;
  } catch (e) {
    console.error('Unexpected error in checkIfFollowing:', e);
    return false;
  }
};

export const fetchFollowingUsers = async (userId: string) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        created_at,
        profiles:following_id (id, name, avatar_url, bio, followers_count, following_count)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching following users:', error);
      return [];
    }
    
    return data.map(follow => ({
        ...follow.profiles,
        followed_at: follow.created_at 
    }));
  } catch (e) {
    console.error('Unexpected error in fetchFollowingUsers:', e);
    return [];
  }
};

export const fetchFollowers = async (userId: string) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        created_at,
        profiles:follower_id (id, name, avatar_url, bio, followers_count, following_count)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
    
    return data.map(follow => ({
        ...follow.profiles,
        followed_at: follow.created_at 
    }));
  } catch (e) {
    console.error('Unexpected error in fetchFollowers:', e);
    return [];
  }
}; 