
    import React, { useState, useMemo, useEffect, memo, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHomePageData } from '@/hooks/useHomePageData';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';
import { usePagination } from '@/hooks/usePagination';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import ListingCard from '@/components/ListingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutGrid, List, ChevronRight, Search, X, Shield, Zap, Star, Plus, Heart, MessageCircle, Package, Filter, Settings } from 'lucide-react';
import { categoriesConfig } from '@/config/categories';
import { cn } from '@/lib/utils';
import SEOHead from '@/components/SEOHead';
import StructuredData from '@/components/StructuredData';
import { fetchListings } from '@/services/listingService';
import SkeletonHomePage from '@/components/SkeletonLoading';

// Lazy load non-critical components for better LCP
const AdCard = lazy(() => import('@/components/AdCard'));
import { Slider } from '@/components/ui/slider';
// Select components need to be imported normally for proper destructuring
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const AdBanner = lazy(() => import('@/components/AdBanner'));
const MobileCategoryScroller = lazy(() => import('@/components/HomePage/MobileCategoryScroller'));
const CategoryItem = lazy(() => import('@/components/HomePage/CategoryItem'));
const CategorySearch = lazy(() => import('@/components/HomePage/CategorySearch'));
const TabletSidebar = lazy(() => import('@/components/HomePage/TabletSidebar'));
const SidebarContent = lazy(() => import('@/components/HomePage/SidebarContent'));
const Pagination = lazy(() => import('@/components/ui/Pagination'));
const FeaturedListings = lazy(() => import('@/components/FeaturedListings'));
const StatsSection = lazy(() => import('@/components/StatsSection'));
const PersonalizedFeed = lazy(() => import('@/components/PersonalizedFeed'));

// Lazy load analytics hook
const useGoogleAnalytics = lazy(() => import('@/hooks/useGoogleAnalytics'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

    const HomePage = ({ onToggleFavorite, currentUser }) => {
  
  const navigate = useNavigate();
  // Conditional analytics loading for better performance
  const analytics = useMemo(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      return {
        trackSearch: (query, count) => {
          window.gtag('event', 'search', {
            search_term: query,
            results_count: count
          });
        },
        trackUserInteraction: (action, details) => {
          window.gtag('event', 'user_interaction', {
            action,
            ...details
          });
        }
      };
    }
    return { trackSearch: () => {}, trackUserInteraction: () => {} };
  }, []);
  
  const { trackSearch, trackUserInteraction } = analytics;
  const [viewMode, setViewMode] = useState('grid');
  const [sortOption, setSortOption] = useState('created_at-desc');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [initialListings, setInitialListings] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isTabletSidebarOpen, setIsTabletSidebarOpen] = useState(false);

        // Load initial listings with limit for faster loading
  useEffect(() => {
    const loadInitialListings = async () => {
      try {
        setIsLoadingInitial(true);
        // Load only first 8 listings for faster initial render
        const listings = await fetchListings(currentUser?.id, { limit: 8 });
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

      // Kategori sayılarını hesapla
      const { getCategoryCount, isLoading: isLoadingCounts } = useCategoryCounts(displayedListings);
      
      // Pagination hook'u
      const {
        currentPage,
        totalPages,
        currentItems: paginatedListings,
        goToPage,
        hasNextPage,
        hasPrevPage,
        totalItems,
        startIndex,
        endIndex,
        getPageNumbers
      } = usePagination(displayedListings, 12); // Sayfa başına 12 ilan

      const sortedListings = useMemo(() => {
        if (!Array.isArray(paginatedListings)) return [];
        
        const [key, direction] = sortOption.split('-');
        return [...paginatedListings].sort((a, b) => {
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
      }, [paginatedListings, sortOption]);

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

      const handleToggleFavoriteClick = useCallback((listingId, isFavorited) => {
        if (!currentUser) {
          toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
          navigate('/auth?action=login');
          return;
        }
        onToggleFavorite(listingId, isFavorited);
      }, [currentUser, navigate, onToggleFavorite]);

      const handleSearchSubmit = useCallback((e) => {
        e.preventDefault();
        if (localSearchQuery.trim()) {
          // Track search event
          trackSearch(localSearchQuery, displayedListings.length);
          trackUserInteraction('search_submit', { query: localSearchQuery });
          
          navigate(`/arama?q=${encodeURIComponent(localSearchQuery)}`);
        }
      }, [localSearchQuery, displayedListings.length, trackSearch, trackUserInteraction, navigate]);

      const clearFilters = useCallback(() => {
        setFilters({
          priceRange: [0, 50000],
          location: '',
          urgency: '',
          keywords: ''
        });
        handleCategorySelect([]);
      }, [setFilters, handleCategorySelect]);

      const selectedCategoryPath = useMemo(() => selectedCategories.map(c => c.name), [selectedCategories]);

      const handleCategoryClick = useCallback((category, level) => {
        const newPath = selectedCategories.slice(0, level);
        newPath.push(category);
        handleCategorySelect(newPath);
      }, [selectedCategories, handleCategorySelect]);

      // Show skeleton loading for better UX
      if (isLoadingInitial) {
        return <SkeletonHomePage />;
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
          <StructuredData type="website" />
          
          {/* Tablet Sidebar */}
          <Suspense fallback={<LoadingFallback />}>
            <TabletSidebar
              isOpen={isTabletSidebarOpen}
              onClose={() => setIsTabletSidebarOpen(false)}
              selectedCategories={selectedCategories}
              onCategorySelect={handleCategorySelect}
            >
              <SidebarContent
                selectedCategories={selectedCategories}
                selectedCategoryPath={selectedCategoryPath}
                filters={filters}
                setFilters={setFilters}
                handleCategoryClick={handleCategoryClick}
                handleCategorySelect={handleCategorySelect}
                clearFilters={clearFilters}
                isAnyFilterActive={isAnyFilterActive}
                getCategoryCount={getCategoryCount}
                isLoadingCounts={isLoadingCounts}
              />
            </TabletSidebar>
          </Suspense>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-6"
          >
          <div className="flex flex-col lg:flex-row lg:gap-8">
            <aside className="hidden lg:block w-full lg:w-1/4 xl:w-1/5 2xl:w-1/6 mb-6 lg:mb-0 lg:sticky lg:top-20 self-start">
              <Suspense fallback={<LoadingFallback />}>
                <SidebarContent
                  selectedCategories={selectedCategories}
                  selectedCategoryPath={selectedCategoryPath}
                  filters={filters}
                  setFilters={setFilters}
                  handleCategoryClick={handleCategoryClick}
                  handleCategorySelect={handleCategorySelect}
                  clearFilters={clearFilters}
                  isAnyFilterActive={isAnyFilterActive}
                  getCategoryCount={getCategoryCount}
                  isLoadingCounts={isLoadingCounts}
                />
              </Suspense>
            </aside>

            <main className="w-full lg:w-3/4 xl:w-4/5 2xl:w-5/6">
               <div className="lg:hidden">
                <Suspense fallback={<LoadingFallback />}>
                  <MobileCategoryScroller
                    selectedCategories={selectedCategories}
                    onCategorySelect={handleCategorySelect}
                  />
                </Suspense>
              </div>
              
              {/* Tablet Sidebar Toggle Button */}
              <div className="hidden md:block lg:hidden mb-4">
                <Button
                  onClick={() => setIsTabletSidebarOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtreler
                </Button>
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

              {/* Hero Section - Modern E-ticaret Tarzı */}
              {!isAnyFilterActive && (
                <div className="mb-8">
                  {/* Hero Banner */}
                  <div className="relative bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 rounded-2xl p-8 mb-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
                    <div className="relative z-10">
                      <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        İhtiyacınız Olan Her Şey Burada
                      </h1>
                      <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                        Binlerce kullanıcı ile bağlantı kurun, en iyi fiyatları bulun ve güvenle alışveriş yapın.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Güvenli Ödeme</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Hızlı Teslimat</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>7/24 Destek</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Bar - Modern E-ticaret Tarzı */}
                  <div className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        onClick={() => navigate('/ilan-ver')}
                        className="h-16 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        İlan Ver
                      </Button>
                      <Button 
                        onClick={() => navigate('/favorilerim')}
                        variant="outline"
                        className="h-16 border-2 hover:border-primary hover:bg-primary/5"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        Favorilerim
                      </Button>
                      <Button 
                        onClick={() => navigate('/mesajlarim')}
                        variant="outline"
                        className="h-16 border-2 hover:border-primary hover:bg-primary/5"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Mesajlarım
                      </Button>
                      <Button 
                        onClick={() => navigate('/ilanlarim')}
                        variant="outline"
                        className="h-16 border-2 hover:border-primary hover:bg-primary/5"
                      >
                        <Package className="w-5 h-5 mr-2" />
                        İlanlarım
                      </Button>
                    </div>
                  </div>

                  {/* Kategori Kartları - Amazon Tarzı */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Popüler Kategoriler</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {categoriesConfig.slice(0, 6).map((category) => (
                        <div
                          key={category.name}
                          onClick={() => handleCategoryClick(category, 0)}
                          className="group cursor-pointer bg-card border rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-md transition-all duration-200"
                        >
                          <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            {category.icon && <category.icon className="w-6 h-6 text-primary" />}
                          </div>
                          <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Öne Çıkan Özellikler - eBay Tarzı */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border rounded-lg p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Güvenli Alışveriş</h3>
                      <p className="text-sm text-muted-foreground">Doğrulanmış satıcılar ve güvenli ödeme sistemi</p>
                    </div>
                    <div className="bg-card border rounded-lg p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Hızlı İletişim</h3>
                      <p className="text-sm text-muted-foreground">Anında mesajlaşma ile hızlı anlaşma</p>
                    </div>
                    <div className="bg-card border rounded-lg p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Kalite Garantisi</h3>
                      <p className="text-sm text-muted-foreground">Detaylı ürün açıklamaları ve fotoğraflar</p>
                    </div>
                  </div>
                </div>
              )}

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

              <Suspense fallback={<LoadingFallback />}>
                <AdBanner placement="in_feed" format="carousel" className="mb-6 h-40" />
              </Suspense>

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
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 xl:gap-5 2xl:gap-4'
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
                          <Suspense fallback={<LoadingFallback />}>
                            <AdCard ad={item.data} />
                          </Suspense>
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

              {/* Pagination */}
              {!isFiltering && totalPages > 1 && (
                <div className="mt-8">
                  <Suspense fallback={<LoadingFallback />}>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      getPageNumbers={getPageNumbers}
                      hasNextPage={hasNextPage}
                      hasPrevPage={hasPrevPage}
                      totalItems={totalItems}
                      startIndex={startIndex}
                      endIndex={endIndex}
                    />
                  </Suspense>
                </div>
              )}
              
              {!isAnyFilterActive && (
                <div className="mt-16 space-y-8">
                  <Suspense fallback={<LoadingFallback />}>
                    <StatsSection />
                  </Suspense>
                  
                  {currentUser && (
                    <Suspense fallback={<LoadingFallback />}>
                      <PersonalizedFeed 
                        currentUser={currentUser} 
                        onToggleFavorite={handleToggleFavoriteClick} 
                      />
                    </Suspense>
                  )}

                  <Suspense fallback={<LoadingFallback />}>
                    <FeaturedListings
                      title="Popüler İlanlar"
                      fetchFunction={() => fetchListings(currentUser?.id)} // Changed to fetchListings
                      currentUser={currentUser}
                      onToggleFavorite={handleToggleFavoriteClick}
                    />
                  </Suspense>
          
                  <Suspense fallback={<LoadingFallback />}>
                    <AdBanner placement="homepage_featured" format="static" className="h-48" />
                  </Suspense>

                  <Suspense fallback={<LoadingFallback />}>
                    <FeaturedListings
                      title="En Çok Teklif Alanlar"
                      fetchFunction={() => fetchListings(currentUser?.id)} // Changed to fetchListings
                      currentUser={currentUser}
                      onToggleFavorite={handleToggleFavoriteClick}
                    />
                  </Suspense>

                  <Suspense fallback={<LoadingFallback />}>
                    <FeaturedListings
                      title="Günün Fırsatları"
                      fetchFunction={() => fetchListings(currentUser?.id)} // Changed to fetchListings
                      currentUser={currentUser}
                      onToggleFavorite={handleToggleFavoriteClick}
                    />
                  </Suspense>
                </div>
              )}
            </main>
          </div>
          </motion.div>
        </>
      );
    };

    export default memo(HomePage);
  