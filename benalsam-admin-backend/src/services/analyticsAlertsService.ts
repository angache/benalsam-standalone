import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import nodemailer from 'nodemailer';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric_type: 'system' | 'api' | 'elasticsearch' | 'business' | 'user_journey';
  metric_name: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains';
  threshold: number | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels: string[];
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric_type: string;
  metric_name: string;
  current_value: number | string;
  threshold_value: number | string;
  message: string;
  status: 'active' | 'resolved' | 'acknowledged';
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  notification_sent: boolean;
  notification_channels: string[];
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: {
    email?: {
      to: string[];
      from: string;
      subject_template: string;
    };
    slack?: {
      webhook_url: string;
      channel: string;
      username: string;
    };
    webhook?: {
      url: string;
      method: 'POST' | 'PUT';
      headers: Record<string, string>;
    };
    sms?: {
      phone_numbers: string[];
      provider: string;
      api_key: string;
    };
  };
  enabled: boolean;
  created_at: string;
}

export interface AlertSummary {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  acknowledged_alerts: number;
  alerts_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  alerts_by_type: {
    system: number;
    api: number;
    elasticsearch: number;
    business: number;
    user_journey: number;
  };
  recent_alerts: Alert[];
}

export class AnalyticsAlertsService {
  private client: Client;
  private alertsIndex: string = 'analytics_alerts';
  private rulesIndex: string = 'alert_rules';
  private channelsIndex: string = 'notification_channels';

  constructor(
    node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
    username: string = process.env.ELASTICSEARCH_USERNAME || '',
    password: string = process.env.ELASTICSEARCH_PASSWORD || ''
  ) {
    this.client = new Client({
      node,
      auth: username ? { username, password } : undefined
    });
  }

  async initializeIndexes(): Promise<boolean> {
    try {
      // Alerts Index
      await this.client.indices.create({
        index: this.alertsIndex,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              rule_id: { type: 'keyword' },
              rule_name: { type: 'text' },
              severity: { type: 'keyword' },
              metric_type: { type: 'keyword' },
              metric_name: { type: 'keyword' },
              current_value: { type: 'float' },
              threshold_value: { type: 'float' },
              message: { type: 'text' },
              status: { type: 'keyword' },
              triggered_at: { type: 'date' },
              resolved_at: { type: 'date' },
              acknowledged_at: { type: 'date' },
              acknowledged_by: { type: 'keyword' },
              notification_sent: { type: 'boolean' },
              notification_channels: { type: 'keyword' },
              metadata: { type: 'object', dynamic: true }
            }
          }
        }
      });

      // Alert Rules Index
      await this.client.indices.create({
        index: this.rulesIndex,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              description: { type: 'text' },
              metric_type: { type: 'keyword' },
              metric_name: { type: 'keyword' },
              condition: { type: 'keyword' },
              threshold: { type: 'float' },
              severity: { type: 'keyword' },
              enabled: { type: 'boolean' },
              notification_channels: { type: 'keyword' },
              cooldown_minutes: { type: 'integer' },
              created_at: { type: 'date' },
              updated_at: { type: 'date' }
            }
          }
        }
      });

      // Notification Channels Index
      await this.client.indices.create({
        index: this.channelsIndex,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              type: { type: 'keyword' },
              config: { type: 'object', dynamic: true },
              enabled: { type: 'boolean' },
              created_at: { type: 'date' }
            }
          }
        }
      });

      logger.info('Analytics Alerts indexes initialized successfully');
      return true;
    } catch (error: any) {
      if (error.message.includes('resource_already_exists_exception')) {
        logger.info('Analytics Alerts indexes already exist');
        return true;
      }
      logger.error('Error initializing analytics alerts indexes:', error);
      return false;
    }
  }

  async createAlertRule(rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<AlertRule> {
    try {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newRule: AlertRule = {
        ...rule,
        id: ruleId,
        created_at: now,
        updated_at: now
      };

      await this.client.index({
        index: this.rulesIndex,
        id: ruleId,
        body: newRule
      });

      logger.info(`Alert rule created: ${rule.name}`);
      return newRule;
    } catch (error: any) {
      logger.error('Error creating alert rule:', error);
      throw error;
    }
  }

  async getAlertRules(): Promise<AlertRule[]> {
    try {
      // Check if index exists first
      const indexExists = await this.client.indices.exists({ index: this.rulesIndex });
      if (!indexExists) {
        logger.info(`Index ${this.rulesIndex} does not exist, returning empty array`);
        return [];
      }

      const response = await this.client.search({
        index: this.rulesIndex,
        body: {
          query: { match_all: {} },
          sort: [{ created_at: { order: 'desc' } }],
          size: 100
        }
      });

      return response.hits.hits.map((hit: any) => hit._source as AlertRule);
    } catch (error: any) {
      logger.error('Error getting alert rules:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      await this.client.update({
        index: this.rulesIndex,
        id: ruleId,
        body: {
          doc: {
            ...updates,
            updated_at: now
          }
        }
      });

      logger.info(`Alert rule updated: ${ruleId}`);
      return true;
    } catch (error: any) {
      logger.error('Error updating alert rule:', error);
      return false;
    }
  }

  async deleteAlertRule(ruleId: string): Promise<boolean> {
    try {
      await this.client.delete({
        index: this.rulesIndex,
        id: ruleId
      });

      logger.info(`Alert rule deleted: ${ruleId}`);
      return true;
    } catch (error: any) {
      logger.error('Error deleting alert rule:', error);
      return false;
    }
  }

  async createNotificationChannel(channel: Omit<NotificationChannel, 'id' | 'created_at'>): Promise<NotificationChannel> {
    try {
      const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newChannel: NotificationChannel = {
        ...channel,
        id: channelId,
        created_at: now
      };

      await this.client.index({
        index: this.channelsIndex,
        id: channelId,
        body: newChannel
      });

      logger.info(`Notification channel created: ${channel.name}`);
      return newChannel;
    } catch (error: any) {
      logger.error('Error creating notification channel:', error);
      throw error;
    }
  }

  async getNotificationChannels(): Promise<NotificationChannel[]> {
    try {
      const response = await this.client.search({
        index: this.channelsIndex,
        body: {
          query: { match_all: {} },
          sort: [{ created_at: { order: 'desc' } }],
          size: 50
        }
      });

      return response.hits.hits.map((hit: any) => hit._source as NotificationChannel);
    } catch (error: any) {
      logger.error('Error getting notification channels:', error);
      throw error;
    }
  }

  async checkAlerts(metrics: Record<string, any>): Promise<Alert[]> {
    try {
      const rules = await this.getAlertRules();
      const enabledRules = rules.filter(rule => rule.enabled);
      const newAlerts: Alert[] = [];

      for (const rule of enabledRules) {
        const metricValue = metrics[rule.metric_name];
        
        if (metricValue === undefined) continue;

        const shouldTrigger = this.evaluateCondition(
          metricValue,
          rule.condition,
          rule.threshold
        );

        if (shouldTrigger) {
          // Check cooldown
          const lastAlert = await this.getLastAlertForRule(rule.id);
          if (lastAlert && this.isInCooldown(lastAlert.triggered_at, rule.cooldown_minutes)) {
            continue;
          }

          const alert = await this.createAlert(rule, metricValue);
          newAlerts.push(alert);
        }
      }

      return newAlerts;
    } catch (error: any) {
      logger.error('Error checking alerts:', error);
      throw error;
    }
  }

  private evaluateCondition(value: any, condition: string, threshold: any): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'contains':
        return String(value).includes(String(threshold));
      case 'not_contains':
        return !String(value).includes(String(threshold));
      default:
        return false;
    }
  }

  private async getLastAlertForRule(ruleId: string): Promise<Alert | null> {
    try {
      const response = await this.client.search({
        index: this.alertsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { rule_id: ruleId } },
                { term: { status: 'active' } }
              ]
            }
          },
          sort: [{ triggered_at: { order: 'desc' } }],
          size: 1
        }
      });

      if (response.hits.hits.length > 0) {
        return response.hits.hits[0]._source as Alert;
      }
      return null;
    } catch (error: any) {
      logger.error('Error getting last alert for rule:', error);
      return null;
    }
  }

  private isInCooldown(triggeredAt: string, cooldownMinutes: number): boolean {
    const triggeredTime = new Date(triggeredAt).getTime();
    const currentTime = Date.now();
    const cooldownMs = cooldownMinutes * 60 * 1000;
    
    return (currentTime - triggeredTime) < cooldownMs;
  }

  private async createAlert(rule: AlertRule, currentValue: any): Promise<Alert> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const alert: Alert = {
        id: alertId,
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        metric_type: rule.metric_type,
        metric_name: rule.metric_name,
        current_value: currentValue,
        threshold_value: rule.threshold,
        message: this.generateAlertMessage(rule, currentValue),
        status: 'active',
        triggered_at: now,
        notification_sent: false,
        notification_channels: rule.notification_channels
      };

      await this.client.index({
        index: this.alertsIndex,
        id: alertId,
        body: alert
      });

      // Send notifications
      await this.sendNotifications(alert);

      logger.info(`Alert created: ${alert.message}`);
      return alert;
    } catch (error: any) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  private generateAlertMessage(rule: AlertRule, currentValue: any): string {
    const conditionText = {
      gt: 'exceeded',
      lt: 'dropped below',
      eq: 'equals',
      gte: 'reached or exceeded',
      lte: 'dropped to or below',
      contains: 'contains',
      not_contains: 'does not contain'
    };

    return `${rule.metric_name} ${conditionText[rule.condition]} threshold (${rule.threshold}). Current value: ${currentValue}`;
  }

  async sendNotifications(alert: Alert): Promise<boolean> {
    try {
      const channels = await this.getNotificationChannels();
      const alertChannels = channels.filter(channel => 
        alert.notification_channels.includes(channel.id) && channel.enabled
      );

      for (const channel of alertChannels) {
        try {
          switch (channel.type) {
            case 'email':
              await this.sendEmailNotification(channel, alert);
              break;
            case 'slack':
              await this.sendSlackNotification(channel, alert);
              break;
            case 'webhook':
              await this.sendWebhookNotification(channel, alert);
              break;
            case 'sms':
              await this.sendSMSNotification(channel, alert);
              break;
          }
        } catch (error: any) {
          logger.error(`Failed to send notification via ${channel.type}:`, error);
        }
      }

      // Mark notification as sent
      await this.client.update({
        index: this.alertsIndex,
        id: alert.id,
        body: {
          doc: { notification_sent: true }
        }
      });

      return true;
    } catch (error: any) {
      logger.error('Error sending notifications:', error);
      return false;
    }
  }

  private async sendEmailNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    if (!channel.config.email) return;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: channel.config.email.from,
      to: channel.config.email.to.join(', '),
      subject: `[${alert.severity.toUpperCase()}] ${alert.rule_name}`,
      html: `
        <h2>Alert: ${alert.rule_name}</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Metric:</strong> ${alert.metric_name}</p>
        <p><strong>Current Value:</strong> ${alert.current_value}</p>
        <p><strong>Threshold:</strong> ${alert.threshold_value}</p>
        <p><strong>Triggered:</strong> ${new Date(alert.triggered_at).toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email notification sent for alert: ${alert.id}`);
  }

  private async sendSlackNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    if (!channel.config.slack) return;

    const color = {
      critical: '#ff0000',
      high: '#ff6600',
      medium: '#ffcc00',
      low: '#00cc00'
    }[alert.severity];

    const payload = {
      channel: channel.config.slack.channel,
      username: channel.config.slack.username,
      attachments: [{
        color,
        title: `🚨 Alert: ${alert.rule_name}`,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Metric',
            value: alert.metric_name,
            short: true
          },
          {
            title: 'Current Value',
            value: String(alert.current_value),
            short: true
          },
          {
            title: 'Threshold',
            value: String(alert.threshold_value),
            short: true
          }
        ],
        footer: `Triggered at ${new Date(alert.triggered_at).toLocaleString()}`
      }]
    };

    const response = await fetch(channel.config.slack.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }

    logger.info(`Slack notification sent for alert: ${alert.id}`);
  }

  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    if (!channel.config.webhook) return;

    const payload = {
      alert_id: alert.id,
      rule_name: alert.rule_name,
      severity: alert.severity,
      message: alert.message,
      metric_name: alert.metric_name,
      current_value: alert.current_value,
      threshold_value: alert.threshold_value,
      triggered_at: alert.triggered_at
    };

    const response = await fetch(channel.config.webhook.url, {
      method: channel.config.webhook.method,
      headers: {
        'Content-Type': 'application/json',
        ...channel.config.webhook.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }

    logger.info(`Webhook notification sent for alert: ${alert.id}`);
  }

  private async sendSMSNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    if (!channel.config.sms) return;

    // Implement SMS notification logic here
    // This would depend on the SMS provider (Twilio, etc.)
    logger.info(`SMS notification would be sent for alert: ${alert.id}`);
  }

  async getAlerts(params: {
    status?: string;
    severity?: string;
    metric_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  } = {}): Promise<Alert[]> {
    try {
      // Check if index exists first
      const indexExists = await this.client.indices.exists({ index: this.alertsIndex });
      if (!indexExists) {
        logger.info(`Index ${this.alertsIndex} does not exist, returning empty array`);
        return [];
      }

      const query: any = { bool: { must: [] } };

      if (params.status) {
        query.bool.must.push({ term: { status: params.status } });
      }
      if (params.severity) {
        query.bool.must.push({ term: { severity: params.severity } });
      }
      if (params.metric_type) {
        query.bool.must.push({ term: { metric_type: params.metric_type } });
      }
      if (params.start_date || params.end_date) {
        const range: any = { triggered_at: {} };
        if (params.start_date) range.triggered_at.gte = params.start_date;
        if (params.end_date) range.triggered_at.lte = params.end_date;
        query.bool.must.push({ range });
      }

      const response = await this.client.search({
        index: this.alertsIndex,
        body: {
          query,
          sort: [{ triggered_at: { order: 'desc' } }],
          size: params.limit || 50
        }
      });

      return response.hits.hits.map((hit: any) => hit._source as Alert);
    } catch (error: any) {
      logger.error('Error getting alerts:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      await this.client.update({
        index: this.alertsIndex,
        id: alertId,
        body: {
          doc: {
            status: 'acknowledged',
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: acknowledgedBy
          }
        }
      });

      logger.info(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
      return true;
    } catch (error: any) {
      logger.error('Error acknowledging alert:', error);
      return false;
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      await this.client.update({
        index: this.alertsIndex,
        id: alertId,
        body: {
          doc: {
            status: 'resolved',
            resolved_at: new Date().toISOString()
          }
        }
      });

      logger.info(`Alert resolved: ${alertId}`);
      return true;
    } catch (error: any) {
      logger.error('Error resolving alert:', error);
      return false;
    }
  }

  async getAlertSummary(): Promise<AlertSummary> {
    try {
      const [activeAlerts, resolvedAlerts, acknowledgedAlerts] = await Promise.all([
        this.getAlerts({ status: 'active' }),
        this.getAlerts({ status: 'resolved' }),
        this.getAlerts({ status: 'acknowledged' })
      ]);

      const allAlerts = [...activeAlerts, ...resolvedAlerts, ...acknowledgedAlerts];

      const alertsBySeverity = {
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length
      };

      const alertsByType = {
        system: allAlerts.filter(a => a.metric_type === 'system').length,
        api: allAlerts.filter(a => a.metric_type === 'api').length,
        elasticsearch: allAlerts.filter(a => a.metric_type === 'elasticsearch').length,
        business: allAlerts.filter(a => a.metric_type === 'business').length,
        user_journey: allAlerts.filter(a => a.metric_type === 'user_journey').length
      };

      const recentAlerts = allAlerts
        .sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())
        .slice(0, 10);

      return {
        total_alerts: allAlerts.length,
        active_alerts: activeAlerts.length,
        resolved_alerts: resolvedAlerts.length,
        acknowledged_alerts: acknowledgedAlerts.length,
        alerts_by_severity: alertsBySeverity,
        alerts_by_type: alertsByType,
        recent_alerts: recentAlerts
      };
    } catch (error: any) {
      logger.error('Error getting alert summary:', error);
      throw error;
    }
  }
}

export default new AnalyticsAlertsService(); 