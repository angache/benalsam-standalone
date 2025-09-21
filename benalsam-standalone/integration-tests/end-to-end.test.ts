/**
 * End-to-End Integration Tests
 * Tüm sistemin birlikte çalışmasını test eder
 */

import { TEST_CONFIG, waitForAllServices, TEST_DATA } from './setup';

describe('End-to-End Integration Tests', () => {
  beforeAll(async () => {
    // Wait for all services to be healthy
    const allHealthy = await waitForAllServices();
    if (!allHealthy) {
      throw new Error('Not all services are healthy. Cannot run integration tests.');
    }
  }, 60000); // 60 second timeout

  describe('Complete Workflow Tests', () => {
    it('should handle complete listing creation workflow', async () => {
      // 1. Create a category
      const categoryData = TEST_DATA.createTestCategory();
      const categoryResponse = await fetch(`${TEST_CONFIG.CATEGORIES_SERVICE_URL}/api/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });
      
      expect(categoryResponse.status).toBe(201);
      const category = await categoryResponse.json();
      expect(category).toHaveProperty('data');
      expect(category.data).toHaveProperty('id');

      // 2. Search for the category
      const searchResponse = await fetch(`${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: categoryData.name,
          page: 1,
          pageSize: 10
        })
      });
      
      expect(searchResponse.status).toBe(200);
      const searchResult = await searchResponse.json();
      expect(searchResult).toHaveProperty('success');
      expect(searchResult.success).toBe(true);

      // 3. Check queue service is processing jobs
      const queueHealthResponse = await fetch(`${TEST_CONFIG.QUEUE_SERVICE_URL}/api/v1/health`);
      expect(queueHealthResponse.status).toBe(200);
      const queueHealth = await queueHealthResponse.json();
      expect(queueHealth).toHaveProperty('status');

      // 4. Verify cache service is working
      const cacheHealthResponse = await fetch(`${TEST_CONFIG.CACHE_SERVICE_URL}/api/v1/health`);
      expect(cacheHealthResponse.status).toBe(200);
      const cacheHealth = await cacheHealthResponse.json();
      expect(cacheHealth).toHaveProperty('status');

      // 5. Check backup service
      const backupHealthResponse = await fetch(`${TEST_CONFIG.BACKUP_SERVICE_URL}/api/v1/health`);
      expect(backupHealthResponse.status).toBe(200);
      const backupHealth = await backupHealthResponse.json();
      expect(backupHealth).toHaveProperty('status');
    });

    it('should handle file upload workflow', async () => {
      // 1. Check upload service health
      const uploadHealthResponse = await fetch(`${TEST_CONFIG.UPLOAD_SERVICE_URL}/api/v1/health`);
      expect(uploadHealthResponse.status).toBe(200);
      const uploadHealth = await uploadHealthResponse.json();
      expect(uploadHealth).toHaveProperty('status');

      // 2. Get upload service metrics
      const metricsResponse = await fetch(`${TEST_CONFIG.UPLOAD_SERVICE_URL}/api/v1/jobs/metrics`);
      expect(metricsResponse.status).toBe(200);
      const metrics = await metricsResponse.json();
      expect(metrics).toHaveProperty('jobs');
    });

    it('should handle search and cache integration', async () => {
      // 1. Perform a search
      const searchResponse = await fetch(`${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test query',
          page: 1,
          pageSize: 10
        })
      });
      
      expect(searchResponse.status).toBe(200);
      const searchResult = await searchResponse.json();
      expect(searchResult).toHaveProperty('success');

      // 2. Perform the same search again (should use cache)
      const cachedSearchResponse = await fetch(`${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test query',
          page: 1,
          pageSize: 10
        })
      });
      
      expect(cachedSearchResponse.status).toBe(200);
      const cachedSearchResult = await cachedSearchResponse.json();
      expect(cachedSearchResult).toHaveProperty('success');
    });
  });

  describe('Service Intercommunication', () => {
    it('should handle Admin Backend to Search Service communication', async () => {
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'admin backend search',
          page: 1,
          pageSize: 10
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('success');
    });

    it('should handle Admin Backend to Categories Service communication', async () => {
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/categories`);
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle cross-service data consistency', async () => {
      // 1. Create data in one service
      const categoryData = {
        name: 'Integration Test Category',
        slug: 'integration-test-category',
        description: 'Category for integration testing',
        is_active: true,
        sort_order: 1
      };

      const createResponse = await fetch(`${TEST_CONFIG.CATEGORIES_SERVICE_URL}/api/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });
      
      expect(createResponse.status).toBe(201);
      const createdCategory = await createResponse.json();

      // 2. Verify data is accessible through Admin Backend
      const adminResponse = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/categories`);
      expect(adminResponse.status).toBe(200);
      
      const adminResult = await adminResponse.json();
      expect(adminResult).toHaveProperty('success');
      expect(adminResult.success).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service unavailability gracefully', async () => {
      // Test with non-existent endpoint
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should maintain system stability under load', async () => {
      // Send multiple concurrent requests
      const requests = Array(10).fill(null).map(() => 
        fetch(`${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/health`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should provide performance metrics', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${TEST_CONFIG.SEARCH_SERVICE_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'performance test',
          page: 1,
          pageSize: 10
        })
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      const result = await response.json();
      expect(result).toHaveProperty('responseTime');
    });

    it('should maintain consistent response times', async () => {
      const responseTimes: number[] = [];
      
      // Perform multiple requests
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await fetch(`${TEST_CONFIG.CATEGORIES_SERVICE_URL}/api/v1/health`);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }
      
      // Calculate average response time
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      // Average response time should be reasonable
      expect(averageResponseTime).toBeLessThan(2000); // Less than 2 seconds
    });
  });
});
