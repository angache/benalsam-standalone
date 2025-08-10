import { firebaseService } from './firebaseService';
import { ref, set, get, remove } from 'firebase/database';

// Firebase bağlantısını test et
export const testFirebaseConnection = async () => {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Firebase servisinin hazır olduğunu kontrol et
    if (!firebaseService.db) {
      throw new Error('Firebase database not initialized');
    }
    
    console.log('✅ Firebase database is ready');
    
    // Test verisi yaz
    const testData = {
      test: true,
      timestamp: Date.now(),
      message: 'Firebase connection test'
    };
    
    console.log('📝 Writing test data...');
    const testRef = ref(firebaseService.db, 'test_connection');
    await set(testRef, testData);
    console.log('✅ Write test successful');
    
    // Test verisini oku
    console.log('📖 Reading test data...');
    const snapshot = await get(testRef);
    const readData = snapshot.val();
    console.log('✅ Read test successful:', readData);
    
    // Test verisini sil
    console.log('🗑️ Deleting test data...');
    await remove(testRef);
    console.log('✅ Delete test successful');
    
    return {
      success: true,
      message: 'Firebase connection test completed successfully',
      data: readData
    };
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return {
      success: false,
      message: `Firebase connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error
    };
  }
};

// Kategori özelliklerini test et
export const testCategoryFeatures = async () => {
  try {
    console.log('🧪 Testing category features...');
    
    const testCategory = 'Elektronik > Telefon';
    const testFeatures = {
      features: {
        'brand': {
          name: 'Marka',
          usage_count: 1,
          ai_suggested: true,
          user_created: false,
          created_at: Date.now(),
          last_used: Date.now()
        },
        'model': {
          name: 'Model',
          usage_count: 1,
          ai_suggested: true,
          user_created: false,
          created_at: Date.now(),
          last_used: Date.now()
        }
      },
      tags: {
        'smartphone': {
          name: 'Akıllı Telefon',
          usage_count: 1,
          ai_suggested: true,
          user_created: false,
          created_at: Date.now(),
          last_used: Date.now()
        }
      }
    };
    
    // Test verisini yaz
    const writeResult = await firebaseService.updateCategoryFeatures(testCategory, testFeatures);
    console.log('✅ Category features write test successful');
    
    // Test verisini oku
    const readData = await firebaseService.getCategoryFeatures(testCategory);
    console.log('✅ Category features read test successful:', readData);
    
    return {
      success: true,
      message: 'Category features test completed successfully',
      data: readData
    };
  } catch (error) {
    console.error('❌ Category features test failed:', error);
    return {
      success: false,
      message: 'Category features test failed',
      error: error
    };
  }
};

// AI önerilerini test et
export const testAISuggestions = async () => {
  try {
    console.log('🧪 Testing AI suggestions...');
    
    const testInput = 'iPhone 13 Pro Max arıyorum';
    const testSuggestions = {
      title: 'iPhone 13 Pro Max Arıyorum',
      description: 'iPhone 13 Pro Max almak istiyorum',
      category: 'Elektronik > Telefon',
      suggestedPrice: 25000,
      condition: ['İkinci El'],
      features: ['Marka', 'Model', 'Renk'],
      tags: ['iPhone', 'Apple', 'Akıllı Telefon'],
      serviceUsed: 'OpenAI',
      timestamp: Date.now()
    };
    
    // Test verisini yaz
    const writeResult = await firebaseService.saveAISuggestion(testInput, testSuggestions);
    console.log('✅ AI suggestions write test successful');
    
    return {
      success: true,
      message: 'AI suggestions test completed successfully'
    };
  } catch (error) {
    console.error('❌ AI suggestions test failed:', error);
    return {
      success: false,
      message: 'AI suggestions test failed',
      error: error
    };
  }
};

// Tüm testleri çalıştır
export const runAllFirebaseTests = async () => {
  console.log('🚀 Starting all Firebase tests...');
  
  const results = {
    connection: await testFirebaseConnection(),
    categoryFeatures: await testCategoryFeatures(),
    aiSuggestions: await testAISuggestions()
  };
  
  console.log('📊 Test results:', results);
  
  const allPassed = Object.values(results).every(result => result.success);
  
  if (allPassed) {
    console.log('✅ All Firebase tests passed!');
  } else {
    console.log('❌ Some Firebase tests failed!');
  }
  
  return {
    allPassed,
    results
  };
}; 