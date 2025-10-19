'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ListingCard from '@/components/ListingCard';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { fetchUserFavoriteStatusForListings } from '@/services/favoriteService';


const PopularInCategory = ({ currentListingId, category, sortBy = 'views_count', title, onMakeOffer, onToggleFavorite, currentUser, openAuthModal }) => {
  const [popularListings, setPopularListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularListings = async () => {
      setLoading(true);
      if (!category) {
        setPopularListings([]);
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
        .order(sortBy, { ascending: false, nullsFirst: false });

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching popular listings by ${sortBy}:`, error);
        toast({ title: "Popüler İlanlar Yüklenemedi", description: error.message, variant: "destructive" });
        setPopularListings([]);
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
        setPopularListings(listingsWithUser);
      }
      setLoading(false);
    };

    fetchPopularListings();
  }, [currentListingId, category, sortBy, currentUser]);

  const handleToggleFavoriteClick = (listingId, isFavorited) => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
      openAuthModal('login');
      return;
    }
     if (onToggleFavorite) {
        onToggleFavorite(listingId, isFavorited, (updatedListings) => {
            setPopularListings(prevPopular => prevPopular.map(l => 
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
        <h3 className="text-2xl font-semibold text-white mb-6 text-center">{title} Yükleniyor...</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-700/50 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (popularListings.length === 0) {
    return null; 
  }

  return (
    <div className="py-12 bg-background/30 backdrop-blur-sm rounded-xl mt-8">
              <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6">
        <motion.h3 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gradient mb-10 text-center"
        >
          {title}
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularListings.map((listing, index) => (
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

export default PopularInCategory;