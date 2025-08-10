import { supabase  } from '../../services/supabaseClient';

export const getUserPremiumStatus = async (userId: string) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_premium_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching premium status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserPremiumStatus:', error);
    return null;
  }
};

export const checkPremiumFeature = async (userId: string, feature: string) => {
  const premiumStatus = await getUserPremiumStatus(userId);
  if (!premiumStatus) return false;

  // Premium özellik kontrolü
  switch (feature) {
    case 'featured_listing':
      return premiumStatus.plan_type === 'premium' || premiumStatus.plan_type === 'pro';
    case 'urgent_listing':
      return premiumStatus.plan_type === 'premium' || premiumStatus.plan_type === 'pro';
    case 'showcase_listing':
      return premiumStatus.plan_type === 'pro';
    case 'analytics':
      return premiumStatus.plan_type === 'premium' || premiumStatus.plan_type === 'pro';
    case 'priority_support':
      return premiumStatus.plan_type === 'pro';
    default:
      return false;
  }
};

export const getPremiumLimits = async (userId: string) => {
  const premiumStatus = await getUserPremiumStatus(userId);
  
  if (!premiumStatus) {
    return {
      featured_listings: 0,
      urgent_listings: 0,
      showcase_listings: 0,
      monthly_listings: 5
    };
  }

  switch (premiumStatus.plan_type) {
    case 'premium':
      return {
        featured_listings: 3,
        urgent_listings: 2,
        showcase_listings: 0,
        monthly_listings: 20
      };
    case 'pro':
      return {
        featured_listings: 10,
        urgent_listings: 5,
        showcase_listings: 2,
        monthly_listings: 50
      };
    default:
      return {
        featured_listings: 0,
        urgent_listings: 0,
        showcase_listings: 0,
        monthly_listings: 5
      };
  }
};

// Kullanıcının aktif planını getir
export const getUserActivePlan = async (userId: string) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase.rpc('get_user_active_plan', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error getting user plan:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting user plan:', error);
    return null;
  }
};

// Kullanıcının aylık kullanım istatistiklerini getir
export const getUserMonthlyUsage = async (userId: string) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase.rpc('get_or_create_monthly_usage', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error getting user usage:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting user usage:', error);
    return null;
  }
};

// Plan özelliklerini getir
export const getPlanFeatures = () => {
  return {
    basic: {
      name: 'Temel Plan',
      price: 0,
      period: 'ay',
      slug: 'basic',
      popular: false,
      features: [
        'Aylık 5 ilan',
        'Temel arama',
        'Mesajlaşma',
        'Profil yönetimi'
      ]
    },
    advanced: {
      name: 'Gelişmiş Plan',
      price: 29,
      period: 'ay',
      slug: 'advanced',
      popular: true,
      features: [
        'Aylık 20 ilan',
        'Öne çıkan ilanlar',
        'Acil ilanlar',
        'Gelişmiş analitik',
        'Öncelikli destek',
        'Dosya ekleme'
      ]
    },
    corporate: {
      name: 'Kurumsal Plan',
      price: 99,
      period: 'ay',
      slug: 'corporate',
      popular: false,
      features: [
        'Aylık 50 ilan',
        'Vitrin ilanları',
        'AI önerileri',
        'Kurumsal rozet',
        'Özel destek',
        'API erişimi',
        'Gelişmiş raporlama'
      ]
    }
  };
};

// Premium abonelik oluştur
export const createSubscription = async (userId: string, planSlug: string, paymentMethod: string = 'stripe') => {
  if (!userId || !planSlug) return null;
  
  try {
    // Planı bul
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .single();
    
    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return null;
    }
    
    // Mevcut aktif aboneliği iptal et
    await supabase
      .from('premium_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');
    
    // Yeni abonelik oluştur
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 aylık
    
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        payment_method: paymentMethod
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
};

// Kullanıcının premium durumunu kontrol et
export const checkUserPremiumStatus = async (userId: string) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_premium_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking premium status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in checkUserPremiumStatus:', error);
    return null;
  }
};

// Check if user can make an offer based on their plan limits
export const checkOfferLimit = async (userId: string) => {
  if (!userId) return false;

  try {
    const usage = await getUserMonthlyUsage(userId);
    const plan = await getUserActivePlan(userId);
    
    if (!usage || !plan) return false;
    
    const currentOffers = usage.offers_sent || 0;
    const limit = plan.limits?.offers_per_month || 10;
    
    // -1 means unlimited
    return limit === -1 || currentOffers < limit;
  } catch (error) {
    console.error('Error checking offer limit:', error);
    return false;
  }
};

// Increment user usage for a specific feature
export const incrementUserUsage = async (userId: string, feature: string) => {
  if (!userId || !feature) return false;

  try {
    const { data, error } = await supabase.rpc('increment_user_usage', {
      p_user_id: userId,
      p_type: feature
    });
    
    if (error) {
      console.error('Error incrementing user usage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in incrementUserUsage:', error);
    return false;
  }
}; 