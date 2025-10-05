
import { useState, useEffect, useRef } from 'react';
import { fetchFilteredListings } from '@/services/listingService/fetchers';
import { searchListingsWithElasticsearch } from '@/services/elasticsearchService';
import { saveLastSearch } from '@/services/userActivityService';
import { supabase } from '@/lib/supabaseClient';
const PAGE_SIZE = 24;

export const useHomePageData = ({ initialListings, currentUser }) => {
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    location: '',
    urgency: '',
    keywords: '',
  });

  const [displayedListings, setDisplayedListings] = useState([]);
  const [totalListings, setTotalListings] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAnyFilterActive, setIsAnyFilterActive] = useState(false);
  const debounceTimeoutRef = useRef(null);
  
  // initialListings'i sadece ilk yüklemede kullan
  useEffect(() => {
    if (initialListings && initialListings.length > 0) {
      setDisplayedListings(initialListings);
    }
  }, [initialListings]);
  
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

  // Listen for total listings count from main page
  useEffect(() => {
    const handleSetTotalListings = (event) => {
      setTotalListings(event.detail);
    };

    window.addEventListener('setTotalListings', handleSetTotalListings);
    return () => {
      window.removeEventListener('setTotalListings', handleSetTotalListings);
    };
  }, []);

  useEffect(() => {
    const active =
      (selectedCategories && selectedCategories.length > 0) ||
      (filters.location && filters.location.trim() !== '') ||
      (filters.urgency && filters.urgency !== '') ||
      (filters.keywords && filters.keywords.trim() !== '') ||
      (filters.priceRange && (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 50000));
    setIsAnyFilterActive(active);
  }, [selectedCategories.length, filters.location, filters.urgency, filters.keywords, filters.priceRange[0], filters.priceRange[1]]);

  useEffect(() => {
    if (!currentUser || !isAnyFilterActive) return;

    const searchCriteria = {
      query: '',
      categories: selectedCategories.map(c => c.name),
      filters,
    };
    saveLastSearch(searchCriteria);
  }, [selectedCategories.length, filters.location, filters.urgency, filters.keywords, filters.priceRange[0], filters.priceRange[1], currentUser?.id, isAnyFilterActive]);
  
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (isAnyFilterActive) {
      setIsFiltering(true);
      setCurrentPage(1);
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          // Elasticsearch ile arama yap
          const searchParams = {
            query: '',
            categories: selectedCategories.length > 0 ? selectedCategories.map(cat => cat.name) : undefined,
            categoryIds: selectedCategories.length > 0 ? selectedCategories.map(cat => cat.id).filter(id => id !== null) : undefined,
            location: filters.location,
            minPrice: filters.priceRange[0],
            maxPrice: filters.priceRange[1],
            urgency: filters.urgency,
            sortBy: 'created_at',
            sortOrder: 'desc',
            page: 1,
            pageSize: PAGE_SIZE
          };

          console.log('🔍 HomePage filtering - Elasticsearch params:', searchParams);
          console.log('🔍 HomePage filtering - Selected categories:', {
            selectedCategories,
            categoryNames: selectedCategories.map(cat => cat.name),
            categoryIds: selectedCategories.map(cat => cat.id)
          });

          const result = await searchListingsWithElasticsearch(searchParams, currentUser?.id);
          
          // Basit çözüm: Sadece Elasticsearch sonuçları
          setDisplayedListings(result.data || []);
          setTotalListings(result.total || 0);
          setHasMore((result.data || []).length === PAGE_SIZE);
        } catch (error) {
          console.error('Error in search:', error);
          setDisplayedListings([]);
          setTotalListings(0);
          setHasMore(false);
        }
        setIsFiltering(false);
      }, 500);
    } else {
      // No filters active → show initial listings
      setIsFiltering(false);
      const base = initialListings || [];
      setDisplayedListings(base);
      setTotalListings(base.length || 0);
      setHasMore(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isAnyFilterActive, selectedCategories.length, filters.location, filters.urgency, filters.keywords, filters.priceRange[0], filters.priceRange[1], initialListings?.length, currentUser?.id]);
  
  const handleCategorySelect = (categoriesPathArray) => { 
    setSelectedCategories(categoriesPathArray);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      // Elasticsearch ile arama yap
      const searchParams = {
        query: '',
        filters: {
          category_id: selectedCategories.length > 0 ? selectedCategories[selectedCategories.length - 1].id : undefined,
          location: filters.location,
          minBudget: filters.priceRange[0],
          maxBudget: filters.priceRange[1],
          urgency: filters.urgency
        },
        sort: {
          field: 'created_at',
          order: 'desc'
        },
        page: nextPage,
        limit: PAGE_SIZE
      };

      const result = await searchListingsWithElasticsearch(searchParams, currentUser?.id);
      
      if (result.data && result.data.length > 0) {
        setDisplayedListings(prev => [...prev, ...result.data]);
        setCurrentPage(nextPage);
        setHasMore(result.data.length === PAGE_SIZE);
      } else {
        // Fallback to Supabase
        const allFilters = {
            search: '',
            selectedCategories: selectedCategories,
            location: filters.location,
            minBudget: filters.priceRange[0],
            maxBudget: filters.priceRange[1],
            urgency: filters.urgency,
            sortBy: 'created_at',
            sortOrder: 'desc'
        };

        const { listings: newResults, totalCount } = await fetchFilteredListings(allFilters, currentUser?.id, nextPage, PAGE_SIZE);

        if (newResults.length > 0) {
            setDisplayedListings(prev => [...prev, ...newResults]);
            setCurrentPage(nextPage);
        }
        
        setHasMore((nextPage * PAGE_SIZE) < totalCount);
      }
    } catch (error) {
      console.error('Error in load more:', error);
      // Fallback to Supabase
      const allFilters = {
          search: '',
          selectedCategories: selectedCategories,
          location: filters.location,
          minBudget: filters.priceRange[0],
          maxBudget: filters.priceRange[1],
          urgency: filters.urgency,
          sortBy: 'created_at',
          sortOrder: 'desc'
      };

      const { listings: newResults, totalCount } = await fetchFilteredListings(allFilters, currentUser?.id, nextPage, PAGE_SIZE);

      if (newResults.length > 0) {
          setDisplayedListings(prev => [...prev, ...newResults]);
          setCurrentPage(nextPage);
      }
      
      setHasMore((nextPage * PAGE_SIZE) < totalCount);
    }

    setIsLoadingMore(false);
  };
  
  return {
    selectedCategories,
    filters,
    setFilters,
    displayedListings,
    totalListings,
    isFiltering,
    hasMore,
    isLoadingMore,
    isAnyFilterActive,
    nativeAds,
    handleCategorySelect,
    handleLoadMore
  };
};
