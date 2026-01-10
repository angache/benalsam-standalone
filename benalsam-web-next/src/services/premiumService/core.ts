import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/production-logger';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const getUserPremiumStatus = async (userId: string) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('[PremiumService] Error fetching premium status', { error });
      return null;
    }

    return data;
  } catch (error) {
    logger.error('[PremiumService] Error in getUserPremiumStatus', { error });
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
    logger.debug('[PremiumService] Getting user active plan', { userId });
    const { data, error } = await supabase.rpc('get_user_active_plan', {
      p_user_id: userId
    });
    
    if (error) {
      logger.error('[PremiumService] Error getting user plan', { error, userId });
      return null;
    }
    
    const planData = data?.[0] || null;
    
    logger.debug('[PremiumService] User active plan retrieved', { 
      rawData: planData,
      userId,
      dataLength: data?.length,
      hasPlan: !!planData,
      planSlug: planData?.plan_slug,
      planName: planData?.plan_name
    });
    
    // RPC fonksiyonu doğrudan döndürüyor, mapping'e gerek yok
    // Ancak features ve limits JSONB olarak geliyor, bunlar zaten doğru format
    return planData;
  } catch (error) {
    logger.error('[PremiumService] Error getting user plan', { error, userId });
    return null;
  }
};

// Kullanıcının aylık kullanım istatistiklerini getir
export const getUserMonthlyUsage = async (userId: string) => {
  if (!userId) return null;
  
  try {
    logger.debug('[PremiumService] Getting user monthly usage', { userId });
    const { data, error } = await supabase.rpc('get_or_create_monthly_usage', {
      p_user_id: userId
    });
    
    if (error) {
      logger.error('[PremiumService] Error getting user usage', { error, userId });
      return null;
    }
    
    logger.debug('[PremiumService] User monthly usage retrieved', { 
      usage: data?.[0],
      userId,
      dataLength: data?.length 
    });
    
    return data?.[0] || null;
  } catch (error) {
    logger.error('[PremiumService] Error getting user usage', { error, userId });
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
      logger.error('[PremiumService] Error checking premium status', { error });
      return false;
    }
    
    return data ? true : false;
  } catch (error) {
    logger.error('[PremiumService] Error checking premium status', { error });
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
      logger.error('[PremiumService] Error getting plan details', { error: planError });
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
    logger.error('[PremiumService] Error getting premium details', { error });
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
      logger.error('[PremiumService] Error getting subscription plans', { error });
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('[PremiumService] Error getting subscription plans', { error });
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
      logger.error('[PremiumService] Plan not found', { error: planError });
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
      logger.error('[PremiumService] Error creating subscription', { error });
      toast({ title: "Abonelik Hatası", description: "Abonelik oluşturulurken bir sorun oluştu.", variant: "destructive" });
      return null;
    }
    
    toast({ 
      title: "Abonelik Başarılı! 🎉", 
      description: `${plan.name} planına başarıyla abone oldunuz.` 
    });
    
    return data;
  } catch (error) {
    logger.error('[PremiumService] Error creating subscription', { error });
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

// Abonelik iptal et
export const cancelSubscription = async (userId: string) => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select();
    
    if (error) {
      logger.error('[PremiumService] Error cancelling subscription', { error, userId });
      return false;
    }
    
    if (!data || data.length === 0) {
      logger.warn('[PremiumService] No active subscription found to cancel', { userId });
      return false;
    }
    
    logger.debug('[PremiumService] Subscription cancelled successfully', { userId, subscriptionId: data[0].id });
    
    return true;
  } catch (error) {
    logger.error('[PremiumService] Error cancelling subscription', { error, userId });
    return false;
  }
};

// Abonelik yenile
export const renewSubscription = async (userId: string) => {
  if (!userId) return false;
  
  try {
    // Mevcut aboneliği bul
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('premium_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !currentSubscription) {
      logger.error('[PremiumService] No active subscription found', { error: fetchError, userId });
      return false;
    }
    
    // Bitiş tarihini 1 ay uzat
    const currentExpiresAt = new Date(currentSubscription.expires_at);
    const newExpiresAt = new Date(currentExpiresAt);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
    
    logger.debug('[PremiumService] Renewing subscription', { 
      userId, 
      currentExpiresAt: currentExpiresAt.toISOString(),
      newExpiresAt: newExpiresAt.toISOString()
    });
    
    const { error: updateError } = await supabase
      .from('premium_subscriptions')
      .update({ 
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id);
    
    if (updateError) {
      logger.error('[PremiumService] Error renewing subscription', { error: updateError, userId });
      return false;
    }
    
    logger.debug('[PremiumService] Subscription renewed successfully', { 
      userId, 
      newExpiresAt: newExpiresAt.toISOString()
    });
    
    return true;
  } catch (error) {
    logger.error('[PremiumService] Error renewing subscription', { error, userId });
    return false;
  }
};

// Kullanıcı kullanımını artır
// NOT: RPC fonksiyonu get_or_create_monthly_usage monthly_usage_stats tablosunu kullanıyor
// Bu fonksiyon da aynı tabloyu kullanmalı (monthly_usage_stats, month_year kolonu)
export const incrementUserUsage = async (userId: string, feature: string) => {
  if (!userId || !feature) return false;
  
  try {
    const monthYear = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Feature ismini doğru kolon ismine çevir
    let columnName = feature;
    if (feature === 'offers' || feature === 'offer') columnName = 'offers_count';
    else if (feature === 'messages' || feature === 'message') columnName = 'messages_count';
    else if (feature === 'listings' || feature === 'listing') columnName = 'listings_count';
    else if (feature === 'featured_offers' || feature === 'featured_offer') columnName = 'featured_offers_count';
    else if (!feature.endsWith('_count')) columnName = `${feature}_count`;
    
    // Mevcut kullanımı kontrol et
    const { data: usage, error: fetchError } = await supabase
      .from('monthly_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('[PremiumService] Error fetching usage', { error: fetchError });
      return false;
    }
    
    if (!usage) {
      // Yeni kullanım kaydı oluştur
      const insertData: Record<string, unknown> = {
        user_id: userId,
        month_year: monthYear,
        offers_count: 0,
        messages_count: 0,
        listings_count: 0,
        featured_offers_count: 0
      };
      insertData[columnName] = 1;
      
      const { error: insertError } = await supabase
        .from('monthly_usage_stats')
        .insert(insertData);
      
      if (insertError) {
        logger.error('[PremiumService] Error creating usage record', { error: insertError });
        return false;
      }
    } else {
      // Mevcut kullanımı artır
      const currentValue = (usage[columnName as keyof typeof usage] as number) || 0;
      const updateData: Record<string, unknown> = {
        [columnName]: currentValue + 1,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('monthly_usage_stats')
        .update(updateData)
        .eq('id', usage.id);
      
      if (updateError) {
        logger.error('[PremiumService] Error updating usage', { error: updateError });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('[PremiumService] Error incrementing usage', { error });
    return false;
  }
}; 