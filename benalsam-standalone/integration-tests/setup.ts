/**
 * Integration Test Setup
 * Tüm microservices'lerin birlikte çalışmasını test eder
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Test configuration
export const TEST_CONFIG = {
  // Service URLs
  ADMIN_BACKEND_URL: process.env['ADMIN_BACKEND_URL'] || 'http://localhost:3002',
  QUEUE_SERVICE_URL: process.env['QUEUE_SERVICE_URL'] || 'http://localhost:3012',
  SEARCH_SERVICE_URL: process.env['SEARCH_SERVICE_URL'] || 'http://localhost:3016',
  CATEGORIES_SERVICE_URL: process.env['CATEGORIES_SERVICE_URL'] || 'http://localhost:3015',
  CACHE_SERVICE_URL: process.env['CACHE_SERVICE_URL'] || 'http://localhost:3014',
  BACKUP_SERVICE_URL: process.env['BACKUP_SERVICE_URL'] || 'http://localhost:3013',
  UPLOAD_SERVICE_URL: process.env['UPLOAD_SERVICE_URL'] || 'http://localhost:3007',
  
  // Test timeouts
  SERVICE_STARTUP_TIMEOUT: 30000, // 30 seconds
  REQUEST_TIMEOUT: 10000, // 10 seconds
  HEALTH_CHECK_INTERVAL: 2000, // 2 seconds
  
  // Test data
  TEST_USER_ID: 'test-user-123',
  TEST_LISTING_ID: 'test-listing-456',
  TEST_CATEGORY_ID: 'test-category-789'
};

// Service health check helper
export async function waitForService(
  serviceName: string, 
  healthUrl: string, 
  timeout: number = TEST_CONFIG.SERVICE_STARTUP_TIMEOUT
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(TEST_CONFIG.REQUEST_TIMEOUT)
      });
      
      if (response.ok) {
        console.log(`✅ ${serviceName} is healthy`);
        return true;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.HEALTH_CHECK_INTERVAL));
  }
  
  console.log(`❌ ${serviceName} failed to start within ${timeout}ms`);
  return false;
}

// Wait for all services to be healthy
export async function waitForAllServices(): Promise<boolean> {
  console.log('🔍 Waiting for all services to be healthy...');
  
  const services = [
    { name: 'Admin Backend', url: `${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/health` },
    { name: 'Queue Service', url: `${TEST_CONFIG.QUEUE_SERVICE_URL}/api/v1/health` },
    { name: 'Search Service', url: `${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/health` },
    { name: 'Categories Service', url: `${TEST_CONFIG.CATEGORIES_SERVICE_URL}/api/v1/health` },
    { name: 'Cache Service', url: `${TEST_CONFIG.CACHE_SERVICE_URL}/api/v1/health` },
    { name: 'Backup Service', url: `${TEST_CONFIG.BACKUP_SERVICE_URL}/api/v1/health` },
    { name: 'Upload Service', url: `${TEST_CONFIG.UPLOAD_SERVICE_URL}/api/v1/health` }
  ];
  
  const results = await Promise.all(
    services.map(service => waitForService(service.name, service.url))
  );
  
  const allHealthy = results.every(result => result);
  
  if (allHealthy) {
    console.log('🎉 All services are healthy and ready for testing!');
  } else {
    console.log('❌ Some services failed to start');
  }
  
  return allHealthy;
}

// Cleanup helper
export async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  // Add cleanup logic here if needed
}

// Test data helpers
export const TEST_DATA = {
  createTestCategory: () => ({
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test category for integration tests',
    is_active: true,
    sort_order: 1
  }),
  
  createTestSearchQuery: () => ({
    query: 'test search',
    page: 1,
    pageSize: 10
  }),
  
  createTestUploadRequest: () => ({
    userId: TEST_CONFIG.TEST_USER_ID,
    listingId: TEST_CONFIG.TEST_LISTING_ID,
    files: [] // Will be populated with actual test files
  })
};
