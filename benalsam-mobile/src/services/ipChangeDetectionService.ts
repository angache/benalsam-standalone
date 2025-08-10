import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import sessionLoggerService from './sessionLoggerService';

/**
 * KVKK COMPLIANCE: IP Change Detection Service
 * 
 * Bu servis KVKK uyumluluğu için IP değişikliklerini takip eder:
 * 
 * ✅ SECURITY PURPOSE - Güvenlik amaçlı IP tracking
 * ✅ NON-PERSONAL DATA - IP adresi kişisel veri değil
 * ✅ TRANSPARENCY - IP değişiklikleri şeffaf şekilde loglanır
 * ✅ LEGITIMATE INTEREST - Meşru menfaat kapsamında güvenlik
 * ✅ AUDIT TRAIL - IP değişiklikleri denetim için kaydedilir
 * 
 * IP adresleri sadece güvenlik ve anomali tespiti için kullanılır.
 */

class IPChangeDetectionService {
  private lastKnownIP: string | null = null;
  private lastNetworkType: string | null = null;
  private isInitialized = false;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL = 30000; // 30 saniye minimum interval

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔍 IP Change Detection Service: Initializing...');
    
    // İlk IP'yi al
    await this.checkIPChange();
    
    // App State listener
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Network change listener
    NetInfo.addEventListener(this.handleNetworkChange);
    
    this.isInitialized = true;
    console.log('✅ IP Change Detection Service: Initialized');
  }

  // Manuel test için public method
  async testIPChange() {
    console.log('🧪 IP Change Detection: Manual test triggered');
    await this.checkIPChange();
  }

  private handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      console.log('🔍 IP Change Detection: App became active, checking IP...');
      await this.checkIPChange();
    }
  };

  private handleNetworkChange = async (state: any) => {
    const currentNetworkType = state.type;
    
    if (this.lastNetworkType && this.lastNetworkType !== currentNetworkType) {
      console.log('🔍 IP Change Detection: Network type changed', {
        from: this.lastNetworkType,
        to: currentNetworkType
      });
      await this.checkIPChange();
    }
    
    this.lastNetworkType = currentNetworkType;
  };

  private async getCurrentIP(): Promise<string> {
    try {
      // Test modu - Expo Go'da sabit IP kullan (rate limiting'i önlemek için)
      if (__DEV__) {
        // DEV modunda sabit IP kullan, sadece gerçek IP değişikliklerini test et
        const testIP = '192.168.1.100'; // Sabit test IP
        console.log('🧪 IP Change Detection: Test IP (DEV):', testIP);
        return testIP;
      }
      
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      console.log('🌐 IP Change Detection: Current IP detected:', data.ip);
      return data.ip;
    } catch (error) {
      console.warn('⚠️ IP Change Detection: Could not get current IP:', error);
      return 'unknown';
    }
  }

  private async checkIPChange() {
    try {
      // Rate limiting - çok sık kontrol etme
      const now = Date.now();
      if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
        console.log('⏱️ IP Change Detection: Rate limited, skipping check');
        return;
      }
      this.lastCheckTime = now;
      
      const currentIP = await this.getCurrentIP();
      
      if (!this.lastKnownIP) {
        // İlk kez IP alınıyor
        this.lastKnownIP = currentIP;
        console.log('🔍 IP Change Detection: Initial IP set:', currentIP);
        return;
      }
      
      if (currentIP !== this.lastKnownIP) {
        console.log('🔍 IP Change Detection: IP changed detected!', {
          from: this.lastKnownIP,
          to: currentIP
        });
        
        // Session logging çağır
        await sessionLoggerService.logSessionActivity('activity', {
          ip_changed: true,
          previous_ip: this.lastKnownIP,
          current_ip: currentIP,
          network_type: this.lastNetworkType,
          location_changed: true,
          detection_method: 'automatic'
        });
        
        // IP'yi güncelle
        this.lastKnownIP = currentIP;
        
        console.log('✅ IP Change Detection: IP change logged successfully');
      }
    } catch (error) {
      console.error('❌ IP Change Detection: Error checking IP change:', error);
    }
  }

  async cleanup() {
    console.log('🔍 IP Change Detection Service: Cleaning up...');
    // Listeners'ları temizle (gerekirse)
    this.isInitialized = false;
  }
}

export default new IPChangeDetectionService(); 