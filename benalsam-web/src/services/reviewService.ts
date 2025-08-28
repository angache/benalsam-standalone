import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// Review interface
interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  offer_id?: string;
  listing_id?: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  reviewer?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  reviewee?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  offers?: {
    id: string;
    listing_id: string;
    listings?: {
      id: string;
      title: string;
      user_id: string;
    };
  };
}

// Error handling helper
const handleError = (error: any, title: string = "Hata", description: string = "Bir sorun oluştu"): null => {
  console.error(`Error in ${title}:`, error);
  toast({ 
    title: title, 
    description: error?.message || description, 
    variant: "destructive" 
  });
  return null;
};

// Validation helper
const validateReviewData = (reviewData: Partial<Review>): boolean => {
  const { reviewer_id, reviewee_id, offer_id, rating } = reviewData;
  
  if (!reviewer_id || !reviewee_id || !offer_id || !rating) {
    toast({ title: "Eksik Bilgi", description: "Yorum oluşturmak için gerekli tüm alanlar doldurulmalıdır.", variant: "destructive" });
    return false;
  }
  return true;
};

export const createReview = async (reviewData: Partial<Review>): Promise<Review | null> => {
  if (!validateReviewData(reviewData)) {
    return null;
  }

  const { reviewer_id, reviewee_id, offer_id, rating, comment } = reviewData;

  try {
    const { data, error } = await supabase
      .from('user_reviews')
      .insert([{ reviewer_id, reviewee_id, offer_id, rating, comment }])
      .select(`
        *,
        reviewer:profiles!reviewer_id (id, name, avatar_url),
        reviewee:profiles!reviewee_id (id, name, avatar_url),
        offers (
          id,
          listing_id,
          listings(id, title)
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return handleError(error, "Yorum Zaten Var", "Bu takas için daha önce yorum yaptınız");
      } else {
        return handleError(error, "Yorum Oluşturulamadı", error.message);
      }
    }

    toast({ 
      title: "Yorum Gönderildi! ⭐", 
      description: "Yorumunuz başarıyla gönderildi." 
    });

    return data as Review;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Yorum oluşturulurken bir sorun oluştu");
  }
};

export const updateReview = async (
  reviewId: string,
  rating: number,
  comment: string
): Promise<Review | null> => {
  try {
    if (!reviewId || !rating) {
      toast({ title: "Eksik Bilgi", description: "Yorum ID'si ve puan gereklidir.", variant: "destructive" });
      return null;
    }

    if (rating < 1 || rating > 5) {
      toast({ title: "Geçersiz Puan", description: "Puan 1 ile 5 arasında olmalıdır.", variant: "destructive" });
      return null;
    }

    const { data, error } = await supabase
      .from('user_reviews')
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select(`
        *,
        reviewer:profiles!reviewer_id (id, name, avatar_url),
        reviewee:profiles!reviewee_id (id, name, avatar_url)
      `)
      .single();

    if (error) {
      return handleError(error, "Yorum Güncellenemedi", error.message);
    }

    toast({ 
      title: "Yorum Güncellendi! ✅", 
      description: "Yorumunuz başarıyla güncellendi." 
    });

    return data as Review;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Yorum güncellenirken bir sorun oluştu");
  }
};

export const deleteReview = async (reviewId: string): Promise<boolean> => {
  try {
    if (!reviewId) {
      toast({ title: "Eksik Bilgi", description: "Yorum ID'si gereklidir.", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from('user_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return handleError(error, "Yorum Silinemedi", error.message) !== null;
    }

    toast({ 
      title: "Yorum Silindi! ✅", 
      description: "Yorumunuz başarıyla silindi." 
    });

    return true;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Yorum silinirken bir sorun oluştu") !== null;
  }
};

export const fetchUserReviews = async (userId: string): Promise<Review[]> => {
  if (!userId) return [];

  try {
    // ✅ OPTIMIZED: Single query with all necessary joins
    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id (
          id,
          name,
          avatar_url
        ),
        reviewee:profiles!reviewee_id (
          id,
          name,
          avatar_url
        ),
        offers (
          id,
          listing_id,
          listings (
            id,
            title
          )
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in fetchUserReviews:', error);
      return [];
    }

    return (data || []) as Review[];
  } catch (error) {
    console.error('Error in fetchUserReviews:', error);
    return [];
  }
};

export const getReviewById = async (reviewId: string): Promise<Review | null> => {
  try {
    if (!reviewId) {
      toast({ title: "Eksik Bilgi", description: "Yorum ID'si gereklidir.", variant: "destructive" });
      return null;
    }

    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id (id, name, avatar_url),
        reviewee:profiles!reviewee_id (id, name, avatar_url)
      `)
      .eq('id', reviewId)
      .single();

    if (error) {
      console.error('Error in getReviewById:', error);
      return null;
    }

    return data as Review;
  } catch (error) {
    console.error('Error in getReviewById:', error);
    return null;
  }
};

export const getListingReviews = async (listingId: string): Promise<Review[]> => {
  try {
    if (!listingId) return [];

    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id (id, name, avatar_url),
        reviewee:profiles!reviewee_id (id, name, avatar_url)
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getListingReviews:', error);
      return [];
    }

    return (data || []) as Review[];
  } catch (error) {
    console.error('Error in getListingReviews:', error);
    return [];
  }
};

export const canUserReview = async (reviewerId: string, offerId: string): Promise<boolean> => {
  if (!reviewerId || !offerId) return false;
  
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('listing_id, listings(user_id), offering_user_id, status')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    console.error("Error fetching offer for review check or offer not found:", offerError);
    return false;
  }

  if (offer.status !== 'accepted') {
    console.log("Review check: Offer not accepted.");
    return false; // Only allow reviews for accepted offers
  }
  
  let revieweeId: string;
  if (reviewerId === offer.offering_user_id) { 
    revieweeId = offer.listings.user_id; 
  } else if (reviewerId === offer.listings.user_id) { 
    revieweeId = offer.offering_user_id; 
  } else {
    console.log("Review check: Reviewer is not part of this offer.");
    return false; 
  }

  if (reviewerId === revieweeId) {
    console.log("Review check: User cannot review themselves.");
    return false; 
  }

  const { data: existingReview, error: reviewError } = await supabase
    .from('user_reviews')
    .select('id')
    .eq('offer_id', offerId)
    .eq('reviewer_id', reviewerId)
    .eq('reviewee_id', revieweeId) 
    .maybeSingle();

  if (reviewError) {
    console.error("Error checking existing review:", reviewError);
    return false;
  }

  return !existingReview;
};

// Additional functions from mobile version
export const getUserReviewStats = async (userId: string): Promise<{
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
} | null> => {
  try {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_reviews')
      .select('rating')
      .eq('reviewee_id', userId);

    if (error) {
      console.error('Error in getUserReviewStats:', error);
      return null;
    }

    const reviews = data || [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error in getUserReviewStats:', error);
    return null;
  }
}; 