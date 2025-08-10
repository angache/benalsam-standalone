import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores';

// User Preferences Types
export interface UserPreferences {
  // Category Preferences
  favoriteCategories: string[];
  hiddenCategories: string[];
  
  // Content Preferences
  contentTypePreference: 'grid' | 'list' | 'compact';
  showCategoryBadges: boolean;
  showUrgencyBadges: boolean;
  showUserRatings: boolean;
  showDistance: boolean;
  
  // Visual Preferences
  imageQuality: 'low' | 'medium' | 'high';
  showAnimations: boolean;
  reduceMotion: boolean;
  autoPlayVideos: boolean;
  
  // Filter Preferences
  defaultPriceRange: { min: number; max: number };
  defaultCategories: string[];
  hideExpiredListings: boolean;
  showOnlyVerifiedUsers: boolean;
  
  // Notification Preferences
  pushNotifications: boolean;
  emailNotifications: boolean;
  newOfferNotifications: boolean;
  newMessageNotifications: boolean;
  newListingsInCategory: boolean;
  priceDrops: boolean;
  similarListings: boolean;
  marketUpdates: boolean;
  
  // Theme Preferences
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  
  // Search Preferences
  recentSearches: string[];
  searchHistory: string[];
  
  // UI Preferences
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  showWelcomeMessage: boolean;
  
  // Performance Preferences
  preloadImages: boolean;
  cacheEnabled: boolean;
}

// Default Preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteCategories: [],
  hiddenCategories: [],
  contentTypePreference: 'grid',
  showCategoryBadges: true,
  showUrgencyBadges: true,
  showUserRatings: true,
  showDistance: true,
  imageQuality: 'medium',
  showAnimations: true,
  reduceMotion: false,
  autoPlayVideos: false,
  defaultPriceRange: { min: 0, max: 10000 },
  defaultCategories: [],
  hideExpiredListings: true,
  showOnlyVerifiedUsers: false,
  pushNotifications: true,
  emailNotifications: true,
  newOfferNotifications: true,
  newMessageNotifications: true,
  newListingsInCategory: true,
  priceDrops: true,
  similarListings: false,
  marketUpdates: false,
  theme: 'auto',
  fontSize: 'medium',
  recentSearches: [],
  searchHistory: [],
  autoRefresh: true,
  refreshInterval: 5,
  showWelcomeMessage: true,
  preloadImages: true,
  cacheEnabled: true,
};

// Storage Keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  USER_PREFERENCES_PREFIX: 'user_preferences_',
};

export const useUserPreferences = () => {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get storage key for current user
  const getStorageKey = useCallback(() => {
    if (!user?.id) return STORAGE_KEYS.USER_PREFERENCES;
    return `${STORAGE_KEYS.USER_PREFERENCES_PREFIX}${user.id}`;
  }, [user?.id]);

  // Load preferences from storage
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storageKey = getStorageKey();
      const storedPreferences = await AsyncStorage.getItem(storageKey);
      
      if (storedPreferences) {
        const parsedPreferences = JSON.parse(storedPreferences);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (err) {
      console.error('Error loading user preferences:', err);
      setError('Tercihler yüklenirken hata oluştu');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey]);

  // Save preferences to storage
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    try {
      setError(null);
      
      const updatedPreferences = { ...preferences, ...newPreferences };
      const storageKey = getStorageKey();
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
      setPreferences(updatedPreferences);
      
      return true;
    } catch (err) {
      console.error('Error saving user preferences:', err);
      setError('Tercihler kaydedilirken hata oluştu');
      return false;
    }
  }, [preferences, getStorageKey]);

  // Category Management
  const addFavoriteCategory = useCallback(async (categoryName: string) => {
    if (!preferences.favoriteCategories.includes(categoryName)) {
      const updatedFavorites = [...preferences.favoriteCategories, categoryName];
      await savePreferences({ favoriteCategories: updatedFavorites });
    }
  }, [preferences.favoriteCategories, savePreferences]);

  const removeFavoriteCategory = useCallback(async (categoryName: string) => {
    const updatedFavorites = preferences.favoriteCategories.filter(
      cat => cat !== categoryName
    );
    await savePreferences({ favoriteCategories: updatedFavorites });
  }, [preferences.favoriteCategories, savePreferences]);

  const hideCategory = useCallback(async (categoryName: string) => {
    if (!preferences.hiddenCategories.includes(categoryName)) {
      const updatedHidden = [...preferences.hiddenCategories, categoryName];
      await savePreferences({ hiddenCategories: updatedHidden });
    }
  }, [preferences.hiddenCategories, savePreferences]);

  const showCategory = useCallback(async (categoryName: string) => {
    const updatedHidden = preferences.hiddenCategories.filter(
      cat => cat !== categoryName
    );
    await savePreferences({ hiddenCategories: updatedHidden });
  }, [preferences.hiddenCategories, savePreferences]);

  // Content Preferences
  const updateContentTypePreference = useCallback(async (preference: 'grid' | 'list' | 'compact') => {
    await savePreferences({ contentTypePreference: preference });
  }, [savePreferences]);

  const toggleCategoryBadges = useCallback(async () => {
    await savePreferences({ showCategoryBadges: !preferences.showCategoryBadges });
  }, [preferences.showCategoryBadges, savePreferences]);

  const toggleUrgencyBadges = useCallback(async () => {
    await savePreferences({ showUrgencyBadges: !preferences.showUrgencyBadges });
  }, [preferences.showUrgencyBadges, savePreferences]);

  const toggleUserRatings = useCallback(async () => {
    await savePreferences({ showUserRatings: !preferences.showUserRatings });
  }, [preferences.showUserRatings, savePreferences]);

  const toggleDistance = useCallback(async () => {
    await savePreferences({ showDistance: !preferences.showDistance });
  }, [preferences.showDistance, savePreferences]);

  // Theme Preferences
  const setTheme = useCallback(async (theme: 'light' | 'dark' | 'auto') => {
    await savePreferences({ theme });
  }, [savePreferences]);

  const setFontSize = useCallback(async (fontSize: 'small' | 'medium' | 'large') => {
    await savePreferences({ fontSize });
  }, [savePreferences]);

  // Search Preferences
  const addRecentSearch = useCallback(async (searchTerm: string) => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return;

    const updatedSearches = [
      trimmedTerm,
      ...preferences.recentSearches.filter(term => term !== trimmedTerm)
    ].slice(0, 10); // Keep only last 10 searches

    await savePreferences({ recentSearches: updatedSearches });
  }, [preferences.recentSearches, savePreferences]);

  const addSearchHistory = useCallback(async (searchTerm: string) => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return;

    const updatedHistory = [
      trimmedTerm,
      ...preferences.searchHistory.filter(term => term !== trimmedTerm)
    ].slice(0, 50); // Keep only last 50 searches

    await savePreferences({ searchHistory: updatedHistory });
  }, [preferences.searchHistory, savePreferences]);

  const clearSearchHistory = useCallback(async () => {
    await savePreferences({ searchHistory: [] });
  }, [savePreferences]);

  // Notification Preferences
  const togglePushNotifications = useCallback(async () => {
    await savePreferences({ pushNotifications: !preferences.pushNotifications });
  }, [preferences.pushNotifications, savePreferences]);

  const toggleEmailNotifications = useCallback(async () => {
    await savePreferences({ emailNotifications: !preferences.emailNotifications });
  }, [preferences.emailNotifications, savePreferences]);

  const toggleNewOfferNotifications = useCallback(async () => {
    await savePreferences({ newOfferNotifications: !preferences.newOfferNotifications });
  }, [preferences.newOfferNotifications, savePreferences]);

  const toggleNewMessageNotifications = useCallback(async () => {
    await savePreferences({ newMessageNotifications: !preferences.newMessageNotifications });
  }, [preferences.newMessageNotifications, savePreferences]);

  // Performance Preferences
  const setImageQuality = useCallback(async (quality: 'low' | 'medium' | 'high') => {
    await savePreferences({ imageQuality: quality });
  }, [savePreferences]);

  const togglePreloadImages = useCallback(async () => {
    await savePreferences({ preloadImages: !preferences.preloadImages });
  }, [preferences.preloadImages, savePreferences]);

  const toggleCache = useCallback(async () => {
    await savePreferences({ cacheEnabled: !preferences.cacheEnabled });
  }, [preferences.cacheEnabled, savePreferences]);

  // UI Preferences
  const toggleAutoRefresh = useCallback(async () => {
    await savePreferences({ autoRefresh: !preferences.autoRefresh });
  }, [preferences.autoRefresh, savePreferences]);

  const setRefreshInterval = useCallback(async (interval: number) => {
    await savePreferences({ refreshInterval: interval });
  }, [savePreferences]);

  const hideWelcomeMessage = useCallback(async () => {
    await savePreferences({ showWelcomeMessage: false });
  }, [savePreferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    await savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Load preferences when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    // State
    preferences,
    isLoading,
    error,
    
    // Category Management
    addFavoriteCategory,
    removeFavoriteCategory,
    hideCategory,
    showCategory,
    
    // Content Preferences
    updateContentTypePreference,
    toggleCategoryBadges,
    toggleUrgencyBadges,
    toggleUserRatings,
    toggleDistance,
    
    // Theme Preferences
    setTheme,
    setFontSize,
    
    // Search Preferences
    addRecentSearch,
    addSearchHistory,
    clearSearchHistory,
    
    // Notification Preferences
    togglePushNotifications,
    toggleEmailNotifications,
    toggleNewOfferNotifications,
    toggleNewMessageNotifications,
    
    // Performance Preferences
    setImageQuality,
    togglePreloadImages,
    toggleCache,
    
    // UI Preferences
    toggleAutoRefresh,
    setRefreshInterval,
    hideWelcomeMessage,
    
    // Utility
    resetToDefaults,
    loadPreferences,
  };
}; 