
import { useState, useEffect, useRef } from 'react';
import { fetchFilteredListings } from '@/services/listingService/fetchers';
import { saveLastSearch } from '@/services/userActivityService';
import { supabase } from '@/lib/supabaseClient';
const PAGE_SIZE = 16;

export const useHomePageData = ({ initialListings, currentUser }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    location: '',
    urgency: '',
    keywords: '',
  });

  const [displayedListings, setDisplayedListings] = useState(initialListings || []);
  const [isFiltering, setIsFiltering] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAnyFilterActive, setIsAnyFilterActive] = useState(false);
  
  const [nativeAds, setNativeAds] = useState([]);

  useEffect(() => {
    const fetchNativeAds = async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('placement', 'native_card')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);
      
      if (error) {
        console.error('Error fetching native ads:', error);
      } else {
        setNativeAds(data);
      }
    };
    fetchNativeAds();
  }, []);

  useEffect(() => {
    const active =
      (selectedCategories && selectedCategories.length > 0) ||
      (filters.location && filters.location.trim() !== '') ||
      (filters.urgency && filters.urgency !== '') ||
      (filters.keywords && filters.keywords.trim() !== '') ||
      (filters.priceRange && (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 50000));
    setIsAnyFilterActive(active);
  }, [selectedCategories, filters]);

  useEffect(() => {
    if (!currentUser || !isAnyFilterActive) return;

    const searchCriteria = {
      query: '',
      categories: selectedCategories.map(c => c.name),
      filters,
    };
    saveLastSearch(searchCriteria);
  }, [selectedCategories, filters, currentUser, isAnyFilterActive]);
  
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (isAnyFilterActive) {
      setIsFiltering(true);
      setCurrentPage(1);
      debounceTimeoutRef.current = setTimeout(async () => {
        const allFilters = {
          searchQuery: '',
          selectedCategories,
          ...filters
        };
        const { listings, totalCount } = await fetchFilteredListings(allFilters, currentUser?.id, 1, PAGE_SIZE);
        setDisplayedListings(listings);
        setHasMore((1 * PAGE_SIZE) < totalCount);
        setIsFiltering(false);
      }, 500);
    } else {
      setIsFiltering(false);
      setDisplayedListings(initialListings || []);
      setHasMore(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isAnyFilterActive, selectedCategories, filters, initialListings, currentUser?.id]);
  
  const handleCategorySelect = (categoriesPathArray) => { 
    setSelectedCategories(categoriesPathArray);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    const allFilters = {
        searchQuery: '',
        selectedCategories,
        ...filters
    };

    const { listings: newResults, totalCount } = await fetchFilteredListings(allFilters, currentUser?.id, nextPage, PAGE_SIZE);

    if (newResults.length > 0) {
        setDisplayedListings(prev => [...prev, ...newResults]);
        setCurrentPage(nextPage);
    }
    
    setHasMore((nextPage * PAGE_SIZE) < totalCount);

    setIsLoadingMore(false);
  };
  
  return {
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
    handleLoadMore
  };
};
