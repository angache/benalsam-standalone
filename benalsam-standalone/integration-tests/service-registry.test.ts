/**
 * Service Registry Integration Tests
 * Admin Backend'in Service Registry ile diğer servislerle iletişimini test eder
 */

import { TEST_CONFIG, waitForAllServices } from './setup';

describe('Service Registry Integration Tests', () => {
  beforeAll(async () => {
    // Wait for all services to be healthy
    const allHealthy = await waitForAllServices();
    if (!allHealthy) {
      throw new Error('Not all services are healthy. Cannot run integration tests.');
    }
  }, 60000); // 60 second timeout

  describe('Service Registry Health Checks', () => {
    it('should return overall system health', async () => {
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/service-registry/health`);
      expect(response.status).toBe(200);
      
      const health = await response.json();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('timestamp');
      
      // Check that all services are registered
      expect(health.services).toHaveProperty('queue');
      expect(health.services).toHaveProperty('search');
      expect(health.services).toHaveProperty('categories');
      expect(health.services).toHaveProperty('cache');
      expect(health.services).toHaveProperty('backup');
      expect(health.services).toHaveProperty('upload');
    });

    it('should return individual service health', async () => {
      const services = ['queue', 'search', 'categories', 'cache', 'backup', 'upload'];
      
      for (const service of services) {
        const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/service-registry/health/${service}`);
        expect(response.status).toBe(200);
        
        const health = await response.json();
        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('service');
        expect(health.service).toBe(service);
      }
    });

    it('should list all registered services', async () => {
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/service-registry/services`);
      expect(response.status).toBe(200);
      
      const services = await response.json();
      expect(services).toHaveProperty('services');
      expect(Array.isArray(services.services)).toBe(true);
      expect(services.services.length).toBeGreaterThan(0);
      
      // Check that all expected services are listed
      const serviceNames = services.services.map((s: any) => s.name);
      expect(serviceNames).toContain('queue');
      expect(serviceNames).toContain('search');
      expect(serviceNames).toContain('categories');
      expect(serviceNames).toContain('cache');
      expect(serviceNames).toContain('backup');
      expect(serviceNames).toContain('upload');
    });
  });

  describe('Service Communication', () => {
    it('should proxy search requests to Search Service', async () => {
      const searchRequest = {
        query: 'test search',
        page: 1,
        pageSize: 10
      };

      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/search/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchRequest)
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should proxy category requests to Categories Service', async () => {
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/categories`);
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle service failures gracefully', async () => {
      // Test with invalid service name
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/service-registry/health/invalid-service`);
      expect(response.status).toBe(404);
    });
  });

  describe('Service Registry Metrics', () => {
    it('should provide service metrics', async () => {
      const response = await fetch(`${TEST_CONFIG.ADMIN_BACKEND_URL}/api/v1/service-registry/metrics`);
      expect(response.status).toBe(200);
      
      const metrics = await response.json();
      expect(metrics).toHaveProperty('totalServices');
      expect(metrics).toHaveProperty('healthyServices');
      expect(metrics).toHaveProperty('unhealthyServices');
      expect(metrics).toHaveProperty('averageResponseTime');
    });
  });
});
