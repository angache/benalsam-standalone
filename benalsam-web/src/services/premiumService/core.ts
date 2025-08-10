import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

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

// Kullanıcının premium durumunu kontrol et - Alternatif yöntem
export const checkUserPremiumStatus = async (userId: string) => {
  if (!userId) return false;
  
  try {
    // Önce RPC fonksiyonu ile dene
    const { data: planData, error: planError } = await supabase.rpc('get_user_active_plan', {
      p_user_id: userId
    });
    
    if (!planError && planData && planData.length > 0) {
      const plan = planData[0];
      // Eğer plan slug'ı 'basic' değilse premium'dur
      return plan.plan_slug !== 'basic';
    }
    
    // RPC başarısız olursa direkt sorgu yap
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('id, status, expires_at, plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error) {
      // Kullanıcının aktif aboneliği yoksa false döndür
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking premium status:', error);
      return false;
    }
    
    return data ? true : false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

// Kullanıcının premium bilgilerini detaylı getir
export const getUserPremiumDetails = async (userId: string) => {
  if (!userId) return null;
  
  try {
    // Önce RPC ile dene
    const planData = await getUserActivePlan(userId);
    if (planData) {
      return {
        isPremium: planData.plan_slug !== 'basic',
        plan: planData,
        expiresAt: planData.expires_at
      };
    }
    
    // RPC başarısız olursa manuel sorgu
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('id, status, expires_at, plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return {
        isPremium: false,
        plan: null,
        expiresAt: null
      };
    }
    
    // Plan detaylarını ayrı olarak getir
    const { data: planDetails, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', data[0].plan_id)
      .single();
    
    if (planError) {
      console.error('Error getting plan details:', planError);
      return {
        isPremium: true,
        plan: null,
        expiresAt: data[0].expires_at
      };
    }
    
    return {
      isPremium: true,
      plan: {
        plan_id: planDetails.id,
        plan_name: planDetails.name,
        plan_slug: planDetails.slug,
        features: planDetails.features,
        limits: planDetails.limits,
        expires_at: data[0].expires_at
      },
      expiresAt: data[0].expires_at
    };
  } catch (error) {
    console.error('Error getting premium details:', error);
    return {
      isPremium: false,
      plan: null,
      expiresAt: null
    };
  }
};

// Tüm planları getir
export const getSubscriptionPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    
    if (error) {
      console.error('Error getting subscription plans:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return [];
  }
};

// Premium özellik kontrolü (alternatif)
export const checkPremiumFeatureByPlan = async (userId: string, feature: string) => {
  const plan = await getUserActivePlan(userId);
  if (!plan) return false;
  
  return plan.features?.[feature] === true;
};

// Limit kontrolü genel fonksiyonu
export const checkLimit = async (userId: string, limitType: string) => {
  const plan = await getUserActivePlan(userId);
  const usage = await getUserMonthlyUsage(userId);
  
  if (!plan || !usage) return false;
  
  const limit = plan.limits?.[limitType];
  if (limit === -1) return true; // Sınırsız
  
  const currentUsage = usage[limitType.replace('_per_month', '_count')] || 0;
  return currentUsage < limit;
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
      toast({ title: "Plan Bulunamadı", description: "Seçilen plan bulunamadı.", variant: "destructive" });
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
      toast({ title: "Abonelik Hatası", description: "Abonelik oluşturulurken bir sorun oluştu.", variant: "destructive" });
      return null;
    }
    
    toast({ 
      title: "Abonelik Başarılı! 🎉", 
      description: `${plan.name} planına başarıyla abone oldunuz.` 
    });
    
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    toast({ title: "Beklenmedik Hata", description: "Abonelik oluşturulurken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

// Teklif limiti kontrolü
export const checkOfferLimit = async (userId: string) => {
  const usage = await getUserMonthlyUsage(userId);
  if (!usage) return false;
  
  const currentOffers = usage.offers_count || 0;
  const limit = usage.offers_limit || 10; // Varsayılan limit
  
  return currentOffers < limit;
};

// Kullanıcı kullanımını artır
export const incrementUserUsage = async (userId: string, feature: string) => {
  if (!userId || !feature) return false;
  
  try {
    const { data: usage, error: fetchError } = await supabase
      .from('user_monthly_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'))
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching usage:', fetchError);
      return false;
    }
    
    if (!usage) {
      // Yeni kullanım kaydı oluştur
      const { error: insertError } = await supabase
        .from('user_monthly_usage')
        .insert({
          user_id: userId,
          month: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'),
          [`${feature}_count`]: 1
        });
      
      if (insertError) {
        console.error('Error creating usage record:', insertError);
        return false;
      }
    } else {
      // Mevcut kullanımı artır
      const { error: updateError } = await supabase
        .from('user_monthly_usage')
        .update({
          [`${feature}_count`]: (usage[`${feature}_count`] || 0) + 1
        })
        .eq('id', usage.id);
      
      if (updateError) {
        console.error('Error updating usage:', updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}; 