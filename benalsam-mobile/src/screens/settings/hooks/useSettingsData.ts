// ===========================
// SETTINGS DATA HOOK
// ===========================

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '../../../services/supabaseService';
import { SettingsData, UserProfile } from '../types';
import { DEFAULT_NOTIFICATION_PREFERENCES, DEFAULT_CHAT_PREFERENCES, DEFAULT_PLATFORM_PREFERENCES } from '../utils/constants';

const useSettingsData = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setError(null);
      const profile = await getUserProfile();
      
      if (profile) {
        // Ensure all preferences have default values
        const profileWithDefaults: UserProfile = {
          ...profile,
          platform_preferences: {
            ...DEFAULT_PLATFORM_PREFERENCES,
            ...profile.platform_preferences
          },
          notification_preferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...profile.notification_preferences
          },
          chat_preferences: {
            ...DEFAULT_CHAT_PREFERENCES,
            ...profile.chat_preferences
          }
        };
        
        setUserProfile(profileWithDefaults);
      }
    } catch (err: any) {
      setError(err.message || 'Profil bilgileri yüklenirken hata oluştu');
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUserProfile();
    setIsRefreshing(false);
  }, [fetchUserProfile]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchUserProfile();
    setIsLoading(false);
  }, [fetchUserProfile]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const data: SettingsData = {
    userProfile,
    isLoading,
    isRefreshing,
    error
  };

  return {
    data,
    refreshData,
    loadData,
    setUserProfile
  };
};

export default useSettingsData;
