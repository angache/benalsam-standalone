import { supabase } from '@/lib/supabaseClient';
import { getUserActivePlan, getUserMonthlyUsage } from './core';

// İlan limiti kontrolü
export const checkListingLimit = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const plan = await getUserActivePlan(userId);
    const usage = await getUserMonthlyUsage(userId);
    
    if (!plan || !usage) return false;
    
    const listingLimit = plan.limits?.listings_per_month || 3; // Varsayılan limit
    if (listingLimit === -1) return true; // Sınırsız
    
    const currentUsage = usage.listings_count || 0;
    return currentUsage < listingLimit;
  } catch (error) {
    console.error('Error checking listing limit:', error);
    return false;
  }
};

// Teklif limiti kontrolü
export const checkOfferLimit = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase.rpc('check_offer_limit_new', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error checking offer limit:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error checking offer limit:', error);
    return false;
  }
};

// Mesaj limiti kontrolü
export const checkMessageLimit = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const plan = await getUserActivePlan(userId);
    const usage = await getUserMonthlyUsage(userId);
    
    if (!plan || !usage) return false;
    
    const messageLimit = plan.limits?.messages_per_month || 50; // Varsayılan limit
    if (messageLimit === -1) return true; // Sınırsız
    
    const currentUsage = usage.messages_count || 0;
    return currentUsage < messageLimit;
  } catch (error) {
    console.error('Error checking message limit:', error);
    return false;
  }
};

// Resim limiti kontrolü
export const checkImageLimit = async (userId: string, newImageCount: number = 1): Promise<boolean> => {
  if (!userId) return newImageCount <= 2; // Giriş yapmamış kullanıcılar için varsayılan limit
  
  try {
    const plan = await getUserActivePlan(userId);
    if (!plan) return newImageCount <= 2; // Varsayılan plan limiti
    
    const imageLimit = plan.limits?.images_per_offer || 2;
    if (imageLimit === -1) return true; // Sınırsız
    
    return newImageCount <= imageLimit;
  } catch (error) {
    console.error('Error checking image limit:', error);
    return newImageCount <= 2; // Hata durumunda varsayılan limit
  }
};

// Öne çıkarma limiti kontrolü
export const checkFeaturedLimit = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const plan = await getUserActivePlan(userId);
    const usage = await getUserMonthlyUsage(userId);
    
    if (!plan || !usage) return false;
    
    const featuredLimit = plan.limits?.featured_offers_per_day || 0; // Varsayılan limit
    if (featuredLimit === -1) return true; // Sınırsız
    
    // Günlük limiti aylık kullanıma çevir (30 gün)
    const monthlyFeaturedLimit = featuredLimit * 30;
    const currentUsage = usage.featured_offers_count || 0;
    return currentUsage < monthlyFeaturedLimit;
  } catch (error) {
    console.error('Error checking featured limit:', error);
    return false;
  }
};

// Dosya ekleme limiti kontrolü
export const checkFileAttachmentLimit = async (userId: string, fileCount: number = 1): Promise<boolean> => {
  if (!userId) return false; // Giriş yapmamış kullanıcılar dosya ekleyemez
  
  try {
    const plan = await getUserActivePlan(userId);
    if (!plan) return false; // Varsayılan plan dosya ekleme desteklemiyor
    
    const fileLimit = plan.limits?.files_per_offer || 0;
    if (fileLimit === -1) return true; // Sınırsız
    
    return fileCount <= fileLimit;
  } catch (error) {
    console.error('Error checking file attachment limit:', error);
    return false;
  }
}; 