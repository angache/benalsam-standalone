'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const UserPreferencesContext = createContext();

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

export const UserPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    contentTypePreference: 'grid', // 'grid', 'list', 'compact'
    showCategoryBadges: false,
    showUrgencyBadges: false,
    showUserRatings: false,
    showDistance: false,
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    newOfferPush: true,
    newOfferEmail: true,
    newMessagePush: true,
    newMessageEmail: true,
    reviewPush: true,
    reviewEmail: true,
    summaryEmails: 'weekly', // 'daily', 'weekly', 'never'
  });

  const [platformPreferences, setPlatformPreferences] = useState({
    language: 'tr',
    currency: 'TRY',
    theme: 'light',
    defaultLocation: null,
    defaultCategory: null,
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      const savedNotifications = localStorage.getItem('notificationPreferences');
      const savedPlatform = localStorage.getItem('platformPreferences');

      if (savedPreferences) {
        setPreferences(prev => ({ ...prev, ...JSON.parse(savedPreferences) }));
      }
      if (savedNotifications) {
        setNotificationPreferences(prev => ({ ...prev, ...JSON.parse(savedNotifications) }));
      }
      if (savedPlatform) {
        setPlatformPreferences(prev => ({ ...prev, ...JSON.parse(savedPlatform) }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }, [notificationPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem('platformPreferences', JSON.stringify(platformPreferences));
    } catch (error) {
      console.error('Error saving platform preferences:', error);
    }
  }, [platformPreferences]);

  const updateContentTypePreference = (preference) => {
    setPreferences(prev => ({ ...prev, contentTypePreference: preference }));
    toast({
      title: "Tercih Güncellendi",
      description: `İçerik düzeni ${preference === 'grid' ? 'grid' : preference === 'list' ? 'liste' : 'kompakt'} olarak ayarlandı.`,
    });
  };

  const toggleCategoryBadges = () => {
    setPreferences(prev => ({ ...prev, showCategoryBadges: !prev.showCategoryBadges }));
    toast({
      title: "Kategori Rozetleri",
      description: `Kategori rozetleri ${!preferences.showCategoryBadges ? 'açıldı' : 'kapatıldı'}.`,
    });
  };

  const toggleUrgencyBadges = () => {
    setPreferences(prev => ({ ...prev, showUrgencyBadges: !prev.showUrgencyBadges }));
    toast({
      title: "Acil Rozetleri",
      description: `Acil rozetleri ${!preferences.showUrgencyBadges ? 'açıldı' : 'kapatıldı'}.`,
    });
  };

  const toggleUserRatings = () => {
    setPreferences(prev => ({ ...prev, showUserRatings: !prev.showUserRatings }));
    toast({
      title: "Kullanıcı Puanları",
      description: `Kullanıcı puanları ${!preferences.showUserRatings ? 'açıldı' : 'kapatıldı'}.`,
    });
  };

  const toggleDistance = () => {
    setPreferences(prev => ({ ...prev, showDistance: !prev.showDistance }));
    toast({
      title: "Mesafe Bilgisi",
      description: `Mesafe bilgisi ${!preferences.showDistance ? 'açıldı' : 'kapatıldı'}.`,
    });
  };

  const updateNotificationPreference = (key, value) => {
    setNotificationPreferences(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Bildirim Ayarı Güncellendi",
      description: "Bildirim tercihiniz kaydedildi.",
    });
  };

  const updatePlatformPreference = (key, value) => {
    setPlatformPreferences(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Platform Ayarı Güncellendi",
      description: "Platform tercihiniz kaydedildi.",
    });
  };

  const updatePreferences = (updates) => {
    setPreferences(prev => ({ ...prev, ...updates }));
    toast({
      title: "Tercih Güncellendi",
      description: "Tercihiniz kaydedildi.",
    });
  };

  const resetToDefaults = () => {
    setPreferences({
      contentTypePreference: 'grid',
      showCategoryBadges: false,
      showUrgencyBadges: false,
      showUserRatings: false,
      showDistance: false,
    });
    setNotificationPreferences({
      newOfferPush: true,
      newOfferEmail: true,
      newMessagePush: true,
      newMessageEmail: true,
      reviewPush: true,
      reviewEmail: true,
      summaryEmails: 'weekly',
    });
    setPlatformPreferences({
      language: 'tr',
      currency: 'TRY',
      theme: 'light',
      defaultLocation: null,
      defaultCategory: null,
    });
    toast({
      title: "Varsayılan Ayarlar",
      description: "Tüm tercihler varsayılan değerlere sıfırlandı.",
    });
  };

  const value = {
    preferences,
    notificationPreferences,
    platformPreferences,
    updateContentTypePreference,
    toggleCategoryBadges,
    toggleUrgencyBadges,
    toggleUserRatings,
    toggleDistance,
    updateNotificationPreference,
    updatePlatformPreference,
    updatePreferences,
    resetToDefaults,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}; 