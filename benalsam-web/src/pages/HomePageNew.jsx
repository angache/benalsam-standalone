import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import ListingCard from '@/components/ListingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { fetchListings } from '@/services/listingService';

// SessionStorage ile kalıcı state
const STORAGE_KEY = 'homepage_loaded_v2';
const LISTINGS_CACHE_KEY = 'homepage_listings_cache_v2';

const HomePageNew = ({ onToggleFavorite, currentUser }) => {
  
  // SessionStorage'dan kontrol et
  const hasLoadedFromStorage = sessionStorage.getItem(STORAGE_KEY) === 'true';
  const cachedListings = sessionStorage.getItem(LISTINGS_CACHE_KEY);
  
  // Debug log after state initialization

  const navigate = useNavigate();
  const [listings, setListings] = useState(() => {
    // Cache'den veri yükle
    if (cachedListings) {
      try {
        return JSON.parse(cachedListings);
      } catch (e) {
        console.error('Cache parse error:', e);
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(!hasLoadedFromStorage);
  const [searchQuery, setSearchQuery] = useState('');



  // Memoized handlers to prevent re-renders
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/arama?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, navigate]);

  const handleToggleFavoriteClick = useCallback((listingId, isFavorited) => {
    if (!currentUser) {
      toast({ 
        title: "Giriş Gerekli", 
        description: "Favorilere eklemek için giriş yapmalısınız.", 
        variant: "destructive" 
      });
      navigate('/auth?action=login');
      return;
    }
    onToggleFavorite(listingId, isFavorited);
  }, [currentUser, navigate, onToggleFavorite]);

  const handleCreateListing = useCallback(() => {
    navigate('/ilan-olustur');
  }, [navigate]);

  const handleCategories = useCallback(() => {
    navigate('/kategoriler');
  }, [navigate]);

  const handleFavorites = useCallback(() => {
    navigate('/favoriler');
  }, [navigate]);

  // Load listings once when component mounts or currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    // Clear cache if currentUser changed
    const cachedUserId = sessionStorage.getItem('homepage_user_id_v2');
    if (cachedUserId && cachedUserId !== currentUser.id.toString()) {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(LISTINGS_CACHE_KEY);
      sessionStorage.removeItem('homepage_user_id_v2');
    }
    
    const hasLoadedFromStorage = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (hasLoadedFromStorage && cachedUserId === currentUser.id.toString()) {
      setIsLoading(false);
      return;
    }
    
    const loadListings = async () => {
      try {
        setIsLoading(true);
        const fetchedListings = await fetchListings(currentUser.id);
        setListings(fetchedListings?.listings || []);
        
        // SessionStorage'a kaydet
        sessionStorage.setItem(STORAGE_KEY, 'true');
        sessionStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(fetchedListings?.listings || []));
        sessionStorage.setItem('homepage_user_id_v2', currentUser.id.toString());
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading listings:', error);
        toast({
          title: "İlanlar Yüklenemedi",
          description: "Ana sayfa ilanları yüklenirken bir sorun oluştu.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    loadListings();
  }, [currentUser]); // Run when currentUser changes

  // Memoized listings grid to prevent re-renders
  const listingsGrid = useMemo(() => {
    
    if (listings.length === 0) {
      return (
        <div className="text-center py-16 bg-card rounded-lg border">
          <h3 className="text-xl font-semibold">Henüz İlan Yok</h3>
          <p className="text-muted-foreground mt-2 mb-4">İlk ilanı siz oluşturun!</p>
          <Button onClick={handleCreateListing}>İlan Oluştur</Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onToggleFavorite={handleToggleFavoriteClick}
            currentUser={currentUser}
            size="normal"
            priority={false}
          />
        ))}
      </div>
    );
  }, [listings]); // Sadece listings dependency!

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">İlanlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
            <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-4">BenAlsam</h1>
        <p className="text-muted-foreground mb-6">İhtiyacınız olan her şeyi bulun ve satın</p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <Input
            placeholder="Aradığınız ürünü veya hizmeti yazın..."
            className="w-full pl-4 pr-12 py-6 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10">
            <Search className="text-primary-foreground" />
          </Button>
        </form>
      </div>

      {/* Listings Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Tüm İlanlar ({listings.length})</h2>
        {listingsGrid}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-xl font-bold mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={handleCreateListing} 
            className="h-16 text-lg"
            variant="outline"
          >
            İlan Oluştur
          </Button>
          <Button 
            onClick={handleCategories} 
            className="h-16 text-lg"
            variant="outline"
          >
            Kategoriler
          </Button>
          <Button 
            onClick={handleFavorites} 
            className="h-16 text-lg"
            variant="outline"
          >
            Favorilerim
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePageNew;
