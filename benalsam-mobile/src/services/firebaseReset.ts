import { initializeApp, getApps, deleteApp } from 'firebase/app';
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

// Firebase'i tamamen sıfırla ve yeniden başlat
export const resetAndInitializeFirebase = async () => {
  try {
    console.log('🔄 Resetting Firebase...');
    
    // Tüm mevcut app'leri sil
    const apps = getApps();
    for (const app of apps) {
      try {
        await deleteApp(app);
        console.log(`🗑️ Deleted app: ${app.name}`);
      } catch (error) {
        console.log(`⚠️ Could not delete app ${app.name}:`, error);
      }
    }
    
    console.log('✅ All Firebase apps deleted');
    
    // Yeni app başlat
    const newApp = initializeApp(firebaseConfig);
    const database = getDatabase(newApp);
    
    console.log('✅ New Firebase app initialized');
    console.log('🔧 Config used:', firebaseConfig);
    
    return { app: newApp, database };
  } catch (error) {
    console.error('❌ Firebase reset failed:', error);
    throw error;
  }
};

// Basit test fonksiyonu
export const testFirebaseWithReset = async () => {
  try {
    console.log('🧪 Testing Firebase with reset...');
    
    // Firebase'i sıfırla ve yeniden başlat
    const { database } = await resetAndInitializeFirebase();
    
    // Test verisi
    const testData = {
      message: 'Firebase reset test successful!',
      timestamp: Date.now(),
      test: true
    };
    
    console.log('📝 Writing test data...');
    const testRef = ref(database, 'test/reset');
    
    // 3 saniye timeout ile yazma
    const writePromise = set(testRef, testData);
    const writeTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout after 3 seconds')), 3000)
    );
    
    await Promise.race([writePromise, writeTimeout]);
    console.log('✅ Data written successfully');
    
    // 3 saniye timeout ile okuma
    console.log('📖 Reading test data...');
    const readPromise = get(testRef);
    const readTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Read timeout after 3 seconds')), 3000)
    );
    
    const snapshot = await Promise.race([readPromise, readTimeout]) as any;
    const readData = snapshot.val();
    console.log('✅ Data read successfully:', readData);
    
    return {
      success: true,
      message: 'Firebase reset test completed successfully',
      data: readData
    };
    
  } catch (error) {
    console.error('❌ Firebase reset test failed:', error);
    return {
      success: false,
      message: `Firebase reset test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error
    };
  }
}; 