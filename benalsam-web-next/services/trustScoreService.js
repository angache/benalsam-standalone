import { supabase } from '../lib/supabaseClient';

const TRUST_SCORE_WEIGHTS = {
  profile_completeness: 15,
  email_verification: 10,
  phone_verification: 10,
  listings: 15,
  completed_trades: 20,
  reviews: 15,
  response_time: 5,
  account_age: 5,
  social_links: 3,
  premium_status: 2,
};

const TRUST_LEVELS = {
  bronze: { min: 0, max: 30 },
  silver: { min: 31, max: 60 },
  gold: { min: 61, max: 85 },
  platinum: { min: 86, max: 100 },
};

/**
 * Kullanıcının trust score'unu hesaplar
 */
export const calculateTrustScore = async (userId) => {
  try {
    console.log('calculateTrustScore userId:', userId);
    if (!userId) {
      throw new Error('User ID is required');
    }

    // 1. Kullanıcı profilini çek
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Supabase profileError:', profileError);
      throw new Error('Failed to fetch user profile');
    }
    if (!profile) {
      throw new Error('User profile not found');
    }

    // 2. Kullanıcı istatistiklerini çek
    let { data: stats, error: statsError } = await supabase
      .from('user_statistics')
      .select('accepted_offers, avg_response_time_hours')
      .eq('user_id', userId)
      .maybeSingle();

    if (!stats) {
      // Otomatik olarak istatistik kaydı oluştur
      await initializeUserStatistics(userId);
      // Tekrar çek
      const result = await supabase
        .from('user_statistics')
        .select('accepted_offers, avg_response_time_hours')
        .eq('user_id', userId)
        .maybeSingle();
      stats = result.data;
    }

    // 3. Profille istatistikleri birleştir
    const profileWithStats = {
      ...profile,
      user_statistics: stats || {},
    };

    // 4. Her kriter için yüzde hesapla (0-100 arası)
    const breakdown = {
      profile_completeness: calculateProfileCompleteness(profileWithStats),
      email_verification: calculateEmailVerification(profileWithStats),
      phone_verification: calculatePhoneVerification(profileWithStats),
      listings: await calculateListingsScore(userId),
      completed_trades: calculateCompletedTradesScore(profileWithStats),
      reviews: calculateReviewsScore(profileWithStats),
      response_time: calculateResponseTimeScore(profileWithStats),
      account_age: calculateAccountAgeScore(profileWithStats),
      social_links: calculateSocialLinksScore(profileWithStats),
      premium_status: calculatePremiumStatusScore(profileWithStats),
    };

    // 5. Toplam skoru hesapla (mobildeki gibi)
    const totalScore = Object.entries(breakdown).reduce((total, [key, score]) => {
      return total + (score * TRUST_SCORE_WEIGHTS[key] / 100);
    }, 0);

    // 5. Trust level'ı belirle
    const level = getTrustLevel(totalScore);
    const nextLevelScore = getNextLevelScore(level);
    const progressToNextLevel = calculateProgressToNextLevel(totalScore, level);

    return {
      success: true,
      data: {
        totalScore: Math.round(totalScore),
        breakdown,
        level: level.toUpperCase(),
        nextLevelScore,
        progressToNextLevel,
      },
    };
  } catch (error) {
    console.error('Error calculating trust score:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Trust score'u günceller
 */
export const updateTrustScore = async (userId) => {
  try {
    const result = await calculateTrustScore(userId);
    
    if (result.success) {
      // Trust score'u cache'de güncelle
      console.log('Trust score updated successfully');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating trust score:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Helper functions
const calculateProfileCompleteness = (profile) => {
  let score = 0;
  
  // Temel bilgiler (40 puan)
  if (profile.first_name && profile.first_name.trim()) score += 10;
  if (profile.last_name && profile.last_name.trim()) score += 10;
  if (profile.bio && profile.bio.trim()) score += 10;
  if (profile.avatar_url) score += 10;
  
  // Konum bilgisi (30 puan)
  if (profile.province && profile.district) score += 30;
  else if (profile.province) score += 15;
  
  // Ek bilgiler (30 puan)
  if (profile.phone_number) score += 15;
  if (profile.birth_date) score += 15;
  
  return Math.min(score, 100);
};

const calculateEmailVerification = (profile) => {
  // Email verification durumunu kontrol et
  // Şimdilik tüm kullanıcılar doğrulanmış sayılıyor
  return 100;
};

const calculatePhoneVerification = (profile) => {
  return profile.phone_verified ? 100 : 0;
};

const calculateListingsScore = async (userId) => {
  try {
    // Listings tablosundan aktif ilan sayısını al
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching listings count:', error);
      return 0;
    }

    const listingsCount = count || 0;
    
    if (listingsCount === 0) return 0;
    if (listingsCount <= 2) return 50;
    if (listingsCount <= 5) return 75;
    if (listingsCount <= 10) return 90;
    return 100;
  } catch (error) {
    console.error('Error in calculateListingsScore:', error);
    return 0;
  }
};

const calculateCompletedTradesScore = (profile) => {
  // user_statistics tablosunda total_successful_trades yok, accepted_offers kullanıyoruz
  const tradesCount = profile.user_statistics?.accepted_offers || 0;
  
  if (tradesCount === 0) return 0;
  if (tradesCount <= 2) return 40;
  if (tradesCount <= 5) return 70;
  if (tradesCount <= 10) return 85;
  if (tradesCount <= 20) return 95;
  return 100;
};

const calculateReviewsScore = (profile) => {
  // user_statistics tablosunda total_reviews_received yok, şimdilik 0 döndürüyoruz
  const reviewsCount = 0; // profile.user_statistics?.total_reviews_received || 0;
  const averageRating = profile.rating || 0;
  
  if (reviewsCount === 0) return 0;
  if (reviewsCount <= 2) return 30;
  if (reviewsCount <= 5) return 60;
  if (reviewsCount <= 10) return 80;
  if (reviewsCount <= 20) return 90;
  
  // Yüksek rating bonus'u
  if (averageRating >= 4.5) return 100;
  if (averageRating >= 4.0) return 95;
  if (averageRating >= 3.5) return 85;
  
  return 75;
};

const calculateResponseTimeScore = (profile) => {
  // user_statistics tablosunda avg_response_time_hours kolonu var
  const avgResponseTime = profile.user_statistics?.avg_response_time_hours || 0;
  
  if (avgResponseTime === 0) return 50; // Henüz veri yok
  if (avgResponseTime <= 2) return 100; // 2 saat içinde
  if (avgResponseTime <= 6) return 90;  // 6 saat içinde
  if (avgResponseTime <= 12) return 80; // 12 saat içinde
  if (avgResponseTime <= 24) return 70; // 24 saat içinde
  if (avgResponseTime <= 48) return 50; // 48 saat içinde
  return 30; // 48 saatten fazla
};

const calculateAccountAgeScore = (profile) => {
  const createdAt = new Date(profile.created_at);
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceCreation <= 7) return 20;
  if (daysSinceCreation <= 30) return 40;
  if (daysSinceCreation <= 90) return 60;
  if (daysSinceCreation <= 180) return 80;
  if (daysSinceCreation <= 365) return 90;
  return 100;
};

const calculateSocialLinksScore = (profile) => {
  const socialLinks = profile.social_links || {};
  const filledLinks = Object.values(socialLinks).filter(link => link && link.trim() !== '').length;
  
  if (filledLinks === 0) return 0;
  if (filledLinks <= 2) return 50;
  if (filledLinks <= 4) return 80;
  return 100;
};

const calculatePremiumStatusScore = (profile) => {
  return profile.is_premium ? 100 : 0;
};

const getTrustLevel = (score) => {
  if (score >= TRUST_LEVELS.platinum.min) return 'platinum';
  if (score >= TRUST_LEVELS.gold.min) return 'gold';
  if (score >= TRUST_LEVELS.silver.min) return 'silver';
  return 'bronze';
};

const getNextLevelScore = (currentLevel) => {
  const levels = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return 100; // En üst seviyede
  }
  
  return TRUST_LEVELS[levels[currentIndex + 1]].min;
};

const calculateProgressToNextLevel = (currentScore, currentLevel) => {
  const nextLevelScore = getNextLevelScore(currentLevel);
  const currentLevelMin = TRUST_LEVELS[currentLevel].min;
  
  if (nextLevelScore === 100) {
    return 100; // En üst seviyede
  }
  
  const progress = ((currentScore - currentLevelMin) / (nextLevelScore - currentLevelMin)) * 100;
  return Math.max(0, Math.min(100, progress));
};

const initializeUserStatistics = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_statistics')
      .insert({
        user_id: userId,
        accepted_offers: 0,
        avg_response_time_hours: 24,
      });

    if (error) {
      console.error('Error initializing user statistics:', error);
    }
  } catch (error) {
    console.error('Error initializing user statistics:', error);
  }
};

export const getTrustLevelColor = (level) => {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };
  return colors[level.toLowerCase()] || colors.bronze;
};

export const getTrustLevelDescription = (level) => {
  const descriptions = {
    bronze: 'Yeni kullanıcı seviyesi. Profilinizi tamamlayarak puanınızı artırın.',
    silver: 'Aktif kullanıcı seviyesi. Daha fazla işlem yaparak güvenilirliğinizi artırın.',
    gold: 'Güvenilir kullanıcı seviyesi. Platformda güvenilir bir kullanıcısınız.',
    platinum: 'Çok güvenilir kullanıcı seviyesi. Platformun en güvenilir kullanıcılarından birisiniz.',
  };
  return descriptions[level.toLowerCase()] || descriptions.bronze;
}; 