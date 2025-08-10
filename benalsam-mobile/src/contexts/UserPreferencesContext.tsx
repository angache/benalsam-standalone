import React, { createContext, useContext, ReactNode } from 'react';
import { useUserPreferences, UserPreferences } from '../hooks/useUserPreferences';

// Context Type
interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  
  // Category Management
  addFavoriteCategory: (categoryName: string) => Promise<void>;
  removeFavoriteCategory: (categoryName: string) => Promise<void>;
  hideCategory: (categoryName: string) => Promise<void>;
  showCategory: (categoryName: string) => Promise<void>;
  
  // Content Preferences
  updateContentTypePreference: (preference: 'grid' | 'list' | 'compact') => Promise<void>;
  toggleCategoryBadges: () => Promise<void>;
  toggleUrgencyBadges: () => Promise<void>;
  toggleUserRatings: () => Promise<void>;
  toggleDistance: () => Promise<void>;
  
  // Theme Preferences
  setTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  setFontSize: (fontSize: 'small' | 'medium' | 'large') => Promise<void>;
  
  // Search Preferences
  addRecentSearch: (searchTerm: string) => Promise<void>;
  addSearchHistory: (searchTerm: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  
  // Notification Preferences
  togglePushNotifications: () => Promise<void>;
  toggleEmailNotifications: () => Promise<void>;
  toggleNewOfferNotifications: () => Promise<void>;
  toggleNewMessageNotifications: () => Promise<void>;
  
  // Performance Preferences
  setImageQuality: (quality: 'low' | 'medium' | 'high') => Promise<void>;
  togglePreloadImages: () => Promise<void>;
  toggleCache: () => Promise<void>;
  
  // UI Preferences
  toggleAutoRefresh: () => Promise<void>;
  setRefreshInterval: (interval: number) => Promise<void>;
  hideWelcomeMessage: () => Promise<void>;
  
  // Utility
  resetToDefaults: () => Promise<void>;
  loadPreferences: () => Promise<void>;
}

// Create Context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider Props
interface UserPreferencesProviderProps {
  children: ReactNode;
}

// Provider Component
export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const userPreferences = useUserPreferences();

  return (
    <UserPreferencesContext.Provider value={userPreferences}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom Hook
export const useUserPreferencesContext = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  
  if (context === undefined) {
    throw new Error('useUserPreferencesContext must be used within a UserPreferencesProvider');
  }
  
  return context;
};

// Export the hook for backward compatibility
export { useUserPreferences } from '../hooks/useUserPreferences'; 