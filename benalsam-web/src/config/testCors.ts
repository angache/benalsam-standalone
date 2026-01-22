// Test CORS Configuration
// This file can be imported in browser environment to test CORS setup

import { 
  getCurrentEnvironment, 
  getAllowedOrigins, 
  isOriginAllowed,
  getCORSConfig,
  getApiBaseUrl,
  getWebSocketUrl
} from './corsConfig';

// Test function that can be called from browser console
export const testCorsConfig = () => {
  console.group('🔍 CORS Configuration Test');
  
  try {
    const env = getCurrentEnvironment();
    console.log('🌍 Environment:', env);
    
    const apiBaseUrl = getApiBaseUrl();
    console.log('🔌 API Base URL:', apiBaseUrl);
    
    const websocketUrl = getWebSocketUrl();
    console.log('🔌 WebSocket URL:', websocketUrl);
    
    const allowedOrigins = getAllowedOrigins();
    console.log('✅ Allowed Origins:', allowedOrigins);
    
    // Test some common origins
    const testOrigins = [
      'http://localhost:5173',
      'http://localhost:3003',
      'https://benalsam.vercel.app',
      'https://benalsam.com',
      'https://staging.benalsam.com',
      'http://192.168.1.100:5173'
    ];
    
    console.log('\n🧪 Origin Testing:');
    testOrigins.forEach(origin => {
      const isAllowed = isOriginAllowed(origin);
      console.log(`${isAllowed ? '✅' : '❌'} ${origin}: ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
    });
    
    const corsConfig = getCORSConfig();
    console.log('\n⚙️ CORS Configuration:');
    console.log('- Credentials:', corsConfig.credentials);
    console.log('- Methods:', corsConfig.methods);
    console.log('- Max Age:', corsConfig.maxAge);
    
    console.log('\n🎉 CORS Configuration Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ CORS Configuration Test Failed:', error);
  }
  
  console.groupEnd();
};

// Auto-run test in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setTimeout(testCorsConfig, 1000); // Run after app loads
}

export default testCorsConfig;