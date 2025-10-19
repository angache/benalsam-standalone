import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// Kullanım artırma
export const incrementUserUsage = async (userId: string, type: string): Promise<boolean> => {
  if (!userId || !type) return false;
  
  try {
    const { data, error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_type: type
    });
    
    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
};

// Premium yükseltme toast mesajı
export const showPremiumUpgradeToast = (feature: string): void => {
  toast({
    title: "Premium Özellik",
    description: `${feature} özelliğini kullanmak için Premium üyeliğe yükseltin.`,
    variant: "default"
  });
};

// Teklif eklerini yönet
export const addOfferAttachment = async (offerId: string, files: File[]): Promise<boolean> => {
  try {
    // Bu fonksiyon şimdilik basit bir implementasyon
    // Gerçek implementasyonda dosyaları Supabase Storage'a yükler
    console.log('Adding attachments to offer:', offerId, files);
    return true;
  } catch (error) {
    console.error('Error adding offer attachments:', error);
    return false;
  }
};

// Trend hesaplama
export const calculateTrend = (current: number, previous: number): {
  value: number;
  isPositive: boolean;
  percentage: number;
} => {
  if (previous === 0) {
    return {
      value: current,
      isPositive: current > 0,
      percentage: current > 0 ? 100 : 0
    };
  }
  
  const change = current - previous;
  const percentage = (change / previous) * 100;
  
  return {
    value: change,
    isPositive: change >= 0,
    percentage: Math.abs(percentage)
  };
};

// Dashboard istatistikleri
export const getUserDashboardStats = async (userId: string) => {
  try {
    // Basit mock veri
    return {
      totalListings: 15,
      totalOffers: 42,
      totalViews: 1250,
      totalFavorites: 28,
      monthlyGrowth: 12.5,
      conversionRate: 8.3
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return null;
  }
};

// Kullanıcı aktiviteleri
export const getUserRecentActivities = async (userId: string) => {
  try {
    // Basit mock veri
    return [
      { id: 1, type: 'listing_created', title: 'Yeni ilan oluşturuldu', timestamp: new Date().toISOString() },
      { id: 2, type: 'offer_received', title: 'Yeni teklif alındı', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, type: 'listing_viewed', title: 'İlan görüntülendi', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ];
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
};

// Kategori istatistikleri
export const getUserCategoryStats = async (userId: string) => {
  try {
    // Basit mock veri
    return [
      { category: 'Elektronik', count: 5, views: 450 },
      { category: 'Ev & Yaşam', count: 3, views: 320 },
      { category: 'Spor', count: 2, views: 180 }
    ];
  } catch (error) {
    console.error('Error getting category stats:', error);
    return [];
  }
};

// Performans metrikleri hesaplama
export const calculatePerformanceMetrics = async (userId: string) => {
  try {
    // Basit mock veri
    return {
      responseTime: 2.3,
      conversionRate: 8.5,
      userSatisfaction: 4.2,
      listingQuality: 4.7,
      offerAcceptance: 12.3
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return null;
  }
};

// Teklifi öne çıkar
export const featureOffer = async (offerId: string, userId: string): Promise<boolean> => {
  try {
    // Bu fonksiyon şimdilik basit bir implementasyon
    // Gerçek implementasyonda teklifi öne çıkarır
    console.log('Featuring offer:', offerId, 'for user:', userId);
    return true;
  } catch (error) {
    console.error('Error featuring offer:', error);
    return false;
  }
}; 