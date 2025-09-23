
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import StatsSection from '@/components/StatsSection';
import { toast } from '@/components/ui/use-toast';
// import { categoriesConfig } from '@/config/categories'; // Removed - using dynamic categories
import { useNavigate } from 'react-router-dom';
import FeaturedListings from '@/components/FeaturedListings';
import AdBanner from '@/components/AdBanner';
import AdCard from '@/components/AdCard';
import {
  fetchPopularListings,
  fetchMostOfferedListings,
  fetchTodaysDeals,
  fetchRecentlyViewedListings,
  fetchListingsMatchingLastSearch,
} from '@/services/listingService';
import { useHomePageData } from '@/hooks/useHomePageData';

const HomePage = ({ listings: initialListings, onToggleFavorite, currentUser }) => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const listingsRef = useRef(null);

  const {
    searchQuery,
    selectedCategories,
    filters,
    setFilters,
    displayedListings,
    isFiltering,
    hasMore,
    isLoadingMore,
    isAnyFilterActive,
    nativeAds,
    handleSearchChange,
    handleCategorySelect,
    handleLoadMore
  } = useHomePageData({ initialListings, currentUser });

  const listingsWithAds = useMemo(() => {
    if (nativeAds.length === 0) {
      return displayedListings.map(listing => ({ type: 'listing', data: listing }));
    }

    const combined = [];
    let adIndex = 0;
    for (let i = 0; i < displayedListings.length; i++) {
      combined.push({ type: 'listing', data: displayedListings[i] });
      if ((i + 1) % 6 === 0 && i < displayedListings.length -1) {
        combined.push({ type: 'ad', data: nativeAds[adIndex % nativeAds.length] });
        adIndex++;
      }
    }
    return combined;
  }, [displayedListings, nativeAds]);

  const handleToggleFavoriteClick = (listingId, isFavorited) => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
      navigate('/auth?action=login');
      return;
    }
    onToggleFavorite(listingId, isFavorited);
  };

  const handleCreateClick = () => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "İlan oluşturmak için giriş yapmalısınız.", variant: "destructive" });
      navigate('/auth?action=login');
    } else {
      navigate('/ilan-olustur');
    }
  };

  const handleDiscoverClick = () => {
    listingsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background"
    >
      <Hero onCreateClick={handleCreateClick} onDiscoverClick={handleDiscoverClick} />
      
      {currentUser && (
        <>
          <FeaturedListings
            title="Son Gezdiğiniz İlanlar"
            fetchFunction={() => fetchRecentlyViewedListings(currentUser.id)}
            currentUser={currentUser}
            onToggleFavorite={onToggleFavorite}
          />
          <FeaturedListings
            title="Son Aramanıza Uygun İlanlar"
            fetchFunction={() => fetchListingsMatchingLastSearch(currentUser.id)}
            currentUser={currentUser}
            onToggleFavorite={onToggleFavorite}
          />
        </>
      )}

      <StatsSection />

      <FeaturedListings
        title="Popüler İlanlar"
        fetchFunction={fetchPopularListings}
        currentUser={currentUser}
        onToggleFavorite={onToggleFavorite}
      />

      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdBanner placement="in_feed" format="carousel" className="h-24 sm:h-32 lg:h-40" />
        </div>
      </section>

      <FeaturedListings
        title="En Çok Teklif Alanlar"
        fetchFunction={fetchMostOfferedListings}
        currentUser={currentUser}
        onToggleFavorite={onToggleFavorite}
      />
      <FeaturedListings
        title="Günün Fırsatları"
        fetchFunction={fetchTodaysDeals}
        currentUser={currentUser}
        onToggleFavorite={onToggleFavorite}
      />

      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8 lg:mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gradient mb-3 sm:mb-4">
              Kategoriler
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              Aradığın ürün veya hizmet hangi kategoride?
            </p>
          </motion.div>
          <div className="relative mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto">
            <Search className="absolute left-2 sm:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Kategorilerde veya ilanlarda ara..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-8 sm:pl-10 lg:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-input border border-border rounded-lg sm:rounded-xl text-foreground placeholder-muted-foreground focus:outline-none input-glow transition-all duration-300 text-sm sm:text-base"
            />
          </div>
          <CategoryGrid 
            selectedCategories={selectedCategories} 
            onCategorySelect={handleCategorySelect}
            searchQuery={searchQuery}
          />
        </div>
      </section>

      <section className="py-8 sm:py-12 lg:py-16" ref={listingsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 lg:mb-12 gap-3 sm:gap-4"
          >
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gradient mb-2 sm:mb-4">
                Güncel İlanlar
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                {isAnyFilterActive ? `${displayedListings.length} ilan bulundu` : 'En yeni ilanlar'}
              </p>
            </div>
            
            <div className="flex gap-2 sm:gap-3 lg:gap-4">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="border-primary/50 text-primary hover:bg-primary/10 text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4 py-1 sm:py-2"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Filtrele
              </Button>
            </div>
          </motion.div>

          <div className="relative">
            {isFiltering && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence>
                {listingsWithAds.map((item, index) => (
                  <motion.div
                    key={item.type === 'listing' ? item.data.id : `ad-${item.data.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    {item.type === 'listing' ? (
                      <ListingCard 
                        listing={item.data}
                        onToggleFavorite={handleToggleFavoriteClick}
                        currentUser={currentUser}
                      />
                    ) : (
                      <AdCard ad={item.data} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {!isFiltering && listingsWithAds.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12 lg:py-16 glass-effect rounded-xl lg:rounded-2xl"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3 lg:mb-4">
                Aradığın kriterlerde ilan bulunamadı
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base">
                Filtrelerini değiştir veya yeni bir ilan oluştur
              </p>
              <Button
                onClick={handleCreateClick}
                className="btn-primary text-primary-foreground font-semibold px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                İlan Oluştur
              </Button>
            </motion.div>
          )}

          {isAnyFilterActive && hasMore && !isFiltering && (
            <div className="text-center mt-8">
              <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline" className="btn-primary-outline">
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  'Daha Fazla Yükle'
                )}
              </Button>
            </div>
          )}
        </div>
      </section>
      
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        categoriesConfig={categoriesConfig}
      />
    </motion.div>
  );
};

export default HomePage;
