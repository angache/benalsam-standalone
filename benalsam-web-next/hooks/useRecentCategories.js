import { useState, useEffect, useCallback } from 'react';

export const useRecentCategories = () => {
  const [recentCategories, setRecentCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Local storage key
  const STORAGE_KEY = 'recent_categories_v1';
  const MAX_RECENT = 10; // Maximum number of recent categories to store

  // Load recent categories from localStorage
  const loadRecentCategories = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentCategories(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading recent categories:', error);
      setRecentCategories([]);
    }
  }, []);

  // Save recent categories to localStorage
  const saveRecentCategories = useCallback((categories) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving recent categories:', error);
    }
  }, []);

  // Add a category to recent list
  const addRecentCategory = useCallback((category) => {
    if (!category || !category.id) return;

    setRecentCategories(prev => {
      // Remove if already exists
      const filtered = prev.filter(cat => cat.id !== category.id);
      
      // Add to beginning
      const updated = [category, ...filtered];
      
      // Limit to MAX_RECENT
      const limited = updated.slice(0, MAX_RECENT);
      
      // Save to localStorage
      saveRecentCategories(limited);
      
      return limited;
    });
  }, [saveRecentCategories]);

  // Remove a category from recent list
  const removeRecentCategory = useCallback((categoryId) => {
    setRecentCategories(prev => {
      const updated = prev.filter(cat => cat.id !== categoryId);
      saveRecentCategories(updated);
      return updated;
    });
  }, [saveRecentCategories]);

  // Clear all recent categories
  const clearRecentCategories = useCallback(() => {
    setRecentCategories([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get recent categories with additional info
  const getRecentCategoriesWithInfo = useCallback(() => {
    return recentCategories.map(category => ({
      ...category,
      isRecent: true,
      lastViewed: new Date().toISOString()
    }));
  }, [recentCategories]);

  // Check if a category is in recent list
  const isRecentCategory = useCallback((categoryId) => {
    return recentCategories.some(cat => cat.id === categoryId);
  }, [recentCategories]);

  // Load on mount
  useEffect(() => {
    loadRecentCategories();
  }, [loadRecentCategories]);

  return {
    recentCategories,
    isLoading,
    addRecentCategory,
    removeRecentCategory,
    clearRecentCategories,
    getRecentCategoriesWithInfo,
    isRecentCategory,
    maxRecent: MAX_RECENT
  };
};

