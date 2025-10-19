import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { updateOfferStatus as updateOfferStatusService } from '@/services/offerService';
import { getOrCreateConversation as getOrCreateConversationService } from '@/services/conversationService';
import { addFavorite, removeFavorite, fetchUserFavoriteStatusForListings } from '@/services/favoriteService';
import { useAuthStore } from '@/stores';

export const useListingDetail = (listingId, setListings) => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [listing, setListing] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [updatingOfferId, setUpdatingOfferId] = useState(null);

  const fetchListingDetails = useCallback(async () => {
    setLoading(true);
    
    // ✅ OPTIMIZED: Single query with all necessary joins
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:profiles!listings_user_id_fkey(
          id,
          name,
          avatar_url,
          rating,
          total_ratings,
          rating_sum
        )
      `)
      .eq('id', listingId)
      .single();

    if (error || !data) {
      toast({ title: "İlan Bulunamadı", description: "Bu ilan mevcut değil veya kaldırılmış.", variant: "destructive" });
      navigate('/');
      setLoading(false);
      return;
    }
    
    let fetchedListing = { ...data, user: data.profiles };

    if (currentUser) {
      const favoriteStatus = await fetchUserFavoriteStatusForListings(currentUser.id, [fetchedListing.id]);
      fetchedListing.is_favorited = favoriteStatus[fetchedListing.id] || false;
      setIsFavorited(fetchedListing.is_favorited);
    } else {
      fetchedListing.is_favorited = false;
      setIsFavorited(false);
    }
    
    setListing(fetchedListing);

    const viewedKey = `viewed_listing_${fetchedListing.id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      await supabase.rpc('increment_view_count', { row_id: fetchedListing.id });
      setListing(prev => prev ? ({ ...prev, views_count: (prev.views_count || 0) + 1 }) : null);
      sessionStorage.setItem(viewedKey, 'true');
    }

    if (currentUser && data.user_id === currentUser.id) {
      // ✅ OPTIMIZED: Single query with joins for offers
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select(`
          *,
          profiles:offering_user_id(
            id,
            name,
            avatar_url
          ),
          inventory_items(
            id,
            name,
            category,
            main_image_url,
            image_url
          ),
          conversation_id
        `)
        .eq('listing_id', fetchedListing.id)
        .order('created_at', { ascending: false });

      if (offersError) console.error("Error fetching offers:", offersError);
      else setOffers(offersData.map(o => ({ 
        ...o, 
        user: o.profiles, 
        offered_item: o.inventory_items 
      })));
    } else {
      setOffers([]); 
    }
    setLoading(false);
  }, [listingId, currentUser, navigate]);

  useEffect(() => {
    fetchListingDetails();
  }, [fetchListingDetails]);

  const handleUpdateOfferStatus = useCallback(async (offerId, status, offeringUserId) => {
    if (!listing || !currentUser) return;
    setUpdatingOfferId(offerId);
    const updatedOffer = await updateOfferStatusService(offerId, status, currentUser.id, offeringUserId, listing.user_id, listing.id);
    if (updatedOffer) {
      setOffers(prevOffers => 
        prevOffers.map(offer => offer.id === offerId ? { ...offer, status: updatedOffer.status, conversation_id: updatedOffer.conversation_id } : offer)
      );
      if (status === 'accepted') {
        fetchListingDetails();
      }
    } else {
      toast({ title: "Hata", description: "Teklif durumu güncellenirken bir sorun oluştu.", variant: "destructive" });
    }
    setUpdatingOfferId(null);
  }, [listing, currentUser, fetchListingDetails]);

  const handleStartOrGoToConversation = useCallback(async (offer) => {
    if (!currentUser || !offer.user) {
      toast({ title: "Hata", description: "Sohbet başlatılamadı, kullanıcı bilgileri eksik.", variant: "destructive" });
      return;
    }
    
    let conversationId = offer.conversation_id;
    const isOwner = currentUser && listing.user && currentUser.id === listing.user.id;

    if (!conversationId) {
      const user1 = isOwner ? currentUser.id : offer.offering_user_id;
      const user2 = isOwner ? offer.offering_user_id : currentUser.id;
      conversationId = await getOrCreateConversationService(user1, user2, offer.id, listing.id);
    }

    if (conversationId) {
      setOffers(prevOffers => prevOffers.map(o => o.id === offer.id ? { ...o, conversation_id: conversationId } : o));
      navigate(`/mesajlar/${conversationId}`);
    } else {
      toast({ title: "Sohbet Başlatılamadı", description: "Lütfen tekrar deneyin.", variant: "destructive" });
    }
  }, [currentUser, listing, navigate]);

  const handleToggleFavoriteClick = useCallback(async () => {
    if (!currentUser) {
      navigate('/auth?action=login', { state: { from: location } });
      return;
    }
    if (!listing) return;

    const newFavoritedStatus = !isFavorited;
    setIsFavorited(newFavoritedStatus);
    
    setListings(prevListings => prevListings.map(l => 
      l.id === listing.id 
      ? { ...l, is_favorited: newFavoritedStatus, favorites_count: newFavoritedStatus ? (l.favorites_count || 0) + 1 : Math.max(0, (l.favorites_count || 0) - 1) } 
      : l
    ));

    const success = newFavoritedStatus ? await addFavorite(currentUser.id, listing.id) : await removeFavorite(currentUser.id, listing.id);

    if (!success) {
      setIsFavorited(!newFavoritedStatus); // Revert on failure
       setListings(prevListings => prevListings.map(l => 
        l.id === listing.id 
        ? { ...l, is_favorited: !newFavoritedStatus, favorites_count: !newFavoritedStatus ? (l.favorites_count || 0) + 1 : Math.max(0, (l.favorites_count || 0) - 1) } 
        : l
      ));
    }
  }, [currentUser, isFavorited, listing, location, navigate, setListings]);

  return {
    listing,
    offers,
    loading,
    isFavorited,
    updatingOfferId,
    handleUpdateOfferStatus,
    handleStartOrGoToConversation,
    handleToggleFavoriteClick,
    fetchListingDetails
  };
};