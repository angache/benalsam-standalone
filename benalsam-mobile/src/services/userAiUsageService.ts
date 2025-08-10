import { supabase  } from '../services/supabaseClient';

export interface UserAiUsage {
  id: string;
  user_id: string;
  month_key: string;
  attempts_used: number;
  monthly_limit: number;
  is_premium: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface AiUsageCheck {
  can_use: boolean;
  attempts_left: number;
  total_attempts: number;
  monthly_limit: number;
  is_premium: boolean;
}

export interface AiUsageStats {
  attempts: number;
  attempts_left: number;
  is_premium: boolean;
  can_use: boolean;
  current_month: string;
  monthly_limit: number;
}

// Kullanıcının AI kullanımını kontrol et
export const checkUserAiUsage = async (
  userId: string,
  monthKey?: string
): Promise<AiUsageCheck> => {
  try {
    const currentMonth = monthKey || new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .rpc('check_user_ai_usage', {
        p_user_id: userId,
        p_month_key: currentMonth
      });

    if (error) {
      console.error('❌ AI usage check error:', error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    // Varsayılan değerler
    return {
      can_use: true,
      attempts_left: 30,
      total_attempts: 0,
      monthly_limit: 30,
      is_premium: false
    };
  } catch (error) {
    console.error('❌ AI usage check error:', error);
    // Hata durumunda kullanıma izin ver
    return {
      can_use: true,
      attempts_left: 30,
      total_attempts: 0,
      monthly_limit: 30,
      is_premium: false
    };
  }
};

// AI kullanımını kaydet
export const recordAiUsage = async (
  userId: string,
  monthKey?: string
): Promise<void> => {
  try {
    const currentMonth = monthKey || new Date().toISOString().slice(0, 7);
    
    const { error } = await supabase
      .rpc('record_ai_usage', {
        p_user_id: userId,
        p_month_key: currentMonth
      });

    if (error) {
      console.error('❌ AI usage record error:', error);
      throw error;
    }

    console.log(`📝 AI usage recorded for user ${userId} in ${currentMonth}`);
  } catch (error) {
    console.error('❌ AI usage record error:', error);
    throw error;
  }
};

// Kullanıcı AI kullanım istatistiklerini al
export const getUserAiUsageStats = async (userId: string): Promise<AiUsageStats> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_key', currentMonth)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ AI usage stats error:', error);
      throw error;
    }

    if (data) {
      const attemptsLeft = data.is_premium ? -1 : Math.max(0, data.monthly_limit - data.attempts_used);
      const canUse = data.is_premium || data.attempts_used < data.monthly_limit;

      return {
        attempts: data.attempts_used,
        attempts_left: attemptsLeft,
        is_premium: data.is_premium,
        can_use: canUse,
        current_month: data.month_key,
        monthly_limit: data.monthly_limit
      };
    }

    // Kayıt yoksa varsayılan değerler
    return {
      attempts: 0,
      attempts_left: 30,
      is_premium: false,
      can_use: true,
      current_month: currentMonth,
      monthly_limit: 30
    };
  } catch (error) {
    console.error('❌ AI usage stats error:', error);
    return {
      attempts: 0,
      attempts_left: 30,
      is_premium: false,
      can_use: true,
      current_month: new Date().toISOString().slice(0, 7),
      monthly_limit: 30
    };
  }
};

// Premium durumunu güncelle
export const updateUserPremiumStatus = async (
  userId: string,
  isPremium: boolean,
  monthlyLimit: number = 30
): Promise<void> => {
  try {
    const { error } = await supabase
      .rpc('update_user_premium_status', {
        p_user_id: userId,
        p_is_premium: isPremium,
        p_monthly_limit: monthlyLimit
      });

    if (error) {
      console.error('❌ Premium status update error:', error);
      throw error;
    }

    console.log(`👑 Premium status updated for user ${userId}: ${isPremium}`);
  } catch (error) {
    console.error('❌ Premium status update error:', error);
    throw error;
  }
};

// Kullanıcının tüm aylık kullanım geçmişini al
export const getUserAiUsageHistory = async (userId: string): Promise<UserAiUsage[]> => {
  try {
    const { data, error } = await supabase
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .order('month_key', { ascending: false });

    if (error) {
      console.error('❌ AI usage history error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ AI usage history error:', error);
    return [];
  }
};

// Aylık kullanım istatistikleri (admin için)
export const getMonthlyAiUsageStats = async (monthKey?: string): Promise<{
  total_users: number;
  total_attempts: number;
  premium_users: number;
  average_attempts: number;
}> => {
  try {
    const currentMonth = monthKey || new Date().toISOString().slice(0, 7);
    
    const { data, error } = await supabase
      .from('user_ai_usage')
      .select('*')
      .eq('month_key', currentMonth);

    if (error) {
      console.error('❌ Monthly AI usage stats error:', error);
      throw error;
    }

    const totalUsers = data?.length || 0;
    const totalAttempts = data?.reduce((sum, usage) => sum + usage.attempts_used, 0) || 0;
    const premiumUsers = data?.filter(usage => usage.is_premium).length || 0;
    const averageAttempts = totalUsers > 0 ? totalAttempts / totalUsers : 0;

    return {
      total_users: totalUsers,
      total_attempts: totalAttempts,
      premium_users: premiumUsers,
      average_attempts: Math.round(averageAttempts * 100) / 100
    };
  } catch (error) {
    console.error('❌ Monthly AI usage stats error:', error);
    return {
      total_users: 0,
      total_attempts: 0,
      premium_users: 0,
      average_attempts: 0
    };
  }
}; 