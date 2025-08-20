
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFilteredListings } from '@/services/listingService/fetchers';
import { useAuthStore } from '@/stores';
import { toast } from '@/components/ui/use-toast';

import ListingCard from '@/components/ListingCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Pagination from '@/components/ui/Pagination';
import { Loader2, LayoutGrid, List, Search, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdBanner from '@/components/AdBanner';

const PAGE_SIZE = 16;

const SearchResultsPage = ({ onToggleFavorite }) => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const query = useMemo(() => searchParams.get('q') || '', [searchParams]);
  const page = useMemo(() => parseInt(searchParams.get('page') || '1', 10), [searchParams]);
  const sortOption = useMemo(() => searchParams.get('sort') || 'created_at-desc', [searchParams]);

  const handleToggleFavoriteClick = (listingId, isFavorited) => {
    if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
      navigate('/auth?action=login');
      return;
    }
    onToggleFavorite(listingId, isFavorited);
  };
  
  const updateURL = useCallback((newPage, newSortOption) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage);
    params.set('sort', newSortOption);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location, navigate]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const filterParams = { 
        searchQuery: query, 
        sortOption: sortOption,
      };
      
      const { listings, totalCount: count } = await fetchFilteredListings(filterParams, currentUser?.id, page, PAGE_SIZE);
      
      setResults(listings);
      setTotalCount(count);
      setIsLoading(false);
    };

    performSearch();
  }, [query, page, sortOption, currentUser?.id]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateURL(newPage, sortOption);
    }
  };

  const handleSortChange = (newSort) => {
    updateURL(1, newSort);
  };

  const getPageNumbers = useCallback(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); 
         i <= Math.min(totalPages - 1, page + delta); 
         i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [page, totalPages]);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-6"
    >
      <div className="mb-6 bg-card border rounded-lg p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">Arama Sonuçları</h1>
        <p className="text-muted-foreground mt-1">
          "<span className="font-semibold text-primary">{query}</span>" için {totalCount} sonuç bulundu.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
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
      
      <AdBanner placement="in_feed" format="horizontal" className="mb-6 h-24" />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <>
          <AnimatePresence>
            <motion.div
              key={viewMode}
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4'
                  : 'flex flex-col gap-4'
              )}
            >
              {results.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <ListingCard
                    listing={listing}
                    onToggleFavorite={handleToggleFavoriteClick}
                    currentUser={currentUser}
                    size={viewMode === 'grid' ? 'normal' : 'large'}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                getPageNumbers={getPageNumbers}
                hasNextPage={page < totalPages}
                hasPrevPage={page > 1}
                totalItems={totalCount}
                startIndex={(page - 1) * PAGE_SIZE + 1}
                endIndex={Math.min(page * PAGE_SIZE, totalCount)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border">
          <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">Sonuç Bulunamadı</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            "<span className="font-semibold text-primary">{query}</span>" için sonuç bulunamadı. Lütfen farklı bir arama yapın.
          </p>
          <Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(SearchResultsPage);
