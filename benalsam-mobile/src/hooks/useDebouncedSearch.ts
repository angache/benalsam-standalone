import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

interface UseDebouncedSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enablePerformanceMonitoring?: boolean;
  onSearchStart?: () => void;
  onSearchComplete?: (results: any[], duration: number) => void;
  onSearchError?: (error: Error) => void;
}

interface UseDebouncedSearchReturn {
  results: any[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCount: number;
  searchDuration: number;
  clearResults: () => void;
  refreshSearch: () => void;
}

const DEFAULT_OPTIONS: UseDebouncedSearchOptions = {
  debounceMs: 500,
  minQueryLength: 2,
  maxResults: 50,
  enablePerformanceMonitoring: true,
};

export const useDebouncedSearch = (
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [searchDuration, setSearchDuration] = useState(0);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchStartTimeRef = useRef<number>(0);

  // Performance monitoring
  const logPerformance = useCallback((duration: number, resultCount: number) => {
    if (config.enablePerformanceMonitoring) {
      console.log(`🔍 Search Performance: ${duration}ms for ${resultCount} results`);
      
      // Performance thresholds
      if (duration > 1000) {
        console.warn(`⚠️ Slow search detected: ${duration}ms`);
      }
      if (duration < 100) {
        console.log(`⚡ Fast search: ${duration}ms`);
      }
    }
  }, [config.enablePerformanceMonitoring]);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < config.minQueryLength!) {
      setResults([]);
      setTotalCount(0);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    searchStartTimeRef.current = Date.now();
    
    config.onSearchStart?.();

    try {
      const { data, error: supabaseError, count } = await supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(config.maxResults!)
        .abortSignal(abortControllerRef.current.signal);

      const duration = Date.now() - searchStartTimeRef.current;
      setSearchDuration(duration);

      if (supabaseError) {
        throw supabaseError;
      }

      const searchResults = data || [];
      setResults(searchResults);
      setTotalCount(count || 0);
      
      logPerformance(duration, searchResults.length);
      config.onSearchComplete?.(searchResults, duration);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      const duration = Date.now() - searchStartTimeRef.current;
      setSearchDuration(duration);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResults([]);
      setTotalCount(0);
      
      config.onSearchError?.(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [config, logPerformance]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, config.debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch, config.debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setError(null);
    setSearchDuration(0);
  }, []);

  // Refresh search
  const refreshSearch = useCallback(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  return {
    results,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    totalCount,
    searchDuration,
    clearResults,
    refreshSearch,
  };
}; 