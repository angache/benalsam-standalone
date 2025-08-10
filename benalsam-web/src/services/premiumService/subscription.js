import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// Premium abonelik oluştur
export const createSubscription = async (userId, planSlug, paymentMethod = 'stripe') => {
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
    
    toast({
      title: "🎉 Premium Aktif!",
      description: `${plan.name} planınız başarıyla aktif edildi.`,
      duration: 5000
    });
    
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
};

// Plan özelliklerini getir (subscription için basit versiyon)
export const getSubscriptionPlans = () => {
  return {
    basic: {
      name: 'Temel Plan',
      price: 0,
      period: 'ay',
      slug: 'basic'
    },
    advanced: {
      name: 'Gelişmiş Plan',
      price: 29,
      period: 'ay',
      slug: 'advanced'
    },
    corporate: {
      name: 'Kurumsal Plan',
      price: 99,
      period: 'ay',
      slug: 'corporate'
    }
  };
};