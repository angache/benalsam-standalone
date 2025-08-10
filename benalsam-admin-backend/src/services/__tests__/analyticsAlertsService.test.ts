import { AnalyticsAlertsService } from '../analyticsAlertsService';
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
    update: jest.fn().mockResolvedValue({ body: { _id: 'test-id' } }),
    delete: jest.fn().mockResolvedValue({ body: { _id: 'test-id' } })
  }))
}));

describe('AnalyticsAlertsService', () => {
  let analyticsAlertsService: AnalyticsAlertsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsAlertsService = new AnalyticsAlertsService();
  });

  describe('Constructor', () => {
    it('should initialize with default settings', () => {
      expect(analyticsAlertsService).toBeDefined();
      expect((analyticsAlertsService as any).alertsIndex).toBe('analytics_alerts');
      expect((analyticsAlertsService as any).rulesIndex).toBe('alert_rules');
      expect((analyticsAlertsService as any).channelsIndex).toBe('notification_channels');
    });

    it('should initialize with custom settings', () => {
      const customService = new AnalyticsAlertsService(
        'http://custom-elasticsearch:9200',
        'custom-user',
        'custom-password'
      );

      expect(customService).toBeDefined();
    });
  });

  describe('evaluateCondition()', () => {
    it('should evaluate greater than condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(85, 'gt', 80);

      expect(result).toBe(true);
    });

    it('should evaluate less than condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(70, 'lt', 80);

      expect(result).toBe(true);
    });

    it('should evaluate equals condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(80, 'eq', 80);

      expect(result).toBe(true);
    });

    it('should evaluate greater than or equal condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(80, 'gte', 80);

      expect(result).toBe(true);
    });

    it('should evaluate less than or equal condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(80, 'lte', 80);

      expect(result).toBe(true);
    });

    it('should evaluate contains condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition('error message', 'contains', 'error');

      expect(result).toBe(true);
    });

    it('should evaluate not contains condition correctly', () => {
      const result = (analyticsAlertsService as any).evaluateCondition('success message', 'not_contains', 'error');

      expect(result).toBe(true);
    });
  });

  describe('isInCooldown()', () => {
    it('should return true when in cooldown period', () => {
      const triggeredAt = new Date(Date.now() - 2 * 60 * 1000).toISOString(); // 2 minutes ago
      const cooldownMinutes = 5;

      const result = (analyticsAlertsService as any).isInCooldown(triggeredAt, cooldownMinutes);

      expect(result).toBe(true);
    });

    it('should return false when cooldown period has passed', () => {
      const triggeredAt = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      const cooldownMinutes = 5;

      const result = (analyticsAlertsService as any).isInCooldown(triggeredAt, cooldownMinutes);

      expect(result).toBe(false);
    });
  });

  describe('generateAlertMessage()', () => {
    it('should generate alert message correctly', () => {
      const rule = {
        id: 'test-rule',
        name: 'High CPU Usage',
        description: 'Alert when CPU usage exceeds 80%',
        metric_type: 'system' as const,
        metric_name: 'cpu_usage',
        condition: 'gt' as const,
        threshold: 80,
        severity: 'high' as const,
        enabled: true,
        notification_channels: ['email'],
        cooldown_minutes: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const currentValue = 85;

      const result = (analyticsAlertsService as any).generateAlertMessage(rule, currentValue);

      expect(result).toContain('cpu_usage');
      expect(result).toContain('85');
      expect(result).toContain('80');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid condition evaluation gracefully', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(85, 'invalid_condition', 80);

      expect(result).toBe(false);
    });

    it('should handle null values in condition evaluation', () => {
      const result = (analyticsAlertsService as any).evaluateCondition(null, 'gt', 80);

      expect(result).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle multiple condition evaluations efficiently', () => {
      const conditions = ['gt', 'lt', 'eq', 'gte', 'lte', 'contains', 'not_contains'];
      const values = [85, 70, 80, 80, 80, 'error message', 'success message'];
      const thresholds = [80, 80, 80, 80, 80, 'error', 'error'];

      const results = conditions.map((condition, index) =>
        (analyticsAlertsService as any).evaluateCondition(values[index], condition, thresholds[index])
      );

      expect(results).toHaveLength(7);
      expect(results.every(result => typeof result === 'boolean')).toBe(true);
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        value: Math.random() * 100,
        condition: 'gt',
        threshold: 50
      }));

      const results = largeDataset.map(item =>
        (analyticsAlertsService as any).evaluateCondition(item.value, item.condition, item.threshold)
      );

      expect(results).toHaveLength(1000);
      expect(results.every(result => typeof result === 'boolean')).toBe(true);
    });
  });
}); 