import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartCrack, Loader2, Search, Heart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
      <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8">
        {/* Header Skeleton */}
        <div className="mb-12 text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center px-4 bg-background">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <HeartCrack className="w-12 h-12 text-destructive" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">Bir Sorun Oluştu</h1>
          <p className="text-muted-foreground mb-8 max-w-md">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="gap-2"
          >
            <RefreshCw size={16} />
            Tekrar Dene
          </Button>
        </motion.div>
      </div>
    );
  }

  if (favoriteListings.length === 0) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center px-4 bg-background">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">Henüz Favori İlanınız Yok</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Beğendiğiniz ilanları favorilerinize ekleyerek buradan kolayca takip edebilirsiniz.
          </p>
          <Button asChild variant="default" size="lg" className="gap-2">
            <Link to="/">
              <Search size={16} />
              İlanlara Göz At
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <motion.div 
        className="mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gradient mb-4">Favori İlanlarım</h1>
        <p className="text-lg text-muted-foreground">
          Beğendiğiniz ve takip etmek istediğiniz ilanlar burada.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4" />
          <span>{favoriteListings.length} favori ilan</span>
        </div>
      </motion.div>

      <AnimatePresence>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {favoriteListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.03,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              <ListingCard 
                listing={listing}
                onToggleFavorite={handleToggleFavoriteState}
                currentUser={currentUser}
                isFavoritedOverride={true}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(FavoritesPage);