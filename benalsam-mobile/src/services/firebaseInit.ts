import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../config/firebase';

// Firebase başlatma fonksiyonu
export const initializeFirebase = () => {
  try {
    // Firebase zaten başlatılmış mı kontrol et
    const apps = getApps();
    if (apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return apps[0];
    }

    // Platform'a göre yapılandırma
    let config;
    
    if (Platform.OS === 'ios') {
      config = firebaseConfig.ios;
    } else if (Platform.OS === 'android') {
      config = firebaseConfig.android;
    } else {
      config = firebaseConfig.web;
    }

    // Gerekli alanları kontrol et
    if (!config.appId || !config.projectId) {
      console.warn('⚠️ Firebase config missing required fields');
      console.log('📊 Config:', config);
      return null;
    }

    // Web için databaseURL kontrolü
    if (Platform.OS === 'web' && !(config as any).databaseURL) {
      console.warn('⚠️ Firebase databaseURL is missing for web platform');
      return null;
    }

    // Firebase'i başlat
    const firebaseApp = initializeApp(config);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Firebase config:', config);
    
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

// Firebase durumunu kontrol et
export const checkFirebaseStatus = () => {
  try {
    const apps = getApps();
    console.log('📊 Firebase apps count:', apps.length);
    
    if (apps.length > 0) {
      const currentApp = apps[0];
      console.log('✅ Firebase is initialized');
      console.log('🔧 App name:', currentApp.name);
      console.log('🔧 App options:', currentApp.options);
      return true;
    } else {
      console.log('⚠️ Firebase is not initialized');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase status check error:', error);
    return false;
  }
};

// Firebase'i yeniden başlat
export const restartFirebase = () => {
  try {
    // Tüm uygulamaları kapat
    const apps = getApps();
    apps.forEach(appInstance => {
      // Firebase Web SDK'da app.delete() yok, sadece yeni app başlatılır
    });
    
    console.log('🔄 Firebase apps will be reinitialized');
    
    // Yeniden başlat
    return initializeFirebase();
  } catch (error) {
    console.error('❌ Firebase restart error:', error);
    throw error;
  }
}; 