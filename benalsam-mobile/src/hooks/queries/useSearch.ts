import { useState, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

export const useSearchActions = () => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCategory: '',
    sortBy: 'created_at-desc',
    priceRange: null as [number, number] | null,
    location: '',
    urgency: '',
    attributes: {} as Record<string, string[]>,
  });
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const updateFilter = useCallback((key: string, value: any) => {
    console.log('🔍 updateFilter called:', { key, value });
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('🔍 updateFilter - new filters:', newFilters);
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedCategory: '',
      sortBy: 'created_at-desc',
      priceRange: null,
      location: '',
      urgency: '',
      attributes: {},
    });
    setResults([]);
    setTotalCount(0);
  }, []);

  const hasActiveFilters = 
    filters.searchQuery.trim() !== '' ||
    filters.selectedCategory !== '' ||
    filters.priceRange !== null ||
    filters.location !== '' ||
    filters.urgency !== '' ||
    Object.keys(filters.attributes).some(key => filters.attributes[key]?.length > 0);

  // Manuel arama fonksiyonu
  const performSearch = useCallback(async (query?: string, currentFilters?: any) => {
    console.log('🔍 performSearch - ENTRY POINT');
    console.log('🔍 performSearch - query:', query);
    console.log('🔍 performSearch - currentFilters:', currentFilters);
    
    const searchText = query || (currentFilters || filters).searchQuery;
    const activeFilters = currentFilters || filters;
    
    console.log('🔍 performSearch - searchText:', searchText);
    console.log('🔍 performSearch - activeFilters:', activeFilters);
    
    if (!searchText.trim()) {
      console.log('🔍 performSearch - Empty search, clearing results');
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Basit arama yap
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .ilike('title', `%${searchText}%`)
        .limit(20);
      
      if (error) {
        console.error('🔍 performSearch - Error:', error);
        setResults([]);
        setTotalCount(0);
      } else {
        console.log('🔍 performSearch - Results:', data?.length || 0);
        setResults(data || []);
        setTotalCount(data?.length || 0);
      }
    } catch (error) {
      console.error('🔍 performSearch - Exception:', error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
    
    console.log('🔍 performSearch - EXIT POINT');
  }, [filters]);

  const performCategorySearch = useCallback(async (category: string) => {
    console.log('🔍 performCategorySearch - category:', category);
    updateFilter('selectedCategory', category);
    updateFilter('searchQuery', '');
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('category', category)
        .limit(20);
      
      if (error) {
        console.error('🔍 performCategorySearch - Error:', error);
        setResults([]);
        setTotalCount(0);
      } else {
        console.log('🔍 performCategorySearch - Results:', data?.length || 0);
        setResults(data || []);
        setTotalCount(data?.length || 0);
      }
    } catch (error) {
      console.error('🔍 performCategorySearch - Exception:', error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [updateFilter]);

  console.log('🔍 useSearchActions - RENDER COUNT:', Date.now());

  return {
    // Search results
    results,
    isLoading,
    totalCount,
    
    // Search actions
    performSearch,
    performCategorySearch,
    
    // Filter management
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    
    // Placeholder values for compatibility
    recentSearches: [],
  };
}; 