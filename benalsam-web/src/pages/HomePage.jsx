
    import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHomePageData } from '@/hooks/useHomePageData';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import ListingCard from '@/components/ListingCard';
import AdCard from '@/components/AdCard';
import AdBanner from '@/components/AdBanner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LayoutGrid, List, ChevronRight, Search, X } from 'lucide-react';
import { categoriesConfig } from '@/config/categories';
import { cn } from '@/lib/utils';
import MobileCategoryScroller from '@/components/HomePage/MobileCategoryScroller';
import CategoryItem from '@/components/HomePage/CategoryItem';
import FeaturedListings from '@/components/FeaturedListings';
import StatsSection from '@/components/StatsSection';
import PersonalizedFeed from '@/components/PersonalizedFeed';
import SEOHead from '@/components/SEOHead';
import {
  fetchListings,
  fetchPopularListings,
  fetchMostOfferedListings,
  fetchTodaysDeals,
} from '@/services/listingService';


    const HomePage = ({ onToggleFavorite, currentUser }) => {
  
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [sortOption, setSortOption] = useState('created_at-desc');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [initialListings, setInitialListings] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

        // Load initial listings
  useEffect(() => {
    const loadInitialListings = async () => {
      try {
        setIsLoadingInitial(true);
        const listings = await fetchListings(currentUser?.id);
        setInitialListings(listings);
      } catch (error) {
        console.error('Error loading initial listings:', error);
        toast({ 
          title: "İlanlar Yüklenemedi", 
          description: "Ana sayfa ilanları yüklenirken bir sorun oluştu.", 
          variant: "destructive" 
        });
      } finally {
        setIsLoadingInitial(false);
      }
    };

    loadInitialListings();
  }, [currentUser?.id]);

      const {
        selectedCategories,
        filters,
        setFilters,
        displayedListings,
        isFiltering,
        hasMore,
        isLoadingMore,
        isAnyFilterActive,
        nativeAds,
        handleCategorySelect,
        handleLoadMore,
      } = useHomePageData({ initialListings, currentUser });

      const sortedListings = useMemo(() => {
        if (!Array.isArray(displayedListings)) return [];
        
        const [key, direction] = sortOption.split('-');
        return [...displayedListings].sort((a, b) => {
          let valA = a[key];
          let valB = b[key];

          if (key === 'created_at') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
          }

          if (direction === 'asc') {
            return valA > valB ? 1 : -1;
          } else {
            return valA < valB ? 1 : -1;
          }
        });
      }, [displayedListings, sortOption]);

      const listingsWithAds = useMemo(() => {
        if (nativeAds.length === 0) {
          return sortedListings.map(listing => ({ type: 'listing', data: listing }));
        }
        const combined = [];
        let adIndex = 0;
        for (let i = 0; i < sortedListings.length; i++) {
          combined.push({ type: 'listing', data: sortedListings[i] });
          if ((i + 1) % 8 === 0 && i < sortedListings.length - 1) {
            combined.push({ type: 'ad', data: nativeAds[adIndex % nativeAds.length] });
            adIndex++;
          }
        }
        return combined;
      }, [sortedListings, nativeAds]);

      const handleToggleFavoriteClick = (listingId, isFavorited) => {
        if (!currentUser) {
          toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
          navigate('/auth?action=login');
          return;
        }
        onToggleFavorite(listingId, isFavorited);
      };

      const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (localSearchQuery.trim()) {
          navigate(`/arama?q=${encodeURIComponent(localSearchQuery)}`);
        }
      };

      const clearFilters = () => {
        setFilters({
          priceRange: [0, 50000],
          location: '',
          urgency: '',
          keywords: ''
        });
        handleCategorySelect([]);
      };

      const selectedCategoryPath = useMemo(() => selectedCategories.map(c => c.name), [selectedCategories]);

      const handleCategoryClick = (category, level) => {
        const newPath = selectedCategories.slice(0, level);
        newPath.push(category);
        handleCategorySelect(newPath);
      };

      // Show loading state while initial listings are loading
      if (isLoadingInitial) {
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
        <>
          <SEOHead 
            title="BenAlsam - Alım İlanları Platformu | İhtiyacınız Olan Ürün ve Hizmetler"
            description="İhtiyacınız olan ürün ve hizmetler için alım ilanı verin, teklifler alın! Binlerce kullanıcı ile bağlantı kurun ve en iyi fiyatları bulun."
            keywords="alım ilanı, ihtiyaç ilanı, teklif alma, ürün alımı, hizmet alımı, satıcı bulma, tedarikçi bulma"
            image="/og-homepage.jpg"
            type="website"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto px-2 sm:px-4 lg:px-6 py-6"
          >
          <div className="flex flex-col lg:flex-row lg:gap-8">
            <aside className="hidden lg:block w-full lg:w-1/4 xl:w-1/5 mb-6 lg:mb-0 lg:sticky lg:top-24 self-start">
              <div className="p-4 rounded-lg bg-card border">
                <h3 className="font-bold text-lg mb-4">Kategoriler</h3>
                <div className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors text-sm",
                      "hover:bg-accent",
                      selectedCategoryPath.length === 0 && "bg-primary/10 text-primary font-semibold"
                    )}
                    onClick={() => handleCategorySelect([])}
                  >
                    Tüm Kategoriler
                  </div>
                  {categoriesConfig.map(cat => (
                    <CategoryItem key={cat.name} category={cat} onSelect={handleCategoryClick} selectedPath={selectedCategoryPath} />
                  ))}
                </div>
                <hr className="my-6" />
                <h3 className="font-bold text-lg mb-4">Filtreler</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fiyat Aralığı</label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                      max={50000}
                      min={0}
                      step={100}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>₺{filters.priceRange[0].toLocaleString()}</span>
                      <span>₺{filters.priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Konum</label>
                    <Input
                      placeholder="Şehir, ilçe..."
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  {isAnyFilterActive && (
                    <Button onClick={clearFilters} variant="ghost" className="w-full text-primary">
                      <X className="w-4 h-4 mr-2" />
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              </div>
            </aside>

            <main className="w-full lg:w-3/4 xl:w-4/5">
               <div className="lg:hidden">
                <MobileCategoryScroller
                  selectedCategories={selectedCategories}
                  onCategorySelect={handleCategorySelect}
                />
              </div>

              <div className="mb-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Input
                    placeholder="Aradığınız ürünü veya hizmeti yazın..."
                    className="w-full pl-4 pr-12 py-6 text-base"
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10">
                    <Search className="text-primary-foreground" />
                  </Button>
                </form>
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 p-3 bg-card rounded-lg border gap-4">
                <div>
                   <div className="hidden lg:flex text-sm text-muted-foreground items-center gap-1">
                    <span className="cursor-pointer hover:text-primary" onClick={() => handleCategorySelect([])}>Ana Sayfa</span>
                    {selectedCategoryPath.map((catName, index) => (
                      <React.Fragment key={catName}>
                        <ChevronRight className="w-4 h-4" />
                        <span
                          className="cursor-pointer hover:text-primary"
                          onClick={() => handleCategoryClick(selectedCategories[index], index)}
                        >
                          {catName}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold text-gradient">{selectedCategoryPath.length > 0 ? selectedCategoryPath[selectedCategoryPath.length - 1] : "Tüm İlanlar"}</h2>
                </div>
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[160px] xs:w-[180px]">
                      <SelectValue placeholder="Sırala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">En Yeni</SelectItem>
                      <SelectItem value="created_at-asc">En Eski</SelectItem>
                      <SelectItem value="budget-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                      <SelectItem value="budget-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                      <SelectItem value="views_count-desc">Popülerlik</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="w-5 h-5" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                    <List className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <AdBanner placement="in_feed" format="carousel" className="mb-6 h-32" />

              <div className="relative">
                {isFiltering && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg min-h-[300px]">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </div>
                )}
                <AnimatePresence>
                  <motion.div
                    key={viewMode}
                    className={cn(
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'flex flex-col gap-4'
                    )}
                  >
                    {listingsWithAds.map((item, index) => (
                      <motion.div
                        key={item.type === 'listing' ? item.data.id : `ad-${item.data.id}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                      >
                        {item.type === 'listing' ? (
                          <ListingCard
                            listing={item.data}
                            onToggleFavorite={handleToggleFavoriteClick}
                            currentUser={currentUser}
                            size={viewMode === 'grid' ? 'normal' : 'large'}
                            priority={index < 3} // Priority for first 3 images
                          />
                        ) : (
                          <AdCard ad={item.data} />
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {!isFiltering && listingsWithAds.length === 0 && (
                <div className="text-center py-16 bg-card rounded-lg border">
                  <h3 className="text-xl font-semibold">Sonuç Bulunamadı</h3>
                  <p className="text-muted-foreground mt-2 mb-4">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                  <Button onClick={clearFilters}>Filtreleri Temizle</Button>
                </div>
              )}

              {hasMore && !isFiltering && (
                <div className="text-center mt-8">
                  <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline" size="lg">
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      'Daha Fazla Göster'
                    )}
                  </Button>
                </div>
              )}
              
              {!isAnyFilterActive && (
                <div className="mt-16 space-y-8">
                  <StatsSection />
                  
                  {currentUser && (
                    <PersonalizedFeed 
                      currentUser={currentUser} 
                      onToggleFavorite={handleToggleFavoriteClick} 
                    />
                  )}

                  <FeaturedListings
                    title="Popüler İlanlar"
                    fetchFunction={() => fetchPopularListings(currentUser?.id)}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavoriteClick}
                  />
          
                  <AdBanner placement="homepage_featured" format="static" className="h-48" />

                  <FeaturedListings
                    title="En Çok Teklif Alanlar"
                    fetchFunction={() => fetchMostOfferedListings(currentUser?.id)}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavoriteClick}
                  />

                  <FeaturedListings
                    title="Günün Fırsatları"
                    fetchFunction={() => fetchTodaysDeals(currentUser?.id)}
                    currentUser={currentUser}
                    onToggleFavorite={handleToggleFavoriteClick}
                  />
                </div>
              )}
            </main>
          </div>
          </motion.div>
        </>
      );
    };

    export default memo(HomePage);
  