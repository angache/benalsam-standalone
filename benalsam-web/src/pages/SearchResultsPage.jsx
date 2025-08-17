
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFilteredListings } from '@/services/listingService/fetchers';
import { useAuthStore } from '@/stores';
import { toast } from '@/components/ui/use-toast';

import ListingCard from '@/components/ListingCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, page + half);

    if (page <= half) {
        end = Math.min(totalPages, maxPagesToShow);
    }
    if (page + half >= totalPages) {
        start = Math.max(1, totalPages - maxPagesToShow + 1);
    }
    
    if (start > 1) {
        items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
    }

    for (let i = start; i <= end; i++) {
        items.push(
            <PaginationItem key={i}>
                <PaginationLink href="#" isActive={i === page} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>
                    {i}
                </PaginationLink>
            </PaginationItem>
        );
    }

    if (end < totalPages) {
        items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }} disabled={page === 1} />
          </PaginationItem>
          {items}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }} disabled={page === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 lg:px-6 py-6"
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
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
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
          {renderPagination()}
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
