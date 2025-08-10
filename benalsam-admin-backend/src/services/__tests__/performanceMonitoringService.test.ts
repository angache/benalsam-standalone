import { PerformanceMonitoringService } from '../performanceMonitoringService';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');
jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => ({
    indices: {
      create: jest.fn().mockResolvedValue({ acknowledged: true }),
      exists: jest.fn().mockResolvedValue({ body: false }),
      putMapping: jest.fn().mockResolvedValue({ acknowledged: true })
    },
    index: jest.fn().mockResolvedValue({ body: { _id: 'test-id' } }),
    search: jest.fn().mockResolvedValue({ body: { hits: { hits: [] } } }),
    cluster: {
      health: jest.fn().mockResolvedValue({ body: { status: 'green' } }),
      stats: jest.fn().mockResolvedValue({ body: { indices: { count: 5 } } })
    },
    cat: {
      indices: jest.fn().mockResolvedValue({ body: [] })
    }
  }))
}));

describe('PerformanceMonitoringService', () => {
  let performanceMonitoringService: PerformanceMonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitoringService = new PerformanceMonitoringService();
  });

  describe('Constructor', () => {
    it('should initialize with default settings', () => {
      expect(performanceMonitoringService).toBeDefined();
      expect((performanceMonitoringService as any).metricsIndex).toBe('performance_metrics');
      expect((performanceMonitoringService as any).alertsIndex).toBe('performance_alerts');
    });

    it('should initialize with custom settings', () => {
      const customService = new PerformanceMonitoringService(
        'http://custom-elasticsearch:9200',
        'custom-user',
        'custom-password'
      );

      expect(customService).toBeDefined();
    });
  });

  describe('getSystemMetrics()', () => {
    it('should return comprehensive system metrics', async () => {
      const result = await performanceMonitoringService.getSystemMetrics();

      expect(result).toHaveProperty('cpu_usage');
      expect(result).toHaveProperty('memory_usage');
      expect(result).toHaveProperty('disk_usage');
      expect(result).toHaveProperty('disk_io');
      expect(result).toHaveProperty('network_io');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('load_average');
      expect(typeof result.cpu_usage).toBe('number');
      expect(typeof result.memory_usage).toBe('number');
      expect(typeof result.uptime).toBe('number');
      expect(Array.isArray(result.load_average)).toBe(true);
    });

    it('should handle system metrics collection errors gracefully', async () => {
      // Mock os.cpus to throw error
      jest.doMock('os', () => ({
        ...jest.requireActual('os'),
        cpus: jest.fn().mockImplementation(() => {
          throw new Error('CPU info unavailable');
        })
      }));

      const result = await performanceMonitoringService.getSystemMetrics();

      expect(result).toBeDefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getDatabaseMetrics()', () => {
    it('should return database metrics', async () => {
      const result = await performanceMonitoringService.getDatabaseMetrics();

      expect(result).toHaveProperty('query_count');
      expect(result).toHaveProperty('slow_queries');
      expect(result).toHaveProperty('avg_query_time');
      expect(result).toHaveProperty('max_query_time');
      expect(result).toHaveProperty('connection_count');
      expect(result).toHaveProperty('active_connections');
      expect(result).toHaveProperty('idle_connections');
      expect(result).toHaveProperty('query_errors');
      expect(result).toHaveProperty('table_sizes');
      expect(result).toHaveProperty('index_usage');
      expect(typeof result.query_count).toBe('number');
      expect(typeof result.avg_query_time).toBe('number');
    });
  });

  describe('checkPerformanceAlerts()', () => {
    it('should check performance alerts successfully', async () => {
      const result = await performanceMonitoringService.checkPerformanceAlerts();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getAPIMetrics()', () => {
    it('should return API metrics for specified minutes', async () => {
      const result = await performanceMonitoringService.getAPIMetrics(5);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getActiveAlerts()', () => {
    it('should return active alerts', async () => {
      const result = await performanceMonitoringService.getActiveAlerts();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metric data gracefully', async () => {
      const invalidMetrics = {
        endpoint: '',
        method: 'INVALID',
        response_time: -1,
        status_code: 999,
        request_size: -1,
        response_size: -1,
        timestamp: 'invalid-date'
      };

      const result = await performanceMonitoringService.trackAPIMetrics(invalidMetrics);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent metric tracking efficiently', async () => {
      const promises = Array.from({ length: 10 }, () =>
        performanceMonitoringService.trackSystemMetrics()
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(result => typeof result === 'boolean')).toBe(true);
    });

    it('should handle large metric datasets efficiently', async () => {
      const largeMetrics = Array.from({ length: 1000 }, (_, i) => ({
        endpoint: `/api/test${i}`,
        method: 'GET',
        response_time: Math.random() * 1000,
        status_code: 200,
        request_size: 1024,
        response_size: 2048,
        timestamp: new Date().toISOString()
      }));

      const promises = largeMetrics.map(metric =>
        performanceMonitoringService.trackAPIMetrics(metric)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(1000);
      expect(results.every(result => typeof result === 'boolean')).toBe(true);
    });
  });
}); 