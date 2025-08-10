import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'suggestion' | 'category';
  category?: string;
  count?: number;
  timestamp?: number;
}

interface UseSearchSuggestionsOptions {
  maxHistoryItems?: number;
  maxSuggestions?: number;
  debounceMs?: number;
  enableCaching?: boolean;
}

interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  addToHistory: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
  refreshSuggestions: () => Promise<void>;
}

const DEFAULT_OPTIONS: UseSearchSuggestionsOptions = {
  maxHistoryItems: 20,
  maxSuggestions: 10,
  debounceMs: 300,
  enableCaching: true,
};

export const useSearchSuggestions = (
  query: string,
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());

  // Fetch suggestions from database
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    // Check cache first
    if (config.enableCaching && cacheRef.current.has(searchQuery)) {
      setSuggestions(cacheRef.current.get(searchQuery) || []);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('title, category')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(config.maxSuggestions || 10);

      if (error) {
        throw error;
      }

      const dbSuggestions: SearchSuggestion[] = (data || [])
        .map((item, index) => ({
          id: `suggestion-${index}`,
          text: item.title,
          type: 'suggestion' as const,
          category: item.category,
        }))
        .filter((item, index, array) => 
          array.findIndex(s => s.text === item.text) === index
        )
        .slice(0, config.maxSuggestions || 10);

      // Cache the results
      if (config.enableCaching) {
        cacheRef.current.set(searchQuery, dbSuggestions);
      }

      setSuggestions(dbSuggestions);
    } catch (err) {
      console.error('Search suggestions error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [config.maxSuggestions, config.enableCaching]);

  // Load search history
  const loadHistory = useCallback(async (): Promise<SearchSuggestion[]> => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        return parsedHistory
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, config.maxHistoryItems || 20)
          .map((item: any) => ({
            id: item.id,
            text: item.text,
            type: 'history' as const,
            timestamp: item.timestamp,
          }));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
    return [];
  }, [config.maxHistoryItems]);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, config.debounceMs || 300);
  }, [config.debounceMs, fetchSuggestions]);

  // Add to search history
  const addToHistory = useCallback(async (text: string) => {
    try {
      const newItem = {
        id: `history-${Date.now()}`,
        text: text.trim(),
        timestamp: Date.now(),
      };

      const existingHistory = await AsyncStorage.getItem('searchHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Remove duplicate
      const filteredHistory = history.filter((item: any) => item.text !== text);
      
      // Add to beginning
      const updatedHistory = [newItem, ...filteredHistory].slice(0, config.maxHistoryItems || 20);
      
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to add to search history:', error);
    }
  }, [config.maxHistoryItems]);

  // Remove from history
  const removeFromHistory = useCallback(async (id: string) => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        const updatedHistory = parsedHistory.filter((item: any) => item.id !== id);
        await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Failed to remove from history:', error);
    }
  }, []);

  // Clear all history
  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, []);

  // Refresh suggestions
  const refreshSuggestions = useCallback(async () => {
    if (query.trim()) {
      await fetchSuggestions(query);
    }
  }, [query, fetchSuggestions]);

  // Main effect to handle query changes
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      // If no query, show history
      loadHistory().then(history => {
        setSuggestions(history);
      });
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, debouncedSearch, loadHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    addToHistory,
    clearHistory,
    removeFromHistory,
    refreshSuggestions,
  };
}; 