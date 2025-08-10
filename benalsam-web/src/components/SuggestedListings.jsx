import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ListingCard from '@/components/ListingCard';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { fetchUserFavoriteStatusForListings } from '@/services/favoriteService';

const SuggestedListings = ({ currentListingId, category, onMakeOffer, onToggleFavorite, currentUser, openAuthModal }) => {
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedListings = async () => {
      setLoading(true);
      if (!category) {
        setSuggested([]);
        setLoading(false);
        return;
      }
      
      const mainCategory = category.split(' > ')[0];

      let query = supabase
        .from('listings')
        .select('*, profiles:profiles!listings_user_id_fkey(id, name, avatar_url, rating)')
        .neq('id', currentListingId)
        .ilike('category', `${mainCategory}%`)
        .limit(4);
        
      query = query
        .order('is_urgent_premium', { ascending: false, nullsLast: true })
        .order('is_featured', { ascending: false, nullsLast: true })
        .order('is_showcase', { ascending: false, nullsLast: true })
        .order('upped_at', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching suggested listings:', error);
        toast({ title: "Önerilen İlanlar Yüklenemedi", description: error.message, variant: "destructive" });
        setSuggested([]);
      } else {
        let listingsWithUser = data.map(listing => ({
            ...listing,
            user: listing.profiles,
            is_favorited: false
        }));

        if (currentUser && listingsWithUser.length > 0) {
            const listingIds = listingsWithUser.map(l => l.id);
            const favoriteStatuses = await fetchUserFavoriteStatusForListings(currentUser.id, listingIds);
            listingsWithUser = listingsWithUser.map(l => ({
                ...l,
                is_favorited: favoriteStatuses[l.id] || false
            }));
        }
        setSuggested(listingsWithUser);
      }
      setLoading(false);
    };

    fetchSuggestedListings();
  }, [currentListingId, category, currentUser]);

  const handleToggleFavoriteClick = (listingId, isFavorited) => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
      openAuthModal('login');
      return;
    }
    if (onToggleFavorite) {
        onToggleFavorite(listingId, isFavorited, (updatedListings) => {
            setSuggested(prevSuggested => prevSuggested.map(l => 
                l.id === listingId 
                ? { ...l, is_favorited: isFavorited, favorites_count: isFavorited ? (l.favorites_count || 0) + 1 : Math.max(0, (l.favorites_count || 0) - 1) } 
                : l
            ));
        });
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-2xl font-semibold text-white mb-6 text-center">Benzer İlanlar Yükleniyor...</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-700/50 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (suggested.length === 0) {
    return null; 
  }

  return (
    <div className="py-12 bg-background/30 backdrop-blur-sm rounded-xl mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h3 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gradient mb-10 text-center"
        >
          Bunlar da İlgini Çekebilir
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {suggested.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <ListingCard 
                listing={listing} 
                onMakeOffer={onMakeOffer} 
                onToggleFavorite={handleToggleFavoriteClick}
                currentUser={currentUser}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedListings;