import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../services/supabaseClient';

// Notification handler'ı ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used: string;
}

export class FCMTokenService {
  private static instance: FCMTokenService;
  private currentToken: string | null = null;

  static getInstance(): FCMTokenService {
    if (!FCMTokenService.instance) {
      FCMTokenService.instance = new FCMTokenService();
    }
    return FCMTokenService.instance;
  }

  // FCM token al
  async getFCMToken(): Promise<string | null> {
    try {
      console.log('🔔 Getting FCM token...');

      if (!Device.isDevice) {
        console.log('⚠️ FCM token not available on simulator');
        return null;
      }

      // Notification izinlerini kontrol et
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission not granted');
        return null;
      }

      // Expo push token al
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log('✅ FCM token obtained:', token.data);
      this.currentToken = token.data;
      return token.data;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  // Token'ı Supabase'e kaydet
  async saveTokenToSupabase(userId: string, token: string): Promise<boolean> {
    try {
      console.log('💾 Saving FCM token to Supabase...');

      const platform = Platform.OS as 'ios' | 'android' | 'web';
      const deviceId = Device.osInternalBuildId || Device.deviceName || 'unknown';

      // Önce mevcut token'ı kontrol et
      const { data: existingToken } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('token', token)
        .single();

      if (existingToken) {
        // Token zaten var, last_used güncelle
        const { error } = await supabase
          .from('fcm_tokens')
          .update({ 
            last_used: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingToken.id);

        if (error) {
          console.error('❌ Error updating existing token:', error);
          return false;
        }

        console.log('✅ Existing FCM token updated');
        return true;
      }

      // Yeni token ekle
      const { error } = await supabase
        .from('fcm_tokens')
        .insert({
          user_id: userId,
          token: token,
          platform: platform,
          device_id: deviceId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving FCM token:', error);
        return false;
      }

      console.log('✅ FCM token saved to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Error in saveTokenToSupabase:', error);
      return false;
    }
  }

  // Kullanıcının token'larını getir
  async getUserTokens(userId: string): Promise<FCMToken[]> {
    try {
      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error getting user tokens:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserTokens:', error);
      return [];
    }
  }

  // Token'ı sil (kullanıcı çıkış yaptığında)
  async deleteToken(userId: string, token?: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting FCM token...');

      let query = supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', userId);

      if (token) {
        query = query.eq('token', token);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Error deleting FCM token:', error);
        return false;
      }

      console.log('✅ FCM token deleted');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteToken:', error);
      return false;
    }
  }

  // Token'ı deaktif et
  async deactivateToken(userId: string, token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        console.error('❌ Error deactivating FCM token:', error);
        return false;
      }

      console.log('✅ FCM token deactivated');
      return true;
    } catch (error) {
      console.error('❌ Error in deactivateToken:', error);
      return false;
    }
  }

  // Kullanıcı giriş yaptığında çağrılacak
  async onUserLogin(userId: string): Promise<boolean> {
    try {
      console.log('🔔 Setting up FCM for user login...');
      
      const token = await this.getFCMToken();
      if (!token) {
        console.log('⚠️ No FCM token available');
        return false;
      }

      const saved = await this.saveTokenToSupabase(userId, token);
      return saved;
    } catch (error) {
      console.error('❌ Error in onUserLogin:', error);
      return false;
    }
  }

  // Kullanıcı çıkış yaptığında çağrılacak
  async onUserLogout(userId: string): Promise<boolean> {
    try {
      console.log('🔔 Cleaning up FCM for user logout...');
      
      if (this.currentToken) {
        await this.deactivateToken(userId, this.currentToken);
      }
      
      this.currentToken = null;
      return true;
    } catch (error) {
      console.error('❌ Error in onUserLogout:', error);
      return false;
    }
  }

  // Notification listener'ı ayarla
  setupNotificationListener() {
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      // Burada notification'a tıklandığında yapılacak işlemler
    });
  }
}

export const fcmTokenService = FCMTokenService.getInstance(); 