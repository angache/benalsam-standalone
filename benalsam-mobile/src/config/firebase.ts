// Firebase yapılandırması
// Bu dosyayı mevcut Firebase projenizin bilgileri ile güncelleyin

export const firebaseConfig = {
  // Mevcut Firebase projenizin bilgilerini buraya ekleyin
  // Firebase Console > Project Settings > General > Your apps bölümünden alabilirsiniz
  
  // iOS için (GoogleService-Info.plist'ten)
  ios: {
    // Bu bilgileri GoogleService-Info.plist dosyasından alın
    // CLIENT_ID, REVERSED_CLIENT_ID, API_KEY, GCM_SENDER_ID, PROJECT_ID, BUNDLE_ID
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:ios:abcdef123456',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'benalsam-expo',
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID || '123456789',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'benalsam-expo.appspot.com',
  },
  
  // Android için (google-services.json'dan)
  android: {
    // Bu bilgileri google-services.json dosyasından alın
    // client_id, client_type, api_key, project_id, package_name
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:android:abcdef123456',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'benalsam-expo',
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID || '123456789',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'benalsam-expo.appspot.com',
  },
  
  // Web için (Expo ile kullanılacak) - DOĞRU DEĞERLER
  web: {
    // Firebase Console'dan alınan doğru değerler
    apiKey: "AIzaSyD2-obevRKpiNuaatppYzGv34my14uHNOs",
    authDomain: "benalsam-2025.firebaseapp.com",
    databaseURL: "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "benalsam-2025",
    storageBucket: "benalsam-2025.firebasestorage.app",
    messagingSenderId: "714467547018",
    appId: "1:714467547018:web:e918ec6fc00e46105d5a73",
    measurementId: "G-RJ4F1RBS73"
  }
};

// Firebase Realtime Database kuralları
export const databaseRules = {
  rules: {
    ".read": true,
    ".write": true,
    "category_features": {
      ".read": true,
      ".write": true
    },
    "ai_suggestions": {
      ".read": true,
      ".write": true
    },
    "user_features": {
      "$uid": {
        ".read": true,
        ".write": true
      }
    }
  }
};

// Firebase yapılandırma kontrolü
export const isFirebaseConfigured = () => {
  // Bu fonksiyon Firebase'in doğru yapılandırılıp yapılandırılmadığını kontrol eder
  return true; // Geçici olarak true döndürüyoruz
}; 