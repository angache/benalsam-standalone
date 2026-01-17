import { useState, useEffect, useCallback, useMemo } from 'react';
import aiSuggestionsService, { AISuggestion } from '../services/aiSuggestionsService';
import { logger } from '@/utils/production-logger';

export const useAISuggestions = (query = '', categoryId = null) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  // Debounced query
  const debouncedQuery = useMemo(() => {
    if (!query || query.length < 2) return '';
    return query;
  }, [query]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!debouncedQuery && !categoryId) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug('[useAISuggestions] Fetching AI suggestions', { query: debouncedQuery, categoryId });
      
      let results: AISuggestion[] = [];
      
      if (categoryId) {
        // Kategori bazlı öneriler
        results = await aiSuggestionsService.getCategorySuggestions(categoryId);
      } else if (debouncedQuery) {
        // Arama bazlı öneriler
        results = await aiSuggestionsService.getSuggestions(debouncedQuery);
      } else {
        // Genel öneriler
        results = await aiSuggestionsService.getSuggestions();
      }
      
      setSuggestions(results);
      setLastQuery(debouncedQuery);
      
      logger.debug('[useAISuggestions] AI suggestions fetched', { count: results.length });
    } catch (err) {
      logger.error('[useAISuggestions] Error fetching AI suggestions', { error: err });
      setError(err.message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, categoryId]);

  // Fetch trending suggestions
  const fetchTrendingSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await aiSuggestionsService.getTrendingSuggestions();
      setSuggestions(results);
    } catch (err) {
      logger.error('[useAISuggestions] Error fetching trending suggestions', { error: err });
      setError(err.message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch popular suggestions
  const fetchPopularSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await aiSuggestionsService.getPopularSuggestions();
      setSuggestions(results);
    } catch (err) {
      logger.error('[useAISuggestions] Error fetching popular suggestions', { error: err });
      setError(err.message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch category suggestions
  const fetchCategorySuggestions = useCallback(async (catId) => {
    if (!catId) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await aiSuggestionsService.getCategorySuggestions(catId);
      setSuggestions(results);
    } catch (err) {
      logger.error('[useAISuggestions] Error fetching category suggestions', { error: err });
      setError(err.message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  // Refresh suggestions
  const refreshSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await aiSuggestionsService.refresh();
      await fetchSuggestions();
    } catch (err) {
      logger.error('[useAISuggestions] Error refreshing suggestions', { error: err });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSuggestions]);

  // Group suggestions by type
  const groupedSuggestions = useMemo(() => {
    const grouped = {
      trending: [],
      popular: [],
      category: [],
      search: [],
      ai: []
    };

    suggestions.forEach(suggestion => {
      if (grouped[suggestion.type]) {
        grouped[suggestion.type].push(suggestion);
      }
    });

    return grouped;
  }, [suggestions]);

  // Filtered suggestions based on query
  const filteredSuggestions = useMemo(() => {
    if (!debouncedQuery) return suggestions;

    return suggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [suggestions, debouncedQuery]);

  // Auto-fetch when query or categoryId changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (debouncedQuery !== lastQuery || categoryId) {
        fetchSuggestions();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [debouncedQuery, categoryId, fetchSuggestions, lastQuery]);

  // Load trending suggestions on mount if no query
  useEffect(() => {
    if (!debouncedQuery && !categoryId && suggestions.length === 0) {
      fetchTrendingSuggestions();
    }
  }, [debouncedQuery, categoryId, suggestions.length, fetchTrendingSuggestions]);

  return {
    suggestions: filteredSuggestions,
    groupedSuggestions,
    isLoading,
    error,
    clearSuggestions,
    refreshSuggestions,
    fetchTrendingSuggestions,
    fetchPopularSuggestions,
    fetchCategorySuggestions,
    hasSuggestions: filteredSuggestions.length > 0
  };
};

export default useAISuggestions;
