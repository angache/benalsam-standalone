import { supabase } from './supabaseClient';
import { ApiResponse } from '../types';
import { ListingWithUser } from './listingService/core';

// Admin Backend URL
const ADMIN_BACKEND_URL = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL || 'http://localhost:3002';

// Error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Recommendation types
export interface UserBehavior {
  userId: string;
  listingId: string;
  action: 'view' | 'favorite' | 'offer' | 'contact' | 'share';
  timestamp: Date;
  category?: string;
  price?: number;
}

export interface RecommendationScore {
  listingId: string;
  score: number;
  reason: string;
  algorithm: 'collaborative' | 'content' | 'popularity' | 'recent' | 'seller';
}

export interface RecommendationResult {
  listings: ListingWithUser[];
  scores: RecommendationScore[];
  algorithm: string;
  confidence: number;
}

export interface UserPreferences {
  favoriteCategories: string[];
  priceRange: { min: number; max: number };
  preferredConditions: string[];
  activityLevel: 'low' | 'medium' | 'high';
}

// Collaborative filtering için kullanıcı benzerlik matrisi
interface UserSimilarity {
  userId: string;
  similarity: number;
  commonInterests: string[];
}

// Content-based filtering için özellik vektörü
interface ListingFeatures {
  listingId: string;
  category: string;
  price: number;
  condition: string;
  tags: string[];
  location: string;
  features: string[];
}

/**
 * Kullanıcı davranışını kaydet
 */
export const trackUserBehavior = async (
  userId: string,
  listingId: string,
  action: UserBehavior['action'],
  metadata?: Partial<UserBehavior>
): Promise<ApiResponse<boolean>> => {
  try {
    if (!listingId) {
      throw new ValidationError('Listing ID is required');
    }

    // Anonymous user'lar için userId kontrolü
    const isAnonymous = userId.startsWith('anonymous_');
    if (!userId && !isAnonymous) {
      throw new ValidationError('User ID is required for authenticated users');
    }

    // İlan bilgilerini çek
    const { data: listing } = await supabase
      .from('listings')
      .select('category, budget')
      .eq('id', listingId)
      .single();

    const behavior: UserBehavior = {
      userId,
      listingId,
      action,
      timestamp: new Date(),
      category: listing?.category,
      price: listing?.budget, // budget değerini price olarak kaydet
      ...metadata,
    };

    // User behavior'ı admin backend'e gönder
    try {
      const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/analytics/track-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: action,
          event_data: {
            listing_id: listingId,
            category: behavior.category,
            price: behavior.price,
            action: action,
            timestamp: behavior.timestamp.toISOString()
          },
          user_id: isAnonymous ? undefined : userId, // Anonymous user'lar için user_id gönderme
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          device_info: {
            platform: 'mobile',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        console.error('Error tracking user behavior:', await response.text());
        // Analytics hatası kritik değil, devam et
      }
    } catch (error) {
      console.error('Error tracking user behavior:', error);
      // Analytics hatası kritik değil, devam et
    }

    return { data: true };
  } catch (error) {
    console.error('Error in trackUserBehavior:', error);
    return handleError(error);
  }
};

/**
 * Kullanıcı tercihlerini analiz et
 */
export const analyzeUserPreferences = async (userId: string): Promise<ApiResponse<UserPreferences>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Son 30 günlük davranışları çek
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: behaviors, error } = await supabase
      .from('user_behaviors')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch user behaviors', error);
    }

    if (!behaviors || behaviors.length === 0) {
      // Varsayılan tercihler
      return {
        data: {
          favoriteCategories: [],
          priceRange: { min: 0, max: 10000 },
          preferredConditions: ['new', 'like_new'],
          activityLevel: 'low',
        },
      };
    }

    // Kategori analizi
    const categoryCounts = new Map<string, number>();
    const priceValues: number[] = [];
    const conditionCounts = new Map<string, number>();
    let totalActions = 0;

    behaviors.forEach(behavior => {
      totalActions++;
      
      if (behavior.category) {
        categoryCounts.set(behavior.category, (categoryCounts.get(behavior.category) || 0) + 1);
      }
      
      if (behavior.price) {
        priceValues.push(behavior.price);
      }
    });

    // Favori kategorileri belirle (en çok etkileşim)
    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // Fiyat aralığını hesapla
    const priceRange = priceValues.length > 0
      ? {
          min: Math.floor(Math.min(...priceValues) * 0.8),
          max: Math.ceil(Math.max(...priceValues) * 1.2),
        }
      : { min: 0, max: 10000 };

    // Aktivite seviyesini belirle
    const activityLevel: 'low' | 'medium' | 'high' = 
      totalActions < 10 ? 'low' : 
      totalActions < 50 ? 'medium' : 'high';

    return {
      data: {
        favoriteCategories,
        priceRange,
        preferredConditions: ['new', 'like_new'], // Varsayılan
        activityLevel,
      },
    };
  } catch (error) {
    console.error('Error in analyzeUserPreferences:', error);
    return handleError(error);
  }
};

/**
 * Collaborative filtering - Benzer kullanıcıları bul
 */
const findSimilarUsers = async (userId: string, limit = 10): Promise<UserSimilarity[]> => {
  try {
    // Kullanıcının davranışlarını çek
    const { data: userBehaviors } = await supabase
      .from('user_behaviors')
      .select('listing_id, action, category')
      .eq('user_id', userId);

    if (!userBehaviors || userBehaviors.length === 0) {
      return [];
    }

    // Kullanıcının etkileşimde bulunduğu kategorileri bul
    const userCategories = new Set(userBehaviors.map(b => b.category).filter(Boolean));

    // Diğer kullanıcıların davranışlarını çek
    const { data: allBehaviors } = await supabase
      .from('user_behaviors')
      .select('user_id, listing_id, action, category')
      .neq('user_id', userId);

    if (!allBehaviors) {
      return [];
    }

    // Kullanıcı bazında grupla
    const userBehaviorsMap = new Map<string, any[]>();
    allBehaviors.forEach(behavior => {
      if (!userBehaviorsMap.has(behavior.user_id)) {
        userBehaviorsMap.set(behavior.user_id, []);
      }
      userBehaviorsMap.get(behavior.user_id)!.push(behavior);
    });

    // Benzerlik hesapla
    const similarities: UserSimilarity[] = [];
    
    userBehaviorsMap.forEach((behaviors, otherUserId) => {
      const otherCategories = new Set(behaviors.map(b => b.category).filter(Boolean));
      
      // Jaccard similarity
      const intersection = new Set([...userCategories].filter(x => otherCategories.has(x)));
      const union = new Set([...userCategories, ...otherCategories]);
      
      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      
      if (similarity > 0.1) { // Minimum benzerlik eşiği
        similarities.push({
          userId: otherUserId,
          similarity,
          commonInterests: Array.from(intersection),
        });
      }
    });

    // Benzerlik skoruna göre sırala
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error in findSimilarUsers:', error);
    return [];
  }
};

/**
 * Content-based filtering - İlan özelliklerini analiz et
 */
const analyzeListingFeatures = async (listingId: string): Promise<ListingFeatures | null> => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (!listing) {
      return null;
    }

    // İlan özelliklerini çıkar
    const features: string[] = [];
    
    // Kategori özellikleri
    if (listing.category) {
      features.push(...listing.category.split(' > '));
    }
    
    // Fiyat aralığı
    if (listing.price) {
      if (listing.price < 100) features.push('budget');
      else if (listing.price < 500) features.push('mid_range');
      else features.push('premium');
    }
    
    // Durum
    if (listing.condition) {
      features.push(listing.condition);
    }
    
    // Özel özellikler
    if (listing.is_urgent_premium) features.push('urgent');
    if (listing.is_featured) features.push('featured');
    if (listing.is_showcase) features.push('showcase');

    return {
      listingId,
      category: listing.category || '',
      price: listing.price || 0,
      condition: listing.condition || '',
      tags: listing.tags || [],
      location: listing.location || '',
      features,
    };
  } catch (error) {
    console.error('Error in analyzeListingFeatures:', error);
    return null;
  }
};

/**
 * Smart recommendations - Ana fonksiyon
 */
export const getSmartRecommendations = async (
  userId: string,
  limit = 10,
  algorithm: 'hybrid' | 'collaborative' | 'content' | 'popularity' | 'seller' = 'hybrid'
): Promise<ApiResponse<RecommendationResult>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    console.log('🧠 Getting smart recommendations for user:', userId, 'with algorithm:', algorithm);

    // Kullanıcı tercihlerini analiz et
    const { data: preferences } = await analyzeUserPreferences(userId);
    if (!preferences) {
      throw new Error('Failed to analyze user preferences');
    }
    
    console.log('🧠 User preferences:', preferences);

    let recommendations: RecommendationScore[] = [];

    // Collaborative filtering
    if (algorithm === 'collaborative' || algorithm === 'hybrid') {
      const similarUsers = await findSimilarUsers(userId, 5);
      console.log('🧠 Similar users found:', similarUsers.length);
      
      if (similarUsers.length > 0) {
        const collaborativeRecs = await getCollaborativeRecommendations(similarUsers, userId);
        console.log('🧠 Collaborative recommendations:', collaborativeRecs.length);
        recommendations.push(...collaborativeRecs);
      }
    }

    // Content-based filtering
    if (algorithm === 'content' || algorithm === 'hybrid') {
      const contentRecs = await getContentBasedRecommendations(preferences, userId);
      console.log('🧠 Content-based recommendations:', contentRecs.length);
      recommendations.push(...contentRecs);
    }

    // Seller-focused filtering (kullanıcının envanterine göre)
    if (algorithm === 'seller' || (algorithm === 'hybrid' && recommendations.length < limit)) {
      const sellerRecs = await getSellerFocusedRecommendations(userId);
      console.log('🧠 Seller-focused recommendations:', sellerRecs.length);
      recommendations.push(...sellerRecs);
    }

    // Popularity-based filtering (fallback)
    if (algorithm === 'popularity' || (algorithm === 'hybrid' && recommendations.length < limit)) {
      const popularityRecs = await getPopularityRecommendations(preferences, userId);
      console.log('🧠 Popularity recommendations:', popularityRecs.length);
      recommendations.push(...popularityRecs);
    }

    console.log('🧠 Total recommendations before merge:', recommendations.length);

    // Skorları birleştir ve sırala
    const finalRecommendations = mergeRecommendationScores(recommendations, limit);
    console.log('🧠 Final recommendations after merge:', finalRecommendations.length);

    // İlanları çek
    const listingIds = finalRecommendations.map(r => r.listingId);
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:profiles!listings_user_id_fkey(
          id, name, avatar_url, rating, trust_score
        )
      `)
      .in('id', listingIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch recommended listings', error);
    }

    // İlanları skor sırasına göre düzenle
    const orderedListings = listingIds
      .map(id => listings?.find(l => l.id === id))
      .filter(Boolean) as ListingWithUser[];

    return {
      data: {
        listings: orderedListings,
        scores: finalRecommendations,
        algorithm,
        confidence: calculateConfidence(finalRecommendations),
      },
    };
  } catch (error) {
    console.error('Error in getSmartRecommendations:', error);
    return handleError(error);
  }
};

/**
 * Collaborative filtering önerileri
 */
const getCollaborativeRecommendations = async (
  similarUsers: UserSimilarity[],
  currentUserId: string
): Promise<RecommendationScore[]> => {
  try {
    const recommendations: RecommendationScore[] = [];
    const seenListings = new Set<string>();

    for (const similarUser of similarUsers) {
      // Benzer kullanıcının davranışlarını çek
      const { data: behaviors } = await supabase
        .from('user_behaviors')
        .select('listing_id, action')
        .eq('user_id', similarUser.userId)
        .in('action', ['favorite', 'offer', 'contact'])
        .limit(20);

      if (!behaviors) continue;

      // Kullanıcının zaten gördüğü ilanları filtrele
      const { data: userBehaviors } = await supabase
        .from('user_behaviors')
        .select('listing_id')
        .eq('user_id', currentUserId);

      const userSeenListings = new Set(userBehaviors?.map(b => b.listing_id) || []);

      behaviors.forEach(behavior => {
        if (!userSeenListings.has(behavior.listing_id) && !seenListings.has(behavior.listing_id)) {
          seenListings.add(behavior.listing_id);
          
          // Skor hesapla: benzerlik * davranış ağırlığı
          const actionWeight = behavior.action === 'favorite' ? 1.0 : 
                              behavior.action === 'offer' ? 1.5 : 0.8;
          
          recommendations.push({
            listingId: behavior.listing_id,
            score: similarUser.similarity * actionWeight,
            reason: `Benzer kullanıcılar ${behavior.action} yaptı`,
            algorithm: 'collaborative',
          });
        }
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error in getCollaborativeRecommendations:', error);
    return [];
  }
};

/**
 * Content-based filtering önerileri
 */
const getContentBasedRecommendations = async (
  preferences: UserPreferences,
  currentUserId: string
): Promise<RecommendationScore[]> => {
  try {
    const recommendations: RecommendationScore[] = [];
    
    console.log('🧠 Content-based: Checking favorite categories:', preferences.favoriteCategories);
    console.log('🧠 Content-based: Price range:', preferences.priceRange);
    
    // Kullanıcının favori kategorilerinden ilanlar
    if (preferences.favoriteCategories.length > 0) {
      const { data: categoryListings, error: categoryError } = await supabase
        .from('listings')
        .select('id, category, budget')
        .in('category', preferences.favoriteCategories)
        .eq('status', 'active')
        .gte('budget', preferences.priceRange.min)
        .lte('budget', preferences.priceRange.max)
        .limit(20);

      console.log('🧠 Content-based: Category listings found:', categoryListings?.length || 0);
      if (categoryError) console.log('🧠 Content-based: Category error:', categoryError);

      if (categoryListings) {
        categoryListings.forEach(listing => {
          recommendations.push({
            listingId: listing.id,
            score: 0.8, // Yüksek skor - favori kategori
            reason: 'Favori kategorinizde',
            algorithm: 'content',
          });
        });
      }
    }

    // Fiyat aralığına uygun ilanlar
    const { data: priceListings } = await supabase
      .from('listings')
      .select('id, category, budget')
      .eq('status', 'active')
      .gte('budget', preferences.priceRange.min)
      .lte('budget', preferences.priceRange.max)
      .limit(15);

    if (priceListings) {
      priceListings.forEach(listing => {
        // Zaten eklenmiş mi kontrol et
        const existing = recommendations.find(r => r.listingId === listing.id);
        if (!existing) {
          recommendations.push({
            listingId: listing.id,
            score: 0.6, // Orta skor - fiyat uyumu
            reason: 'Bütçenize uygun',
            algorithm: 'content',
          });
        }
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error in getContentBasedRecommendations:', error);
    return [];
  }
};

/**
 * Seller-focused filtering önerileri
 * Kullanıcının envanterindeki ürünlerin kategorilerine göre öneriler
 */
const getSellerFocusedRecommendations = async (
  userId: string
): Promise<RecommendationScore[]> => {
  try {
    const recommendations: RecommendationScore[] = [];
    
    console.log('🧠 Seller-focused: Analyzing user inventory for:', userId);

    // 1. Kullanıcının envanterini çek
    const { data: userInventory, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('id, category')
      .eq('user_id', userId);

    if (inventoryError) {
      console.log('🧠 Seller-focused: Inventory error:', inventoryError);
      return [];
    }

    if (!userInventory || userInventory.length === 0) {
      console.log('🧠 Seller-focused: No inventory found');
      return [];
    }

    console.log('🧠 Seller-focused: User inventory items:', userInventory.length);

    // 2. Envanter kategorilerini analiz et
    const categoryCounts = userInventory.reduce((acc, item) => {
      if (item.category) {
        acc[item.category] = (acc[item.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sellerCategories = Object.keys(categoryCounts);
    console.log('🧠 Seller-focused: Seller categories:', sellerCategories);

    // 3. Bu kategorilerde alış yapan kullanıcıları bul
    const { data: buyerBehaviors, error: buyerError } = await supabase
      .from('user_behaviors')
      .select('user_id, listing_id, action, category, created_at')
      .in('category', sellerCategories)
      .in('action', ['view', 'favorite', 'offer', 'contact'])
      .neq('user_id', userId) // Kendisi hariç
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Son 30 gün

    if (buyerError) {
      console.log('🧠 Seller-focused: Buyer behaviors error:', buyerError);
      return [];
    }

    if (!buyerBehaviors || buyerBehaviors.length === 0) {
      console.log('🧠 Seller-focused: No buyer behaviors found, using fallback strategy');
      
      // Fallback: Envanter kategorilerindeki popüler ilanları öner
      const { data: fallbackListings, error: fallbackError } = await supabase
        .from('listings')
        .select('id, category, budget, views_count, favorites_count')
        .eq('status', 'active')
        .in('category', sellerCategories)
        .order('views_count', { ascending: false })
        .order('favorites_count', { ascending: false })
        .limit(10);

      if (fallbackError) {
        console.log('🧠 Seller-focused: Fallback error:', fallbackError);
        return [];
      }

      if (fallbackListings && fallbackListings.length > 0) {
        console.log('🧠 Seller-focused: Fallback listings found:', fallbackListings.length);
        fallbackListings.forEach((listing, index) => {
          const score = 0.8 - (index * 0.05); // Yüksek skor, sırayla azalır
          recommendations.push({
            listingId: listing.id,
            score: Math.max(score, 0.4),
            reason: 'Envanterinizle ilgili kategorilerde popüler',
            algorithm: 'seller',
          });
        });
        return recommendations;
      }
      
      return [];
    }

    console.log('🧠 Seller-focused: Buyer behaviors found:', buyerBehaviors.length);

    // 4. Aktif alıcıları tespit et
    const buyerActivity = buyerBehaviors.reduce((acc, behavior) => {
      if (!acc[behavior.user_id]) {
        acc[behavior.user_id] = {
          actions: 0,
          categories: new Set(),
          lastAction: behavior.created_at,
        };
      }
      acc[behavior.user_id].actions++;
      acc[behavior.user_id].categories.add(behavior.category);
      return acc;
    }, {} as Record<string, { actions: number; categories: Set<string>; lastAction: string }>);

    // 5. En aktif alıcıları seç
    const activeBuyers = Object.entries(buyerActivity)
      .filter(([, activity]) => activity.actions >= 2) // En az 2 aksiyon
      .sort(([, a], [, b]) => b.actions - a.actions)
      .slice(0, 10) // En aktif 10 alıcı
      .map(([buyerId]) => buyerId);

    console.log('🧠 Seller-focused: Active buyers found:', activeBuyers.length);

    // 6. Bu alıcıların son davranışlarından ilanları öner
    const { data: recommendedListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, category, budget, views_count, favorites_count')
      .eq('status', 'active')
      .in('category', sellerCategories)
      .order('views_count', { ascending: false })
      .order('favorites_count', { ascending: false })
      .limit(15);

    if (listingsError) {
      console.log('🧠 Seller-focused: Listings error:', listingsError);
      return [];
    }

    if (recommendedListings) {
      recommendedListings.forEach((listing, index) => {
        const score = 0.9 - (index * 0.05); // Yüksek skor, sırayla azalır
        recommendations.push({
          listingId: listing.id,
          score: Math.max(score, 0.3),
          reason: 'Envanterinizle ilgili kategorilerde popüler',
          algorithm: 'seller',
        });
      });
    }

    console.log('🧠 Seller-focused: Generated recommendations:', recommendations.length);
    return recommendations;
  } catch (error) {
    console.error('Error in getSellerFocusedRecommendations:', error);
    return [];
  }
};

/**
 * Popularity-based filtering önerileri
 */
const getPopularityRecommendations = async (
  preferences: UserPreferences,
  currentUserId: string
): Promise<RecommendationScore[]> => {
  try {
    const recommendations: RecommendationScore[] = [];

    console.log('🧠 Popularity: Checking price range:', preferences.priceRange);

    // Popüler ilanları çek (görüntülenme, favori sayısına göre)
    const { data: popularListings, error: popularityError } = await supabase
      .from('listings')
      .select('id, views_count, favorites_count')
      .eq('status', 'active')
      .gte('budget', preferences.priceRange.min)
      .lte('budget', preferences.priceRange.max)
      .order('views_count', { ascending: false })
      .order('favorites_count', { ascending: false })
      .limit(10);

    console.log('🧠 Popularity: Popular listings found:', popularListings?.length || 0);
    if (popularityError) console.log('🧠 Popularity: Error:', popularityError);

    if (popularListings) {
      popularListings.forEach((listing, index) => {
        const score = 0.5 - (index * 0.05); // İndeks arttıkça skor azalır
        recommendations.push({
          listingId: listing.id,
          score: Math.max(score, 0.1), // Minimum skor
          reason: 'Popüler ilan',
          algorithm: 'popularity',
        });
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error in getPopularityRecommendations:', error);
    return [];
  }
};

/**
 * Öneri skorlarını birleştir
 */
const mergeRecommendationScores = (recommendations: RecommendationScore[], limit: number): RecommendationScore[] => {
  const scoreMap = new Map<string, RecommendationScore>();

  recommendations.forEach(rec => {
    if (scoreMap.has(rec.listingId)) {
      // Mevcut skoru güncelle (ortalama al)
      const existing = scoreMap.get(rec.listingId)!;
      existing.score = (existing.score + rec.score) / 2;
      existing.reason = `${existing.reason}, ${rec.reason}`;
    } else {
      scoreMap.set(rec.listingId, { ...rec });
    }
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/**
 * Öneri güvenilirliğini hesapla
 */
const calculateConfidence = (recommendations: RecommendationScore[]): number => {
  if (recommendations.length === 0) return 0;
  
  const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
  const diversity = new Set(recommendations.map(r => r.algorithm)).size;
  
  // Güvenilirlik: ortalama skor * algoritma çeşitliliği
  return Math.min(avgScore * (diversity / 3), 1.0);
};

/**
 * Hata işleme yardımcı fonksiyonu
 */
const handleError = (error: any): ApiResponse<any> => {
  if (error instanceof ValidationError) {
    return { 
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error
      }
    };
  }
  if (error instanceof DatabaseError) {
    return { 
      error: {
        code: 'DATABASE_ERROR',
        message: error.message,
        details: error.originalError
      }
    };
  }
  return { 
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error
    }
  };
}; 