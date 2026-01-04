import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Profile interface
interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  social_links?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
  last_seen?: string;
  is_verified?: boolean;
  is_2fa_enabled?: boolean; // 2FA status from database
  trust_score?: number;
  total_listings?: number;
  total_offers?: number;
  total_reviews?: number;
  average_rating?: number;
  profile_views?: number;
  member_since?: string;
  premium_until?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_tier?: string;
  subscription_features?: string[];
  subscription_limits?: Record<string, number>;
  subscription_usage?: Record<string, number>;
  subscription_history?: Array<{
    plan: string;
    start_date: string;
    end_date?: string;
    status: string;
  }>;
  notification_settings?: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_emails?: boolean;
    offer_notifications?: boolean;
    message_notifications?: boolean;
    review_notifications?: boolean;
    system_notifications?: boolean;
  };
  privacy_settings?: {
    profile_visibility?: 'public' | 'private' | 'friends';
    show_email?: boolean;
    show_phone?: boolean;
    show_location?: boolean;
    allow_messages?: boolean;
    allow_offers?: boolean;
    allow_reviews?: boolean;
  };
  account_settings?: {
    language?: string;
    timezone?: string;
    currency?: string;
    date_format?: string;
    time_format?: string;
    theme?: 'light' | 'dark' | 'auto';
  };
  security_settings?: {
    two_factor_enabled?: boolean;
    login_notifications?: boolean;
    session_timeout?: number;
    password_last_changed?: string;
  };
  business_settings?: {
    business_name?: string;
    business_type?: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    business_website?: string;
    business_description?: string;
    business_hours?: Record<string, string>;
    business_services?: string[];
    business_categories?: string[];
    business_verified?: boolean;
    business_rating?: number;
    business_reviews?: number;
  };
  preferences?: {
    listing_preferences?: {
      default_category?: string;
      default_location?: string;
      default_budget_range?: string;
      auto_republish?: boolean;
      featured_listings?: boolean;
      urgent_listings?: boolean;
      showcase_listings?: boolean;
    };
    offer_preferences?: {
      auto_accept_offers?: boolean;
      minimum_offer_amount?: number;
      offer_expiry_days?: number;
      counter_offer_enabled?: boolean;
      bulk_offer_enabled?: boolean;
    };
    communication_preferences?: {
      preferred_contact_method?: 'email' | 'phone' | 'message';
      response_time?: string;
      availability_hours?: string;
      auto_reply_enabled?: boolean;
      auto_reply_message?: string;
    };
    search_preferences?: {
      saved_searches?: Array<{
        name: string;
        query: string;
        filters: Record<string, any>;
        notifications_enabled: boolean;
      }>;
      search_history?: Array<{
        query: string;
        timestamp: string;
        results_count: number;
      }>;
      recommended_categories?: string[];
      excluded_categories?: string[];
    };
  };
}

// Import unified error handler
import { handleError as unifiedHandleError } from '@/utils/errorHandler';

// Error handling helper
const handleError = (error: unknown, title: string = "Hata", description: string = "Bir sorun oluştu"): null => {
  unifiedHandleError(error, {
    component: 'profile-service',
    action: title.toLowerCase().replace(/\s+/g, '-')
  });
  return null;
};

// Validation helper
const validateUserId = (userId: string): boolean => {
  if (!userId) {
    console.error('Function called with no userId');
    return false;
  }
  return true;
};

export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  if (!validateUserId(userId)) {
    return null;
  }

  try {
    console.log('🔍 Fetching profile for userId:', userId);
    
    // Add timeout to prevent hanging requests (30 seconds for slow networks)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout after 30s')), 30000)
    );
    
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('🔍 Profile fetch promise created, racing with timeout...');
    let result: { data: any; error: any; status: number } | null = null;
    
    try {
      result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as { data: any; error: any; status: number };
    } catch (timeoutError: any) {
      // Handle timeout gracefully
      if (timeoutError?.message?.includes('timeout')) {
        console.warn('⚠️ Profile fetch timeout, attempting retry...');
        // Try once more with a shorter timeout
        try {
          const retryPromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          const retryTimeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Retry timeout')), 10000)
          );
          result = await Promise.race([
            retryPromise,
            retryTimeout
          ]) as { data: any; error: any; status: number };
        } catch (retryError) {
          console.error('❌ Profile fetch retry also failed:', retryError);
          toast({ 
            title: "Yavaş Bağlantı", 
            description: "Profil yüklenirken zaman aşımı oluştu. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.", 
            variant: "destructive",
            duration: 8000
          });
          return null;
        }
      } else {
        throw timeoutError;
      }
    }
    
    if (!result) {
      console.error('❌ Profile fetch failed: No result');
      return null;
    }
    
    const { data, error, status } = result;
    console.log('🔍 Profile fetch result:', { data: !!data, error: !!error, status });

    if (error && status !== 406) { 
      console.error('Error in fetchUserProfile:', { message: error.message, details: error.details, hint: error.hint, code: error.code });
      if (error.message.toLowerCase().includes('failed to fetch')) {
        toast({ title: "Ağ Hatası", description: "Profil bilgileri çekilemedi. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.", variant: "destructive", duration: 7000 });
      } else {
        toast({ title: "Profil Hatası", description: `Profil yüklenirken bir sorun oluştu: ${error.message}`, variant: "destructive" });
      }
      return null;
    }

    if (!data) {
      console.warn(`No profile found for userId: ${userId}`);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    toast({ title: "Beklenmedik Profil Hatası", description: "Profil yüklenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile | null> => {
  if (!validateUserId(userId)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return handleError(error, "Profil Güncellenemedi", error.message);
    }

    toast({ 
      title: "Profil Güncellendi! ✅", 
      description: "Profil bilgileriniz başarıyla güncellendi." 
    });

    return data as Profile;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Profil güncellenirken bir sorun oluştu");
  }
};

export const incrementProfileView = async (userId: string): Promise<void> => {
  if (!validateUserId(userId)) return;

  try {
    const { error } = await supabase.functions.invoke('increment-profile-view', {
      body: { userId },
    });
    if (error) throw error;
  } catch (error) {
    // This is a non-critical background task.
    // We log the error for debugging but don't show a toast to the user.
    console.error('Error in incrementProfileView:', error);
  }
};

// Additional profile functions from mobile version
export const getUserProfileStats = async (userId: string): Promise<{
  totalListings: number;
  totalOffers: number;
  totalViews: number;
  totalFavorites: number;
  averageRating: number;
  totalReviews: number;
  trustScore: number;
  memberSince: string;
} | null> => {
  if (!validateUserId(userId)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        total_listings,
        total_offers,
        profile_views,
        total_favorites,
        average_rating,
        total_reviews,
        trust_score,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile stats:', error);
      return null;
    }

    return {
      totalListings: data.total_listings || 0,
      totalOffers: data.total_offers || 0,
      totalViews: data.profile_views || 0,
      totalFavorites: data.total_favorites || 0,
      averageRating: data.average_rating || 0,
      totalReviews: data.total_reviews || 0,
      trustScore: data.trust_score || 0,
      memberSince: data.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getUserProfileStats:', error);
    return null;
  }
};

export const updateProfileSettings = async (
  userId: string, 
  settings: {
    notification_settings?: Partial<Profile['notification_settings']>;
    privacy_settings?: Partial<Profile['privacy_settings']>;
    account_settings?: Partial<Profile['account_settings']>;
    security_settings?: Partial<Profile['security_settings']>;
  }
): Promise<Profile | null> => {
  if (!validateUserId(userId)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return handleError(error, "Ayarlar Güncellenemedi", error.message);
    }

    toast({ 
      title: "Ayarlar Güncellendi! ✅", 
      description: "Profil ayarlarınız başarıyla güncellendi." 
    });

    return data as Profile;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Ayarlar güncellenirken bir sorun oluştu");
  }
}; 