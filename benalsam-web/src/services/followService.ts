import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { User } from 'benalsam-shared-types';

// Follow relationship interface
interface FollowRelationship {
  follower_id: string;
  following_id: string;
  created_at?: string;
  already_following?: boolean;
}

export const followUser = async (followerId: string, followingId: string): Promise<FollowRelationship | null> => {
  if (!followerId || !followingId) {
    toast({ title: "Hata", description: "Takip eden veya takip edilen kullanıcı ID'si eksik.", variant: "destructive" });
    return null;
  }
  if (followerId === followingId) {
    toast({ title: "Hata", description: "Kullanıcı kendini takip edemez.", variant: "destructive" });
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
        toast({ title: "Bilgi", description: "Bu kullanıcıyı zaten takip ediyorsunuz." });
        return { follower_id: followerId, following_id: followingId, already_following: true };
      }
      console.error('Error following user:', error);
      toast({ title: "Takip Edilemedi", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: "Takip Edildi", description: "Kullanıcı başarıyla takip edildi." });
    return data as FollowRelationship;
  } catch (e) {
    console.error('Unexpected error in followUser:', e);
    toast({ title: "Beklenmedik Hata", description: "Kullanıcı takip edilirken bir hata oluştu.", variant: "destructive" });
    return null;
  }
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<boolean> => {
  if (!followerId || !followingId) {
    toast({ title: "Hata", description: "Takip eden veya takip edilen kullanıcı ID'si eksik.", variant: "destructive" });
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
      toast({ title: "Takipten Çıkılamadı", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Takipten Çıkıldı", description: "Kullanıcı takipten çıkarıldı." });
    return true;
  } catch (e) {
    console.error('Unexpected error in unfollowUser:', e);
    toast({ title: "Beklenmedik Hata", description: "Kullanıcı takipten çıkarılırken bir hata oluştu.", variant: "destructive" });
    return false;
  }
};

export const checkIfFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
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

export const fetchFollowingUsers = async (userId: string): Promise<User[]> => {
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
      toast({ title: "Takip Edilenler Yüklenemedi", description: error.message, variant: "destructive" });
      return [];
    }
    
    return data.map(follow => ({
        ...follow.profiles,
        followed_at: follow.created_at 
    })) as User[];
  } catch (e) {
    console.error('Unexpected error in fetchFollowingUsers:', e);
    toast({ title: "Beklenmedik Hata", description: "Takip edilenler yüklenirken bir hata oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchFollowers = async (userId: string): Promise<User[]> => {
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
      toast({ title: "Takipçiler Yüklenemedi", description: error.message, variant: "destructive" });
      return [];
    }
    
    return data.map(follow => ({
        ...follow.profiles,
        followed_at: follow.created_at 
    })) as User[];
  } catch (e) {
    console.error('Unexpected error in fetchFollowers:', e);
    toast({ title: "Beklenmedik Hata", description: "Takipçiler yüklenirken bir hata oluştu.", variant: "destructive" });
    return [];
  }
};

// Additional functions from mobile version
export const getFollowStats = async (userId: string): Promise<{
  followersCount: number;
  followingCount: number;
} | null> => {
  if (!userId) return null;
  
  try {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    return {
      followersCount: followersResult.count || 0,
      followingCount: followingResult.count || 0
    };
  } catch (error) {
    console.error('Error getting follow stats:', error);
    return null;
  }
};

export const getMutualFollowers = async (userId1: string, userId2: string): Promise<User[]> => {
  if (!userId1 || !userId2) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        profiles:follower_id (id, name, avatar_url, bio)
      `)
      .eq('following_id', userId1)
      .in('follower_id', 
        supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', userId2)
      );

    if (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }

    return data.map(item => item.profiles) as User[];
  } catch (error) {
    console.error('Error getting mutual followers:', error);
    return [];
  }
}; 