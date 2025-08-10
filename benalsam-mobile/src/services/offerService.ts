import { supabase } from './supabaseClient';
import { Offer, ApiResponse } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

// Offer Details
export const fetchOfferDetails = async (offerId: string): Promise<Offer> => {
  try {
    if (!offerId) {
      throw new ValidationError('Offer ID is required');
    }

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        listings (
          id,
          title,
          main_image_url,
          user_id,
          profiles (
            id,
            name,
            avatar_url
          )
        ),
        inventory_items!offers_offered_item_id_fkey (
          id,
          name,
          category,
          main_image_url,
          image_url
        )
      `)
      .eq('id', offerId)
      .single();

    if (error) {
      console.error('Error in fetchOfferDetails:', error);
      throw new DatabaseError('Failed to fetch offer', error);
    }

    // Format data
    const formattedData = {
      ...data,
      listing: {
        ...data.listings,
        user: data.listings?.profiles
      }
    };

    return formattedData;
  } catch (error) {
    console.error('Error in fetchOfferDetails:', error);
    throw error;
  }
};

// Create Offer
export const createOffer = async (offerData: Partial<Offer>): Promise<Offer> => {
  try {
    // Validate required fields
    if (!offerData.listing_id) {
      throw new ValidationError('Listing ID is required');
    }

    if (!offerData.offering_user_id) {
      throw new ValidationError('Offering user ID is required');
    }

    if (!offerData.message) {
      throw new ValidationError('Message is required');
    }

    const newOffer = {
      listing_id: offerData.listing_id,
      offering_user_id: offerData.offering_user_id,
      offered_item_id: offerData.offered_item_id,
      offered_price: offerData.offered_price,
      message: offerData.message,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('offers')
      .insert([newOffer])
      .select(`
        *,
        listings (
          id,
          title,
          main_image_url,
          user_id,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        ),
        profiles (
          id,
          name,
          avatar_url
        ),
        inventory_items!offers_offered_item_id_fkey (
          id,
          name,
          category,
          main_image_url,
          image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error in createOffer:', error);
      throw new DatabaseError('Failed to create offer', error);
    }

    if (!data) {
      throw new DatabaseError('Failed to create offer: No data returned');
    }

    // Format data
    const formattedData = {
      ...data,
      listing: {
        ...data.listings,
        user: data.listings?.profiles
      },
      user: data.profiles,
      inventory_item: data.inventory_items
    };

    return formattedData;
  } catch (error) {
    console.error('Error in createOffer:', error);
    throw error;
  }
};

// Update Offer Status
export const updateOfferStatus = async (
  offerId: string,
  status: Offer['status']
): Promise<Offer> => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', offerId)
      .select('*')
      .single();

    if (error) {
      console.error('Error in updateOfferStatus:', error);
      throw new DatabaseError('Failed to update offer status', error);
    }

    return data;
  } catch (error) {
    console.error('Error in updateOfferStatus:', error);
    throw error;
  }
};

// Delete Offer
export const deleteOffer = async (offerId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      console.error('Error in deleteOffer:', error);
      throw new DatabaseError('Failed to delete offer', error);
    }
  } catch (error) {
    console.error('Error in deleteOffer:', error);
    throw error;
  }
};

// Get Sent Offers
export const getSentOffers = async (userId: string): Promise<Offer[]> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        listings (
          id,
          title,
          main_image_url,
          user_id,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        ),
        inventory_items!offers_offered_item_id_fkey (
          id,
          name,
          category,
          main_image_url,
          image_url
        )
      `)
      .eq('offering_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getSentOffers:', error);
      throw new DatabaseError('Failed to fetch sent offers', error);
    }

    // Format data
    const formattedData = data?.map((offer: any) => ({
      ...offer,
      listing: {
        ...offer.listings,
        user: offer.listings?.profiles
      },
      inventory_item: offer.inventory_items
    })) || [];

    return formattedData;
  } catch (error) {
    console.error('Error in getSentOffers:', error);
    throw error;
  }
};

// Get Received Offers
export const getReceivedOffers = async (userId: string): Promise<Offer[]> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Önce kullanıcının ilanlarını bulalım
    const { data: userListings, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', userId);

    if (listingsError) {
      console.error('Error fetching user listings:', listingsError);
      throw new DatabaseError('Failed to fetch user listings', listingsError);
    }

    const listingIds = userListings.map((listing: any) => listing.id);

    if (listingIds.length === 0) {
      return []; // Kullanıcının hiç ilanı yoksa boş array dön
    }

    // Şimdi bu ilanlara gelen teklifleri bulalım
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        listings (
          id,
          title,
          main_image_url,
          user_id
        ),
        profiles (
          id,
          name,
          avatar_url
        ),
        inventory_items!offers_offered_item_id_fkey (
          id,
          name,
          category,
          main_image_url,
          image_url
        )
      `)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getReceivedOffers:', error);
      throw new DatabaseError('Failed to fetch received offers', error);
    }

    // Format data
    const formattedData = data?.map((offer: any) => ({
      ...offer,
      listing: offer.listings,
      user: offer.profiles,
      inventory_item: offer.inventory_items
    })) || [];

    return formattedData;
  } catch (error) {
    console.error('Error in getReceivedOffers:', error);
    throw error;
  }
};

// Get Offer By ID
export const getOfferById = async (offerId: string): Promise<Offer> => {
  try {
    if (!offerId) {
      throw new ValidationError('Offer ID is required');
    }

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        listings!offers_listing_id_fkey (
          id,
          title,
          main_image_url,
          user_id,
          profiles!listings_user_id_fkey (
            id,
            name,
            avatar_url
          )
        ),
        profiles!offers_offering_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', offerId)
      .single();

    if (error) {
      console.error('Error in getOfferById:', error);
      throw new DatabaseError('Failed to fetch offer', error);
    }

    // Format data
    const formattedData = {
      ...data,
      listing: {
        ...data.listings,
        user: data.listings?.profiles
      },
      user: data.profiles
    };

    return formattedData;
  } catch (error) {
    console.error('Error in getOfferById:', error);
    throw error;
  }
};

// Get Offers For Listing
export const getOffersForListing = async (listingId: string): Promise<Offer[]> => {
  try {
    if (!listingId) {
      throw new ValidationError('Listing ID is required');
    }

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles!offers_offering_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getOffersForListing:', error);
      throw new DatabaseError('Failed to fetch offers for listing', error);
    }

    // Format data
    const formattedData = data?.map((offer: any) => ({
      ...offer,
      user: offer.profiles
    })) || [];

    return formattedData;
  } catch (error) {
    console.error('Error in getOffersForListing:', error);
    throw error;
  }
};

// Get Offer Count
export const getOfferCount = async (listingId: string): Promise<number> => {
  try {
    if (!listingId) {
      throw new ValidationError('Listing ID is required');
    }

    const { count, error } = await supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error in getOfferCount:', error);
      throw new DatabaseError('Failed to get offer count', error);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getOfferCount:', error);
    throw error;
  }
};