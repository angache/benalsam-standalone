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

export const testFirebaseSimple = async () => {
  try {
    console.log('🧪 Testing Firebase simple connection...');
    
    // Firebase app'i al veya başlat
    let app;
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
      console.log('✅ Using existing Firebase app');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    }
    
    const database = getDatabase(app);
    console.log('✅ Firebase database is ready');
    
    // Basit test verisi
    const testData = {
      message: 'Simple test successful!',
      timestamp: Date.now(),
      test: true
    };
    
    console.log('📝 Writing test data...');
    const testRef = ref(database, 'test/simple');
    
    // 3 saniye timeout ile yazma
    const writePromise = set(testRef, testData);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout after 3 seconds')), 3000)
    );
    
    await Promise.race([writePromise, timeoutPromise]);
    console.log('✅ Data written successfully');
    
    // 3 saniye timeout ile okuma
    console.log('📖 Reading test data...');
    const readPromise = get(testRef);
    const readTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Read timeout after 3 seconds')), 3000)
    );
    
    const snapshot = await Promise.race([readPromise, readTimeoutPromise]) as any;
    const readData = snapshot.val();
    console.log('✅ Data read successfully:', readData);
    
    return {
      success: true,
      message: 'Firebase simple test completed successfully',
      data: readData
    };
    
  } catch (error) {
    console.error('❌ Firebase simple test failed:', error);
    return {
      success: false,
      message: `Firebase simple test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error
    };
  }
}; 