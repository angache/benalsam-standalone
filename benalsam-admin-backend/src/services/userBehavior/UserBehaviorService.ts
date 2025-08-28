// ===========================
// MAIN USER BEHAVIOR SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import logger from '../../config/logger';
import { 
  UserBehaviorEvent, 
  UserAnalytics, 
  UserBehaviorServiceConfig,
  ElasticsearchConfig 
} from './types';
import UserBehaviorTrackingService from './services/UserBehaviorTrackingService';
import UserAnalyticsService from './services/UserAnalyticsService';
import UserBehaviorQueryService from './services/UserBehaviorQueryService';

export default class UserBehaviorService {
  private client: Client;
  private behaviorIndex: string = 'user_behaviors';
  private analyticsIndex: string = 'user_analytics';
  private logger: any;

  // Modular services
  private trackingService: UserBehaviorTrackingService;
  private analyticsService: UserAnalyticsService;
  private queryService: UserBehaviorQueryService;

  constructor(
    node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
    username: string = process.env.ELASTICSEARCH_USERNAME || '',
    password: string = process.env.ELASTICSEARCH_PASSWORD || ''
  ) {
    this.client = new Client({ 
      node, 
      auth: username ? { username, password } : undefined 
    });
    this.logger = logger;

    // Initialize modular services
    this.trackingService = new UserBehaviorTrackingService(this.client, this.behaviorIndex, this.logger);
    this.analyticsService = new UserAnalyticsService(this.client, this.analyticsIndex, this.logger);
    this.queryService = new UserBehaviorQueryService(this.client, this.behaviorIndex, this.logger);
  }

  async initializeIndexes(): Promise<boolean> {
    try {
      const [behaviorResult, analyticsResult] = await Promise.all([
        this.trackingService.initializeIndex(),
        this.analyticsService.initializeIndex()
      ]);

      return behaviorResult && analyticsResult;
    } catch (error) {
      this.logger.error('❌ Error initializing indexes:', error);
      return false;
    }
  }

  // Tracking methods
  async trackUserBehavior(event: UserBehaviorEvent): Promise<boolean> {
    const result = await this.trackingService.trackUserBehavior(event);
    return result.success;
  }

  async trackBatchEvents(events: UserBehaviorEvent[]): Promise<boolean[]> {
    const results = await this.trackingService.trackBatchEvents(events);
    return results.map(result => result.success);
  }

  async validateEvent(event: UserBehaviorEvent): Promise<boolean> {
    return await this.trackingService.validateEvent(event);
  }

  async getEventById(eventId: string): Promise<UserBehaviorEvent | null> {
    return await this.trackingService.getEventById(eventId);
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return await this.trackingService.deleteEvent(eventId);
  }

  async updateEvent(eventId: string, updates: Partial<UserBehaviorEvent>): Promise<boolean> {
    return await this.trackingService.updateEvent(eventId, updates);
  }

  // Analytics methods
  async trackUserAnalytics(analytics: UserAnalytics): Promise<boolean> {
    const result = await this.analyticsService.trackUserAnalytics(analytics);
    return result.success;
  }

  async getUserAnalytics(userId: string, days: number = 30): Promise<UserAnalytics[]> {
    return await this.analyticsService.getUserAnalytics(userId, days);
  }

  async getSessionAnalytics(sessionId: string): Promise<UserAnalytics | null> {
    return await this.analyticsService.getSessionAnalytics(sessionId);
  }

  async updateSessionEnd(userId: string, sessionId: string, sessionEnd: string): Promise<boolean> {
    return await this.analyticsService.updateSessionEnd(userId, sessionId, sessionEnd);
  }

  async calculateBounceRate(userId: string, days: number = 30): Promise<number> {
    return await this.analyticsService.calculateBounceRate(userId, days);
  }

  async getAverageSessionDuration(userId: string, days: number = 30): Promise<number> {
    return await this.analyticsService.getAverageSessionDuration(userId, days);
  }

  async getMostEngagedSections(userId: string, days: number = 30): Promise<Array<{section: string, time_spent: number}>> {
    return await this.analyticsService.getMostEngagedSections(userId, days);
  }

  // Query methods
  async getUserBehaviorStats(userId: string, days: number = 30): Promise<any> {
    const result = await this.queryService.getUserBehaviorStats(userId, days);
    return result.success ? result.data : { event_types: [], daily_activity: [], screen_usage: [] };
  }

  async getPopularSections(days: number = 7): Promise<any> {
    const result = await this.queryService.getPopularSections(days);
    return result.success ? result.data : { popular_sections: [], event_types: [], time_distribution: [] };
  }

  async getUserEngagementMetrics(days: number = 30): Promise<any> {
    const result = await this.queryService.getUserEngagementMetrics(days);
    return result.success ? result.data : {
      total_users: 0,
      active_users: 0,
      average_session_duration: 0,
      bounce_rate: 0,
      pages_per_session: 0,
      conversion_rate: 0
    };
  }

  async getSearchAnalytics(days: number = 30): Promise<any> {
    const result = await this.queryService.getSearchAnalytics(days);
    return result.success ? result.data : { popular_terms: [], search_volume: [], no_results_rate: 0, average_results_clicked: 0 };
  }

  async getListingInteractionMetrics(days: number = 30): Promise<any> {
    const result = await this.queryService.getListingInteractionMetrics(days);
    return result.success ? result.data : { most_viewed_listings: [], favorite_actions: [], offer_actions: [], message_actions: [] };
  }

  async getDeviceAnalytics(days: number = 30): Promise<any> {
    const result = await this.queryService.getDeviceAnalytics(days);
    return result.success ? result.data : { platform_usage: [], browser_usage: [], screen_resolutions: [] };
  }

  async getPerformanceMetrics(days: number = 30): Promise<any> {
    const result = await this.queryService.getPerformanceMetrics(days);
    return result.success ? result.data : { page_load_times: [], error_rates: [], api_response_times: [] };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('❌ Elasticsearch health check failed:', error);
      return false;
    }
  }

  // Get service configuration
  getConfig(): UserBehaviorServiceConfig {
    const elasticsearchConfig: ElasticsearchConfig = {
      node: this.client.connectionPool.connections[0]?.url?.toString() || '',
      behaviorIndex: this.behaviorIndex,
      analyticsIndex: this.analyticsIndex
    };

    return {
      elasticsearch: elasticsearchConfig,
      logger: this.logger
    };
  }
}
