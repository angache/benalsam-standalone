import { supabase } from './supabaseClient';
import { ListingWithUser } from './listingService/core';

export interface SimilarListing {
  listing: ListingWithUser;
  similarityScore: number;
  reason: string;
}

export interface SimilarListingsResponse {
  similarListings: SimilarListing[];
  totalCount: number;
}

/**
 * Verilen ilana benzer ilanları bul
 */
export const getSimilarListings = async (
  listingId: string,
  limit: number = 8
): Promise<SimilarListingsResponse> => {
  try {
    console.log('🔍 Getting similar listings for:', listingId);

    // Önce referans ilanı al
    const { data: referenceListing, error: refError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        budget,
        category,
        condition,
        location,
        image_url,
        main_image_url,
        additional_image_urls,
        views_count,
        favorites_count,
        created_at,
        status,
        profiles!inner(
          id,
          name,
          avatar_url,
          rating,
          trust_score
        )
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (refError || !referenceListing) {
      console.log('🔍 Similar listings: Reference listing not found');
      return { similarListings: [], totalCount: 0 };
    }

    console.log('🔍 Similar listings: Reference listing found:', referenceListing.category);

    // Benzer ilanları bul
    const { data: similarListings, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        budget,
        category,
        condition,
        location,
        image_url,
        main_image_url,
        additional_image_urls,
        views_count,
        favorites_count,
        created_at,
        status,
        profiles!inner(
          id,
          name,
          avatar_url,
          rating,
          trust_score
        )
      `)
      .eq('status', 'active')
      .eq('category', referenceListing.category)
      .neq('id', listingId) // Kendisi hariç
      .order('views_count', { ascending: false })
      .order('favorites_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit + 5); // Biraz fazla al, sonra filtrele

    if (error) {
      console.error('Error fetching similar listings:', error);
      throw new Error(`Failed to fetch similar listings: ${error.message}`);
    }

    // Benzerlik skorunu hesapla
    const similarListingsWithScore: SimilarListing[] = (similarListings || [])
      .map(listing => {
        let similarityScore = 0;
        let reasons: string[] = [];

        // Kategori benzerliği (en yüksek ağırlık)
        if (listing.category === referenceListing.category) {
          similarityScore += 0.5;
          reasons.push('Aynı kategori');
        }

        // Fiyat aralığı benzerliği
        const priceDiff = Math.abs(listing.budget - referenceListing.budget);
        const priceRatio = priceDiff / referenceListing.budget;
        if (priceRatio < 0.2) {
          similarityScore += 0.3;
          reasons.push('Benzer fiyat');
        } else if (priceRatio < 0.5) {
          similarityScore += 0.15;
          reasons.push('Yakın fiyat');
        }

        // Durum benzerliği
        if (listing.condition && referenceListing.condition) {
          const commonConditions = listing.condition.filter((c: any) => 
            referenceListing.condition?.includes(c)
          );
          if (commonConditions.length > 0) {
            similarityScore += 0.1;
            reasons.push('Benzer durum');
          }
        }

        // Popülerlik bonusu
        if (listing.views_count > 10 || listing.favorites_count > 2) {
          similarityScore += 0.05;
          reasons.push('Popüler');
        }

        return {
          listing: listing as unknown as ListingWithUser,
          similarityScore: Math.min(similarityScore, 1.0),
          reason: reasons.join(', '),
        };
      })
      .filter(item => item.similarityScore > 0.1) // Minimum benzerlik skoru
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    console.log('🔍 Similar listings found:', similarListingsWithScore.length);

    return {
      similarListings: similarListingsWithScore,
      totalCount: similarListingsWithScore.length,
    };
  } catch (error) {
    console.error('Error in getSimilarListings:', error);
    throw error;
  }
};

/**
 * Kategori bazlı benzer ilanları bul
 */
export const getSimilarListingsByCategory = async (
  category: string,
  excludeListingId?: string,
  limit: number = 8
): Promise<SimilarListingsResponse> => {
  try {
    console.log('🔍 Getting similar listings by category:', category);

    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        budget,
        category,
        condition,
        location,
        image_url,
        main_image_url,
        additional_image_urls,
        views_count,
        favorites_count,
        created_at,
        status,
        profiles!inner(
          id,
          name,
          avatar_url,
          rating,
          trust_score
        )
      `)
      .eq('status', 'active')
      .eq('category', category);

    // Sadece excludeListingId varsa filtrele
    if (excludeListingId) {
      query = query.neq('id', excludeListingId);
    }

    const { data: similarListings, error } = await query
      .order('views_count', { ascending: false })
      .order('favorites_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching similar listings by category:', error);
      throw new Error(`Failed to fetch similar listings by category: ${error.message}`);
    }

    const similarListingsWithScore: SimilarListing[] = (similarListings || []).map(listing => ({
      listing: listing as unknown as ListingWithUser,
      similarityScore: 0.8, // Kategori bazlı olduğu için yüksek skor
      reason: 'Aynı kategoride',
    }));

    console.log('🔍 Similar listings by category found:', similarListingsWithScore.length);

    return {
      similarListings: similarListingsWithScore,
      totalCount: similarListingsWithScore.length,
    };
  } catch (error) {
    console.error('Error in getSimilarListingsByCategory:', error);
    throw error;
  }
}; 