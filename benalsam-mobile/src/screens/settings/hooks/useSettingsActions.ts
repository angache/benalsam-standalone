// ===========================
// SETTINGS ACTIONS HOOK
// ===========================

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabaseService';
import { updateUserProfile } from '../../../services/supabaseService';
import { SettingsActions, NotificationPreferences, ChatPreferences, PlatformPreferences, RootStackParamList } from '../types';

const useSettingsActions = (
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void,
  onRefresh: () => void
): SettingsActions => {
  
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              onNavigate('Login');
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          }
        }
      ]
    );
  }, [onNavigate]);

  const handleUpdateNotificationPreferences = useCallback(async (preferences: NotificationPreferences) => {
    try {
      await updateUserProfile({
        notification_preferences: preferences
      });
      onRefresh();
    } catch (error) {
      Alert.alert('Hata', 'Bildirim tercihleri güncellenirken hata oluştu');
    }
  }, [onRefresh]);

  const handleUpdateChatPreferences = useCallback(async (preferences: ChatPreferences) => {
    try {
      await updateUserProfile({
        chat_preferences: preferences
      });
      onRefresh();
    } catch (error) {
      Alert.alert('Hata', 'Sohbet tercihleri güncellenirken hata oluştu');
    }
  }, [onRefresh]);

  const handleUpdatePlatformPreferences = useCallback(async (preferences: PlatformPreferences) => {
    try {
      await updateUserProfile({
        platform_preferences: preferences
      });
      onRefresh();
    } catch (error) {
      Alert.alert('Hata', 'Platform tercihleri güncellenirken hata oluştu');
    }
  }, [onRefresh]);

  const handleNavigate = useCallback((screen: keyof RootStackParamList, params?: any) => {
    onNavigate(screen, params);
  }, [onNavigate]);

  return {
    onRefresh,
    onLogout: handleLogout,
    onUpdateNotificationPreferences: handleUpdateNotificationPreferences,
    onUpdateChatPreferences: handleUpdateChatPreferences,
    onUpdatePlatformPreferences: handleUpdatePlatformPreferences,
    onNavigate: handleNavigate
  };
};

export default useSettingsActions;
