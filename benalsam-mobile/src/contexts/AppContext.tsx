import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores';
import { supabase } from '../services/supabaseClient';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  user_id: string;
  created_at: string;
  is_favorite?: boolean;
}

interface AppContextType {
  listings: Listing[];
  favorites: string[];
  loading: boolean;
  fetchListings: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  createListing: (listing: Omit<Listing, 'id' | 'created_at'>) => Promise<void>;
  selectedLocation: {
    province: string;
    district: string;
  } | null;
  setSelectedLocation: (location: { province: string; district: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    province: string;
    district: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchFavorites();
    }
  }, [user]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(fav => fav.listing_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (listingId: string) => {
    if (!user) return;

    try {
      const isFavorite = favorites.includes(listingId);

      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== listingId));
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, listing_id: listingId }]);

        if (error) throw error;
        setFavorites(prev => [...prev, listingId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const createListing = async (listing: Omit<Listing, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert([{ ...listing, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setListings(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  };

  const value = {
    listings,
    favorites,
    loading,
    fetchListings,
    toggleFavorite,
    createListing,
    selectedLocation,
    setSelectedLocation,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 