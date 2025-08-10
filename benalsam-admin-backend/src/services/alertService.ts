import { elasticsearchClient } from './elasticsearchService';
import logger from '../config/logger';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'error' | 'business' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // minutes
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  metadata?: any;
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  alertsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averageResponseTime: number; // minutes
  falsePositiveRate: number; // percentage
  alertCoverage: number; // percentage
}

export class AlertService {
  private readonly rulesIndex = 'alert_rules';
  private readonly alertsIndex = 'alerts';

  constructor() {
    this.initializeIndexes();
  }

  private async initializeIndexes() {
    try {
      // Alert Rules Index
      const rulesIndexExists = await elasticsearchClient.indices.exists({
        index: this.rulesIndex
      });

      if (rulesIndexExists) {
        // Delete existing index to recreate with correct mapping
        await elasticsearchClient.indices.delete({
          index: this.rulesIndex
        });
        logger.info(`🗑️ Deleted existing index: ${this.rulesIndex}`);
      }

      // Create new index with correct mapping
      await elasticsearchClient.indices.create({
        index: this.rulesIndex,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              description: { type: 'text' },
              type: { type: 'keyword' },
              severity: { type: 'keyword' },
              condition: {
                properties: {
                  metric: { type: 'keyword' },
                  operator: { type: 'keyword' },
                  threshold: { type: 'float' },
                  timeWindow: { type: 'long' }
                }
              },
              enabled: { type: 'boolean' },
              createdAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
              updatedAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              }
            }
          }
        }
      });
      logger.info(`✅ Alert rules index created: ${this.rulesIndex}`);

      // Alerts Index
      const alertsIndexExists = await elasticsearchClient.indices.exists({
        index: this.alertsIndex
      });

      if (alertsIndexExists) {
        // Delete existing index to recreate with correct mapping
        await elasticsearchClient.indices.delete({
          index: this.alertsIndex
        });
        logger.info(`🗑️ Deleted existing index: ${this.alertsIndex}`);
      }

      // Create new alerts index with correct mapping
      await elasticsearchClient.indices.create({
        index: this.alertsIndex,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              ruleId: { type: 'keyword' },
              ruleName: { type: 'text' },
              severity: { type: 'keyword' },
              message: { type: 'text' },
              metric: { type: 'keyword' },
              value: { type: 'float' },
              threshold: { type: 'float' },
              status: { type: 'keyword' },
              createdAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
              acknowledgedAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
              resolvedAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
              acknowledgedBy: { type: 'keyword' },
              metadata: { type: 'object', dynamic: true }
            }
          }
        }
      });
      logger.info(`✅ Alerts index created: ${this.alertsIndex}`);
    } catch (error) {
      logger.error('Failed to initialize alert indexes:', error);
    }
  }

  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    try {
      const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newRule: AlertRule = {
        ...rule,
        id,
        createdAt: now,
        updatedAt: now
      };

      await elasticsearchClient.index({
        index: this.rulesIndex,
        id,
        body: newRule
      });

      logger.info(`✅ Alert rule created: ${rule.name}`);
      return newRule;
    } catch (error) {
      logger.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const response = await elasticsearchClient.search({
        index: this.rulesIndex,
        body: {
          query: { match_all: {} },
          sort: [{ createdAt: { order: 'desc' } }]
        }
      });

      return (response as any).hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      logger.error('Failed to get alert rules:', error);
      throw error;
    }
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<boolean> {
    try {
      await elasticsearchClient.update({
        index: this.rulesIndex,
        id,
        body: {
          doc: {
            ...updates,
            updatedAt: new Date().toISOString()
          }
        }
      });

      logger.info(`✅ Alert rule updated: ${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to update alert rule:', error);
      return false;
    }
  }

  async deleteAlertRule(id: string): Promise<boolean> {
    try {
      await elasticsearchClient.delete({
        index: this.rulesIndex,
        id
      });

      logger.info(`✅ Alert rule deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete alert rule:', error);
      return false;
    }
  }

  async createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    try {
      const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newAlert: Alert = {
        ...alert,
        id,
        createdAt: now
      };

      await elasticsearchClient.index({
        index: this.alertsIndex,
        id,
        body: newAlert
      });

      logger.info(`🚨 Alert created: ${alert.message}`);
      return newAlert;
    } catch (error) {
      logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  async getAlerts(status?: string, severity?: string, limit: number = 50): Promise<Alert[]> {
    try {
      const query: any = { match_all: {} };
      
      if (status || severity) {
        query.bool = { must: [] };
        if (status) query.bool.must.push({ term: { status } });
        if (severity) query.bool.must.push({ term: { severity } });
      }

      const response = await elasticsearchClient.search({
        index: this.alertsIndex,
        body: {
          query,
          sort: [{ createdAt: { order: 'desc' } }],
          size: limit
        }
      });

      return (response as any).hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      throw error;
    }
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<boolean> {
    try {
      await elasticsearchClient.update({
        index: this.alertsIndex,
        id,
        body: {
          doc: {
            status: 'acknowledged',
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy
          }
        }
      });

      logger.info(`✅ Alert acknowledged: ${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to acknowledge alert:', error);
      return false;
    }
  }

  async resolveAlert(id: string): Promise<boolean> {
    try {
      await elasticsearchClient.update({
        index: this.alertsIndex,
        id,
        body: {
          doc: {
            status: 'resolved',
            resolvedAt: new Date().toISOString()
          }
        }
      });

      logger.info(`✅ Alert resolved: ${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to resolve alert:', error);
      return false;
    }
  }

  async getAlertMetrics(days: number = 7): Promise<AlertMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await elasticsearchClient.search({
        index: this.alertsIndex,
        body: {
          query: {
            range: {
              createdAt: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            total_alerts: { value_count: { field: 'id' } },
            alerts_by_status: {
              terms: { field: 'status' }
            },
            alerts_by_severity: {
              terms: { field: 'severity' }
            },
            response_time: {
              filter: {
                bool: {
                  must: [
                    { term: { status: 'acknowledged' } },
                    { exists: { field: 'acknowledgedAt' } }
                  ]
                }
              },
              aggs: {
                avg_response_time: {
                  avg: {
                    script: {
                      source: "doc['acknowledgedAt'].value.toInstant().toEpochMilli() - doc['createdAt'].value.toInstant().toEpochMilli()"
                    }
                  }
                }
              }
            }
          }
        }
      });

      const aggregations = (response as any).aggregations;
      const totalAlerts = aggregations.total_alerts.value;
      const statusBuckets = aggregations.alerts_by_status.buckets;
      const severityBuckets = aggregations.alerts_by_severity.buckets;

      const activeAlerts = statusBuckets.find((b: any) => b.key === 'active')?.doc_count || 0;
      const acknowledgedAlerts = statusBuckets.find((b: any) => b.key === 'acknowledged')?.doc_count || 0;
      const resolvedAlerts = statusBuckets.find((b: any) => b.key === 'resolved')?.doc_count || 0;

      const alertsBySeverity = {
        critical: severityBuckets.find((b: any) => b.key === 'critical')?.doc_count || 0,
        high: severityBuckets.find((b: any) => b.key === 'high')?.doc_count || 0,
        medium: severityBuckets.find((b: any) => b.key === 'medium')?.doc_count || 0,
        low: severityBuckets.find((b: any) => b.key === 'low')?.doc_count || 0
      };

      const avgResponseTimeMs = aggregations.response_time.avg_response_time.value || 0;
      const averageResponseTime = avgResponseTimeMs / (1000 * 60); // Convert to minutes

      // Mock values for now
      const falsePositiveRate = 5.2; // Would need historical data analysis
      const alertCoverage = 95.8; // Would need total possible alerts calculation

      return {
        totalAlerts,
        activeAlerts,
        acknowledgedAlerts,
        resolvedAlerts,
        alertsBySeverity,
        averageResponseTime,
        falsePositiveRate,
        alertCoverage
      };
    } catch (error) {
      logger.error('Failed to get alert metrics:', error);
      throw error;
    }
  }

  async checkAlertConditions(): Promise<void> {
    try {
      const rules = await this.getAlertRules();
      const enabledRules = rules.filter(rule => rule.enabled);

      for (const rule of enabledRules) {
        await this.evaluateRule(rule);
      }
    } catch (error) {
      logger.error('Failed to check alert conditions:', error);
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      // Get current metric value (this would be implemented based on the metric type)
      const currentValue = await this.getMetricValue(rule.condition.metric);
      
      let shouldAlert = false;
      
      switch (rule.condition.operator) {
        case 'gt':
          shouldAlert = currentValue > rule.condition.threshold;
          break;
        case 'lt':
          shouldAlert = currentValue < rule.condition.threshold;
          break;
        case 'eq':
          shouldAlert = currentValue === rule.condition.threshold;
          break;
        case 'gte':
          shouldAlert = currentValue >= rule.condition.threshold;
          break;
        case 'lte':
          shouldAlert = currentValue <= rule.condition.threshold;
          break;
      }

      if (shouldAlert) {
        // Check if there's already an active alert for this rule
        const existingAlerts = await this.getAlerts('active');
        const hasActiveAlert = existingAlerts.some(alert => alert.ruleId === rule.id);

        if (!hasActiveAlert) {
          await this.createAlert({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `${rule.name}: ${rule.condition.metric} is ${rule.condition.operator} ${rule.condition.threshold} (current: ${currentValue})`,
            metric: rule.condition.metric,
            value: currentValue,
            threshold: rule.condition.threshold,
            status: 'active'
          });
        }
      }
    } catch (error) {
      logger.error(`Failed to evaluate rule ${rule.id}:`, error);
    }
  }

  private async getMetricValue(metric: string): Promise<number> {
    // This would be implemented to get actual metric values
    // For now, return mock values based on metric type
    switch (metric) {
      case 'response_time':
        return Math.random() * 500 + 100; // 100-600ms
      case 'error_rate':
        return Math.random() * 5; // 0-5%
      case 'cpu_usage':
        return Math.random() * 100; // 0-100%
      case 'memory_usage':
        return Math.random() * 100; // 0-100%
      case 'conversion_rate':
        return Math.random() * 30 + 10; // 10-40%
      case 'drop_off_rate':
        return Math.random() * 50 + 10; // 10-60%
      default:
        return Math.random() * 100;
    }
  }
}

export default new AlertService(); 