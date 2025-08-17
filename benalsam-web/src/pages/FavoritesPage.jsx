import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartCrack, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ListingCard from '@/components/ListingCard';
import { toast } from '@/components/ui/use-toast';
import { fetchUserFavoriteListings } from '@/services/supabaseService';
import { useAuthStore } from '@/stores';

const FavoritesPage = ({ onToggleFavorite }) => {
  const { currentUser } = useAuthStore();
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!currentUser?.id || isInitialized) return;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedFavorites = await fetchUserFavoriteListings(currentUser.id);
        setFavoriteListings(fetchedFavorites.map(fav => ({...fav, is_favorited: true})));
        setIsInitialized(true);
      } catch (e) {
        console.error("Error in FavoritesPage useEffect:", e);
        setError("Favori ilanlar yüklenirken bir sorun oluştu.");
        toast({ title: "Hata", description: "Favori ilanlar yüklenemedi.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [currentUser?.id, isInitialized]);

  const handleToggleFavoriteState = useCallback((listingId, isFavorited) => {
    setFavoriteListings(prev => 
      isFavorited 
      ? prev.map(l => l.id === listingId ? { ...l, is_favorited: true, favorites_count: (l.favorites_count || 0) + 1 } : l)
      : prev.filter(l => l.id !== listingId) 
    );
    onToggleFavorite?.(listingId, isFavorited); 
  }, [onToggleFavorite]);


  if (loading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Favori ilanlarınız yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center px-4 bg-background">
        <HeartCrack className="w-20 h-20 text-destructive mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Bir Sorun Oluştu</h1>
        <p className="text-muted-foreground mb-8 max-w-md">{error}</p>
      </div>
    );
  }

  if (favoriteListings.length === 0) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center px-4 bg-background">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <HeartCrack className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Henüz Favori İlanınız Yok</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Beğendiğiniz ilanları favorilerinize ekleyerek buradan kolayca takip edebilirsiniz.
        </p>
        <Button asChild className="btn-primary text-primary-foreground">
          <Link to="/">İlanlara Göz At</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gradient mb-4">Favori İlanlarım</h1>
        <p className="text-lg text-muted-foreground">
          Beğendiğiniz ve takip etmek istediğiniz ilanlar burada.
        </p>
      </div>

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {favoriteListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <ListingCard 
                listing={listing}
                onToggleFavorite={handleToggleFavoriteState}
                currentUser={currentUser}
                isFavoritedOverride={true}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(FavoritesPage);