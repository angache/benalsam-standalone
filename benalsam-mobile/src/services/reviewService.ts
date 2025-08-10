import { supabase  } from '../services/supabaseClient';
import { ApiResponse } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  listing_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

export const createReview = async (reviewData: Partial<Review>): Promise<ApiResponse<Review>> => {
  try {
    // Validate required fields
    if (!reviewData.reviewer_id || !reviewData.reviewee_id || !reviewData.rating || !reviewData.listing_id) {
      throw new ValidationError('Reviewer ID, reviewee ID, listing ID and rating are required');
    }

    const { data, error } = await supabase
      .from('user_reviews')
      .insert([{
        reviewer_id: reviewData.reviewer_id,
        reviewee_id: reviewData.reviewee_id,
        listing_id: reviewData.listing_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to create review', error);
    }

    // Update user's rating
    await updateUserRating(reviewData.reviewee_id);

    return { data };
  } catch (error) {
    console.error('Error in createReview:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const updateReview = async (
  reviewId: string,
  rating: number,
  comment: string
): Promise<ApiResponse<Review>> => {
  try {
    if (!reviewId || !rating) {
      throw new ValidationError('Review ID and rating are required');
    }

    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const { data: review, error: fetchError } = await supabase
      .from('user_reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      throw new DatabaseError('Failed to fetch review', fetchError);
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
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to update review', error);
    }

    // Update user's rating
    await updateUserRating(review.reviewee_id);

    return { data };
  } catch (error) {
    console.error('Error in updateReview:', error);
    return { error: handleError(error) };
  }
};

export const deleteReview = async (reviewId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!reviewId) {
      throw new ValidationError('Review ID is required');
    }

    const { data: review, error: fetchError } = await supabase
      .from('user_reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      throw new DatabaseError('Failed to fetch review', fetchError);
    }

    const { error } = await supabase
      .from('user_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      throw new DatabaseError('Failed to delete review', error);
    }

    // Update user's rating
    await updateUserRating(review.reviewee_id);

    return { data: true };
  } catch (error) {
    console.error('Error in deleteReview:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getUserReviews = async (userId: string): Promise<ApiResponse<Review[]>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch user reviews', error);
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserReviews:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getReviewById = async (reviewId: string): Promise<ApiResponse<Review>> => {
  try {
    if (!reviewId) {
      throw new ValidationError('Review ID is required');
    }

    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', reviewId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch review', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in getReviewById:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getListingReviews = async (listingId: string): Promise<ApiResponse<Review[]>> => {
  try {
    if (!listingId) {
      throw new ValidationError('Listing ID is required');
    }

    const { data, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch listing reviews', error);
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getListingReviews:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

const updateUserRating = async (userId: string): Promise<void> => {
  try {
    // Get all reviews for the user
    const { data: reviews, error: reviewsError } = await supabase
      .from('user_reviews')
      .select('rating')
      .eq('reviewee_id', userId);

    if (reviewsError) {
      throw new DatabaseError('Failed to fetch user reviews for rating update', reviewsError);
    }

    if (!reviews || reviews.length === 0) {
      // If no reviews, reset rating to null
      await supabase
        .from('profiles')
        .update({
          rating: null,
          total_ratings: 0,
          rating_sum: 0
        })
        .eq('id', userId);
      return;
    }

    // Calculate new rating
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = ratingSum / reviews.length;

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        rating: averageRating,
        total_ratings: reviews.length,
        rating_sum: ratingSum
      })
      .eq('id', userId);

    if (updateError) {
      throw new DatabaseError('Failed to update user rating', updateError);
    }
  } catch (error) {
    console.error('Error in updateUserRating:', error);
    throw error;
  }
};

export const canUserReview = async (reviewerId: string, offerId: string) => {
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
  
  let revieweeId;
  if (reviewerId === offer.offering_user_id) { 
    revieweeId = (offer.listings as any)?.user_id; 
  } else if (reviewerId === (offer.listings as any)?.user_id) { 
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