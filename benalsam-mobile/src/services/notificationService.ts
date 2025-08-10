import { supabase  } from '../services/supabaseClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  sound?: string;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

export interface SendNotificationRequest {
  userId?: string;
  token?: string;
  notification: NotificationPayload;
  type?: 'single' | 'user' | 'broadcast';
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  expoResult?: any;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Send notification to a specific token
  async sendToToken(token: string, notification: NotificationPayload): Promise<NotificationResponse> {
    try {
      console.log('🔔 Sending notification to token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          token,
          notification,
          type: 'single'
        } as SendNotificationRequest),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Notification sent successfully:', result.message);
        return result;
      } else {
        console.error('❌ Failed to send notification:', result.error);
        return { success: false, message: 'Failed to send notification', error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  }

  // Send notification to a specific user
  async sendToUser(userId: string, notification: NotificationPayload): Promise<NotificationResponse> {
    try {
      console.log('🔔 Sending notification to user:', userId);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          notification,
          type: 'user'
        } as SendNotificationRequest),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Notification sent successfully:', result.message);
        return result;
      } else {
        console.error('❌ Failed to send notification:', result.error);
        return { success: false, message: 'Failed to send notification', error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  }

  // Send broadcast notification to all users
  async sendBroadcast(notification: NotificationPayload): Promise<NotificationResponse> {
    try {
      console.log('🔔 Sending broadcast notification');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          notification,
          type: 'broadcast'
        } as SendNotificationRequest),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Broadcast notification sent successfully:', result.message);
        return result;
      } else {
        console.error('❌ Failed to send broadcast notification:', result.error);
        return { success: false, message: 'Failed to send broadcast notification', error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending broadcast notification:', error);
      return { success: false, message: 'Network error', error: 'Network error' };
    }
  }

  // Get notification logs for a user
  async getNotificationLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching notification logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getNotificationLogs:', error);
      return [];
    }
  }

  // Test notification templates
  getTestNotifications(): NotificationPayload[] {
    return [
      {
        title: 'Hoş Geldiniz! 👋',
        body: 'BenAlsam uygulamasına hoş geldiniz. İlk ilanınızı oluşturmaya başlayın!',
        data: { type: 'welcome', screen: 'home' },
        priority: 'high'
      },
      {
        title: 'Yeni Teklif! 💰',
        body: 'İlanınıza yeni bir teklif geldi. Hemen kontrol edin!',
        data: { type: 'new_offer', screen: 'offers' },
        priority: 'high',
        sound: 'default'
      },
      {
        title: 'Yeni Mesaj 📱',
        body: 'Birisi size mesaj gönderdi. Yanıtlamayı unutmayın!',
        data: { type: 'new_message', screen: 'conversations' },
        priority: 'normal'
      },
      {
        title: 'İlanınız Onaylandı ✅',
        body: 'İlanınız başarıyla yayınlandı. Artık görünür durumda!',
        data: { type: 'listing_approved', screen: 'my_listings' },
        priority: 'normal'
      },
      {
        title: 'Özel Fırsat! 🎉',
        body: 'Sadece bugün geçerli özel indirimlerden yararlanın!',
        data: { type: 'promotion', screen: 'home' },
        priority: 'default',
        image: 'https://example.com/promotion.jpg'
      }
    ];
  }
}

export const notificationService = NotificationService.getInstance(); 