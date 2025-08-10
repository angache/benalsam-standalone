import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { Offer, ApiResponse } from '@/types';

// Error handling helper
const handleError = (error: any, title = "Hata", description = "Bir sorun oluştu") => {
  console.error(`Error in ${title}:`, error);
  toast({ 
    title: title, 
    description: error?.message || description, 
    variant: "destructive" 
  });
  return null;
};

// Validation helper
const validateOfferData = (offerData: Partial<Offer>): boolean => {
  if (!offerData.listing_id || !offerData.offering_user_id) {
    toast({ title: "Eksik Bilgi", description: "Teklif oluşturmak için gerekli bilgiler eksik.", variant: "destructive" });
    return false;
  }

  if (!offerData.offered_item_id && !offerData.offered_price) {
    toast({ title: "Eksik Teklif", description: "En az bir ürün seçin veya nakit teklifi yapın.", variant: "destructive" });
    return false;
  }

  return true;
};

// Create Offer
export const createOffer = async (offerData: Partial<Offer>): Promise<Offer | null> => {
  if (!validateOfferData(offerData)) {
    return null;
  }

  try {
    const insertPayload: any = {
      listing_id: offerData.listing_id,
      offering_user_id: offerData.offering_user_id,
      message: offerData.message || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (offerData.offered_item_id) {
      insertPayload.offered_item_id = offerData.offered_item_id;
    }

    if (offerData.offered_price) {
      insertPayload.offered_price = parseFloat(offerData.offered_price.toString());
    }
    
    if (offerData.attachments && offerData.attachments.length > 0) {
      insertPayload.attachments = JSON.stringify(offerData.attachments.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type
      })));
    }

    if (offerData.ai_suggestion) {
      insertPayload.ai_suggestion = offerData.ai_suggestion;
    }

    const { data, error } = await supabase
      .from('offers')
      .insert([insertPayload])
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
      return handleError(error, "Teklif Gönderilemedi", "Teklif oluşturulamadı");
    }

    if (!data) {
      return handleError(null, "Teklif Gönderilemedi", "Teklif oluşturulamadı");
    }

    // Add user activity
    await addUserActivity(
      offerData.offering_user_id!,
      'offer_sent',
      'Teklif gönderildi',
      `Bir ilana teklif gönderildi`,
      data.id
    );

    // Format data like mobile version
    const formattedData = {
      ...data,
      listing: {
        ...data.listings,
        user: data.listings?.profiles
      },
      user: data.profiles,
      inventory_item: data.inventory_items
    };

    toast({ 
      title: "Teklif Gönderildi! 🎉", 
      description: "Teklifiniz başarıyla gönderildi." 
    });

    return formattedData;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Teklif gönderilirken bir sorun oluştu");
  }
};

// Fetch Offer Details
export const fetchOfferDetails = async (offerId: string): Promise<Offer | null> => {
  if (!offerId) {
    toast({ title: "Eksik Bilgi", description: "Teklif ID'si gerekli.", variant: "destructive" });
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles:offering_user_id(id, name, avatar_url, rating, total_ratings),
        listings!offers_listing_id_fkey(
          id,
          title,
          main_image_url,
          image_url,
          budget,
          status,
          user_id,
          profiles:user_id(id, name, avatar_url, rating, total_ratings)
        ),
        inventory_items!offers_offered_item_id_fkey(id, name, category, main_image_url, image_url)
      `)
      .eq('id', offerId)
      .single();

    if (error) {
      console.error('Error fetching offer details:', error);
      toast({ title: "Teklif Bulunamadı", description: "Teklif detayları alınamadı.", variant: "destructive" });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchOfferDetails:', error);
    toast({ title: "Beklenmedik Hata", description: "Teklif detayları yüklenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

// Update Offer Status
export const updateOfferStatus = async (offerId: string, newStatus: string, userId: string): Promise<Offer | null> => {
  if (!offerId || !newStatus || !userId) {
    toast({ title: "Eksik Bilgi", description: "Teklif durumu güncellemek için gerekli bilgiler eksik.", variant: "destructive" });
    return null;
  }

  try {
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listings!offers_listing_id_fkey(id, title, user_id, status)
      `)
      .eq('id', offerId)
      .single();

    if (fetchError) {
      console.error('Error fetching offer:', fetchError);
      toast({ title: "Teklif Bulunamadı", description: "Güncellenecek teklif bulunamadı.", variant: "destructive" });
      return null;
    }

    if (!offer.listing || offer.listing.user_id !== userId) {
      toast({ title: "Yetki Hatası", description: "Bu teklifi güncelleme yetkiniz yok.", variant: "destructive" });
      return null;
    }

    if (newStatus === 'accepted') {
      if (offer.listing.status === 'in_transaction' || offer.listing.status === 'sold') {
        toast({ title: "İşlem Reddedildi", description: "Bu ilan için zaten başka bir teklif kabul edilmiş veya ilan satılmış.", variant: "destructive" });
        return null;
      }
      
      const { error: listingUpdateError } = await supabase
        .from('listings')
        .update({
          status: 'in_transaction',
          offer_accepted_at: new Date().toISOString(),
          accepted_offer_id: offerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', offer.listing.id);

      if (listingUpdateError) {
        console.error('Error updating listing to in_transaction:', listingUpdateError);
        toast({ title: "Hata", description: "İlan durumu güncellenirken bir hata oluştu.", variant: "destructive"});
        return null;
      }

      await supabase
        .from('offers')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('listing_id', offer.listing.id)
        .eq('status', 'pending');
    }

    const { data, error } = await supabase
      .from('offers')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating offer status:', error);
      toast({ title: "Teklif Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }
    
    if (newStatus === 'accepted') {
      await addUserActivity(
        userId,
        'offer_accepted',
        'Teklif kabul edildi',
        `Bir teklif kabul edildi`,
        offerId
      );
    } else if (newStatus === 'rejected') {
      await addUserActivity(
        userId,
        'offer_rejected',
        'Teklif reddedildi',
        `Bir teklif reddedildi`,
        offerId
      );
    }

    toast({ 
      title: "Teklif Güncellendi", 
      description: `Teklif durumu ${newStatus === 'accepted' ? 'kabul edildi' : 'reddedildi'}.` 
    });

    return data;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Teklif durumu güncellenirken bir sorun oluştu");
  }
};

// Get Sent Offers
export const fetchSentOffers = async (userId: string): Promise<Offer[]> => {
  if (!userId) {
    toast({ title: "Eksik Bilgi", description: "Kullanıcı ID'si gerekli.", variant: "destructive" });
    return [];
  }

  try {
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
      console.error('Error fetching sent offers:', error);
      toast({ title: "Hata", description: "Gönderilen teklifler yüklenirken bir sorun oluştu.", variant: "destructive" });
      return [];
    }

    // Format data like mobile version
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
    console.error('Error in fetchSentOffers:', error);
    toast({ title: "Beklenmedik Hata", description: "Gönderilen teklifler yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

// Get Received Offers
export const fetchReceivedOffers = async (userId: string): Promise<Offer[]> => {
  if (!userId) {
    toast({ title: "Eksik Bilgi", description: "Kullanıcı ID'si gerekli.", variant: "destructive" });
    return [];
  }

  try {
    // Önce kullanıcının ilanlarını bulalım
    const { data: userListings, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', userId);

    if (listingsError) {
      console.error('Error fetching user listings:', listingsError);
      toast({ title: "Hata", description: "Kullanıcı ilanları yüklenirken bir sorun oluştu.", variant: "destructive" });
      return [];
    }

    if (!userListings || userListings.length === 0) {
      return [];
    }

    const listingIds = userListings.map((listing: any) => listing.id);

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles:offering_user_id(id, name, avatar_url, rating, total_ratings),
        listings!offers_listing_id_fkey(
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
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received offers:', error);
      toast({ title: "Hata", description: "Alınan teklifler yüklenirken bir sorun oluştu.", variant: "destructive" });
      return [];
    }

    // Format data like mobile version
    const formattedData = data?.map((offer: any) => ({
      ...offer,
      listing: {
        ...offer.listings,
        user: offer.listings?.profiles
      },
      user: offer.profiles,
      inventory_item: offer.inventory_items
    })) || [];

    return formattedData;
  } catch (error) {
    console.error('Error in fetchReceivedOffers:', error);
    toast({ title: "Beklenmedik Hata", description: "Alınan teklifler yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

// Delete Offer
export const deleteOffer = async (offerId: string, userId: string): Promise<boolean> => {
  if (!offerId || !userId) {
    toast({ title: "Eksik Bilgi", description: "Teklif silmek için gerekli bilgiler eksik.", variant: "destructive" });
    return false;
  }

  try {
    // Önce teklifin kullanıcıya ait olup olmadığını kontrol edelim
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('offering_user_id')
      .eq('id', offerId)
      .single();

    if (fetchError) {
      console.error('Error fetching offer:', fetchError);
      toast({ title: "Teklif Bulunamadı", description: "Silinecek teklif bulunamadı.", variant: "destructive" });
      return false;
    }

    if (offer.offering_user_id !== userId) {
      toast({ title: "Yetki Hatası", description: "Bu teklifi silme yetkiniz yok.", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      console.error('Error deleting offer:', error);
      toast({ title: "Teklif Silinemedi", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ 
      title: "Teklif Silindi", 
      description: "Teklif başarıyla silindi." 
    });

    return true;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Teklif silinirken bir sorun oluştu") ? false : false;
  }
};

// Get Offer by ID
export const getOfferById = async (offerId: string): Promise<Offer | null> => {
  try {
    if (!offerId) {
      throw new Error('Offer ID is required');
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
        profiles:offering_user_id (
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
      .eq('id', offerId)
      .single();

    if (error) {
      console.error('Error in getOfferById:', error);
      throw error;
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
    console.error('Error in getOfferById:', error);
    throw error;
  }
};

// Get Offers for Listing
export const getOffersForListing = async (listingId: string): Promise<Offer[]> => {
  try {
    if (!listingId) {
      throw new Error('Listing ID is required');
    }

    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles:offering_user_id (
          id,
          name,
          avatar_url,
          rating,
          total_ratings
        ),
        inventory_items!offers_offered_item_id_fkey (
          id,
          name,
          category,
          main_image_url,
          image_url
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getOffersForListing:', error);
      throw error;
    }

    // Format data
    const formattedData = data?.map((offer: any) => ({
      ...offer,
      user: offer.profiles,
      inventory_item: offer.inventory_items
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
      throw new Error('Listing ID is required');
    }

    const { count, error } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error in getOfferCount:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getOfferCount:', error);
    throw error;
  }
}; 