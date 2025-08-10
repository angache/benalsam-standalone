import { getApps, initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase yapılandırması - DOĞRU DEĞERLER
const firebaseConfig = {
  apiKey: "AIzaSyD2-obevRKpiNuaatppYzGv34my14uHNOs",
  authDomain: "benalsam-2025.firebaseapp.com",
  databaseURL: "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "benalsam-2025",
  storageBucket: "benalsam-2025.firebasestorage.app",
  messagingSenderId: "714467547018",
  appId: "1:714467547018:web:e918ec6fc00e46105d5a73",
  measurementId: "G-RJ4F1RBS73"
};

// Firebase kurallarını test et
export const testFirebaseRules = async () => {
  try {
    console.log('🧪 Testing Firebase rules...');
    
    // Firebase app'i al veya başlat
    let app;
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
    
    const database = getDatabase(app);
    
    // Test 1: Root seviyesinde yazma (3 saniye timeout)
    console.log('📝 Testing root write...');
    const rootRef = ref(database, 'rules_test');
    
    const writePromise = set(rootRef, { test: 'root_write', timestamp: Date.now() });
    const writeTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout after 3 seconds')), 3000)
    );
    
    await Promise.race([writePromise, writeTimeout]);
    console.log('✅ Root write successful');
    
    // Test 2: Root seviyesinde okuma (3 saniye timeout)
    console.log('📖 Testing root read...');
    const readPromise = get(rootRef);
    const readTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Read timeout after 3 seconds')), 3000)
    );
    
    const rootSnapshot = await Promise.race([readPromise, readTimeout]) as any;
    const rootData = rootSnapshot.val();
    console.log('✅ Root read successful:', rootData);
    
    return {
      success: true,
      message: 'Firebase rules test completed successfully',
      data: {
        root: rootData
      }
    };
    
  } catch (error) {
    console.error('❌ Firebase rules test failed:', error);
    return {
      success: false,
      message: `Firebase rules test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error
    };
  }
}; 