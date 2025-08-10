import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import { AnalyticsEvent, AnalyticsEventType, AnalyticsUser, AnalyticsSession, AnalyticsDevice, AnalyticsContext } from 'benalsam-shared-types';

export interface UserBehaviorEvent {
  user_id?: string; // ✅ Optional for session-based tracking
  event_type: 'click' | 'scroll' | 'search' | 'favorite' | 'view' | 'share' | 'message' | 'offer' | 'performance' | 'LISTING_VIEW' | 'FAVORITE_ADDED' | 'OFFER_SENT' | 'MESSAGE_SENT' | 'FORM_SUBMIT' | 'BUTTON_CLICK' | 'SCREEN_VIEW';
  event_data: {
    screen_name?: string;
    section_name?: string;
    listing_id?: string;
    category_id?: string;
    search_term?: string;
    scroll_depth?: number;
    time_spent?: number;
    coordinates?: { x: number; y: number };
    [key: string]: any;
  };
  timestamp: string;
  session_id?: string;
  device_info?: {
    platform: string;
    version: string;
    model?: string;
  };
}

export interface UserAnalytics {
  user_id: string;
  screen_name: string;
  scroll_depth: number;
  time_spent: number; // seconds
  sections_engaged: {
    [sectionName: string]: {
      time_spent: number;
      interactions: number;
    };
  };
  session_start: string;
  session_end?: string;
  bounce_rate: boolean;
}

export class UserBehaviorService {
  private client: Client;
  private behaviorIndex: string = 'user_behaviors';
  private analyticsIndex: string = 'user_analytics';

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
      // User Behaviors Index - Enhanced for new analytics format
      await this.client.indices.create({
        index: this.behaviorIndex,
        body: {
          mappings: {
            properties: {
              // Event properties
              event_id: { type: 'keyword' },
              event_name: { type: 'keyword' },
              event_timestamp: { type: 'date' },
              event_properties: { type: 'object', dynamic: true },
              
              // User properties
              user: {
                type: 'object',
                properties: {
                  id: { type: 'keyword' },
                  email: { type: 'keyword' },
                  name: { type: 'text' },
                  avatar: { type: 'keyword' },
                  properties: {
                    type: 'object',
                    properties: {
                      registration_date: { type: 'date' },
                      subscription_type: { type: 'keyword' },
                      last_login: { type: 'date' },
                      trust_score: { type: 'float' },
                      verification_status: { type: 'keyword' }
                    }
                  }
                }
              },
              
              // Session properties
              session: {
                type: 'object',
                properties: {
                  id: { type: 'keyword' },
                  start_time: { type: 'date' },
                  duration: { type: 'long' },
                  page_views: { type: 'integer' },
                  events_count: { type: 'integer' }
                }
              },
              
              // Device properties
              device: {
                type: 'object',
                properties: {
                  platform: { type: 'keyword' },
                  version: { type: 'keyword' },
                  model: { type: 'keyword' },
                  screen_resolution: { type: 'keyword' },
                  app_version: { type: 'keyword' },
                  os_version: { type: 'keyword' },
                  browser: { type: 'keyword' },
                  user_agent: { type: 'text' }
                }
              },
              
              // Context properties
              context: {
                type: 'object',
                properties: {
                  ip_address: { type: 'ip' },
                  user_agent: { type: 'text' },
                  referrer: { type: 'keyword' },
                  utm_source: { type: 'keyword' },
                  utm_medium: { type: 'keyword' },
                  utm_campaign: { type: 'keyword' },
                  utm_term: { type: 'keyword' },
                  utm_content: { type: 'keyword' },
                  language: { type: 'keyword' },
                  timezone: { type: 'keyword' }
                }
              },
              
              // Legacy fields for backward compatibility
              user_id: { type: 'keyword' },
              event_type: { type: 'keyword' },
              event_data: { type: 'object' },
              timestamp: { type: 'date' },
              session_id: { type: 'keyword' },
              device_info: { type: 'object' }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          }
        }
      });

      // User Analytics Index
      await this.client.indices.create({
        index: this.analyticsIndex,
        body: {
          mappings: {
            properties: {
              user_id: { type: 'keyword' },
              screen_name: { type: 'keyword' },
              scroll_depth: { type: 'integer' },
              time_spent: { type: 'integer' },
              sections_engaged: { type: 'object' },
              session_start: { type: 'date' },
              session_end: { type: 'date' },
              bounce_rate: { type: 'boolean' }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          }
        }
      });

      logger.info('✅ User behavior indexes created successfully');
      return true;
    } catch (error: any) {
      if (error.message?.includes('resource_already_exists_exception')) {
        logger.info('ℹ️ User behavior indexes already exist');
        return true;
      }
      logger.error('❌ Error creating user behavior indexes:', error);
      return false;
    }
  }

  async trackUserBehavior(event: UserBehaviorEvent): Promise<boolean> {
    try {
      logger.info('🔍 trackUserBehavior called');
      logger.info('🔍 Event object:', JSON.stringify(event, null, 2));
      logger.info('🔍 Event type:', event.event_type);
      logger.info('🔍 User ID:', event.user_id);
      
      logger.info('🔍 About to index to Elasticsearch');
      logger.info('🔍 Index name:', this.behaviorIndex);
      
      const result = await this.client.index({
        index: this.behaviorIndex,
        body: {
          ...event,
          timestamp: event.timestamp || new Date().toISOString()
        }
      });
      
      logger.info('🔍 Elasticsearch index result:', JSON.stringify(result, null, 2));
      logger.info(`📊 User behavior tracked: ${event.event_type} for user ${event.user_id}`);
      return true;
    } catch (error) {
      logger.error('❌ Error tracking user behavior:', error);
      if (error instanceof Error) {
        logger.error('❌ Error message:', error.message);
        logger.error('❌ Error stack:', error.stack);
      }
      return false;
    }
  }

  async trackUserAnalytics(analytics: UserAnalytics): Promise<boolean> {
    try {
      await this.client.index({
        index: this.analyticsIndex,
        body: {
          ...analytics,
          session_start: analytics.session_start || new Date().toISOString()
        }
      });
      
      logger.info(`📈 User analytics tracked for user ${analytics.user_id}`);
      return true;
    } catch (error) {
      logger.error('❌ Error tracking user analytics:', error);
      return false;
    }
  }

  async getUserBehaviorStats(userId: string, days: number = 30): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { range: { timestamp: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          aggs: {
            event_types: {
              terms: { field: 'event_type.keyword' }
            },
            daily_activity: {
              date_histogram: {
                field: 'timestamp',
                calendar_interval: 'day',
                format: 'yyyy-MM-dd'
              }
            },
            screen_usage: {
              terms: { field: 'event_data.screen_name.keyword' }
            }
          },
          size: 0
        }
      });

      return {
        event_types: (response.aggregations?.event_types as any)?.buckets || [],
        daily_activity: (response.aggregations?.daily_activity as any)?.buckets || [],
        screen_usage: (response.aggregations?.screen_usage as any)?.buckets || []
      };
    } catch (error) {
      logger.error('❌ Error getting user behavior stats:', error);
      return { event_types: [], daily_activity: [], screen_usage: [] };
    }
  }

  async getPopularSections(days: number = 7): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            range: { timestamp: { gte: fromDate.toISOString() } }
          },
          aggs: {
            popular_sections: {
              terms: { field: 'event_data.section_name.keyword', size: 10 }
            },
            event_types: {
              terms: { field: 'event_type.keyword' }
            }
          },
          size: 0
        }
      });

      return {
        sections: (response.aggregations?.popular_sections as any)?.buckets || [],
        event_types: (response.aggregations?.event_types as any)?.buckets || []
      };
    } catch (error) {
      logger.error('❌ Error getting popular sections:', error);
      return { sections: [], event_types: [] };
    }
  }

  async getBounceRateStats(days: number = 7): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.analyticsIndex,
        body: {
          query: {
            range: {
              session_start: {
                gte: `now-${days}d`
              }
            }
          },
          aggs: {
            bounce_rate: {
              terms: { field: 'bounce_rate' }
            },
            avg_time_spent: {
              avg: { field: 'time_spent' }
            },
            avg_scroll_depth: {
              avg: { field: 'scroll_depth' }
            }
          }
        }
      });

      return response;
    } catch (error) {
      logger.error('❌ Error getting bounce rate stats:', error);
      return null;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const behaviorStats = await this.client.indices.stats({ index: this.behaviorIndex });
      const analyticsStats = await this.client.indices.stats({ index: this.analyticsIndex });
      
      return {
        behavior_index: behaviorStats,
        analytics_index: analyticsStats
      };
    } catch (error) {
      logger.error('❌ Error getting index stats:', error);
      return null;
    }
  }

  async getPerformanceMetrics(days: number = 7, eventType: string = 'performance'): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { event_type: eventType } },
                { range: { timestamp: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          aggs: {
            metric_types: {
              terms: { field: 'event_data.metric_type.keyword' },
              aggs: {
                avg_value: { avg: { field: 'event_data.value' } },
                avg_percentage: { avg: { field: 'event_data.percentage' } },
                avg_duration: { avg: { field: 'event_data.duration_ms' } },
                error_count: { sum: { field: 'event_data.count' } }
              }
            },
            device_platforms: {
              terms: { field: 'device_info.platform.keyword' }
            },
            hourly_distribution: {
              date_histogram: {
                field: 'timestamp',
                calendar_interval: 'hour'
              }
            }
          },
          size: 0
        }
      });

      return {
        metric_types: (response.aggregations?.metric_types as any)?.buckets || [],
        device_platforms: (response.aggregations?.device_platforms as any)?.buckets || [],
        hourly_distribution: (response.aggregations?.hourly_distribution as any)?.buckets || [],
        total_events: (response.hits?.total as any)?.value || 0
      };
    } catch (error) {
      logger.error('❌ Error getting performance metrics:', error);
      return null;
    }
  }

  async getPopularPages(days: number = 7): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { range: { timestamp: { gte: fromDate.toISOString() } } },
                { exists: { field: 'event_data.screen_name' } }
              ]
            }
          },
          aggs: {
            popular_pages: {
              terms: { field: 'event_data.screen_name.keyword', size: 15 }
            }
          },
          size: 0
        }
      });

      const buckets = (response.aggregations?.popular_pages as any)?.buckets || [];
      return buckets.map((bucket: any) => ({
        page_name: bucket.key,
        view_count: bucket.doc_count,
        unique_users: bucket.doc_count,
        avg_duration: 30,
        bounce_rate: 25,
        daily_trend: []
      }));
    } catch (error) {
      logger.error('❌ Error getting popular pages:', error);
      return [];
    }
  }

  async getFeatureUsage(days: number = 7): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            range: { timestamp: { gte: fromDate.toISOString() } }
          },
          aggs: {
            feature_usage: {
              terms: { field: 'event_type.keyword', size: 20 }
            }
          },
          size: 0
        }
      });

      const buckets = (response.aggregations?.feature_usage as any)?.buckets || [];
      return buckets.map((bucket: any) => ({
        feature: bucket.key,
        usage_count: bucket.doc_count,
        unique_users: bucket.doc_count,
        daily_trend: []
      }));
    } catch (error) {
      logger.error('❌ Error getting feature usage:', error);
      return [];
    }
  }

  async getUserJourney(userId: string, days: number = 7): Promise<any> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { range: { timestamp: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          sort: [{ timestamp: { order: 'asc' } }],
          size: 1000
        }
      });

      const hits = response.hits?.hits || [];
      const events = hits.map((hit: any) => ({
        timestamp: hit._source.timestamp,
        screen: hit._source.event_data?.screen_name,
        action: hit._source.event_type,
        session_id: hit._source.session_id
      }));

      const sessions: any = {};
      events.forEach((event: any) => {
        if (!sessions[event.session_id]) {
          sessions[event.session_id] = [];
        }
        sessions[event.session_id].push(event);
      });

      return Object.values(sessions).map((session: any) => ({
        session_id: session[0].session_id,
        journey: session.map((event: any) => ({
          screen: event.screen,
          action: event.action,
          timestamp: event.timestamp
        }))
      }));
    } catch (error) {
      logger.error('❌ Error getting user journey:', error);
      return [];
    }
  }

  async getRealTimeMetrics(): Promise<any> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            range: {
              timestamp: {
                gte: oneHourAgo.toISOString(),
                lte: now.toISOString()
              }
            }
          },
          aggs: {
            active_sessions: {
              cardinality: { field: 'session_id.keyword' }
            },
            total_events: {
              value_count: { field: 'event_type.keyword' }
            },
            event_types: {
              terms: { field: 'event_type.keyword' }
            }
          },
          size: 0
        }
      });

      return {
        activeUsers: (response.aggregations?.active_sessions as any)?.value || 0,
        totalSessions: (response.aggregations?.total_events as any)?.value || 0,
        pageViews: (response.aggregations?.total_events as any)?.value || 0,
        avgResponseTime: 200,
        errorRate: 0.5,
        memoryUsage: 45.2,
        bundleSize: 2.1,
        apiCalls: (response.aggregations?.total_events as any)?.value || 0
      };
    } catch (error) {
      logger.error('❌ Error getting real-time metrics:', error);
      return {
        activeUsers: 0,
        totalSessions: 0,
        pageViews: 0,
        avgResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        bundleSize: 0,
        apiCalls: 0
      };
    }
  }

  async getUserActivities(): Promise<any[]> {
    try {
      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            match_all: {}
          },
          sort: [{ timestamp: { order: 'desc' } }],
          size: 50
        }
      });

      return response.hits?.hits?.map((hit: any) => {
        const source = hit._source;
        
        return {
          id: hit._id,
          sessionId: source.session_id || 'unknown',
          action: source.event_type || 'unknown',
          screen: source.event_data?.screen_name || 'unknown',
          timestamp: source.timestamp,
          deviceInfo: source.device_info || { platform: 'unknown', model: 'unknown' }
        };
      }) || [];
    } catch (error) {
      logger.error('❌ Error getting user activities:', error);
      return [];
    }
  }

  async getSessionActivities(filters: {
    page?: number;
    limit?: number;
    session_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    try {
      const { page = 1, limit = 50, session_id, start_date, end_date } = filters;
      
      const query: any = {
        bool: {
          must: []
        }
      };

      if (session_id) {
        query.bool.must.push({ term: { session_id: session_id } });
      }

      if (start_date || end_date) {
        const range: any = {};
        if (start_date) range.gte = start_date;
        if (end_date) range.lte = end_date;
        query.bool.must.push({ range: { timestamp: range } });
      }

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query,
          sort: [{ timestamp: { order: 'desc' } }],
          from: (page - 1) * limit,
          size: limit
        }
      });

      return response.hits?.hits?.map((hit: any) => {
        const source = hit._source;
        return {
          id: hit._id,
          sessionId: source.session_id || 'unknown',
          action: source.event_type || 'unknown',
          screen: source.event_data?.screen_name || 'unknown',
          timestamp: source.timestamp,
          deviceInfo: source.device_info || { platform: 'unknown', model: 'unknown' }
        };
      }) || [];
    } catch (error) {
      logger.error('❌ Error getting session activities:', error);
      return [];
    }
  }

  async getPerformanceAlerts(): Promise<any[]> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { event_type: 'performance' } },
                { range: { timestamp: { gte: oneHourAgo.toISOString() } } }
              ]
            }
          },
          sort: [{ timestamp: { order: 'desc' } }],
          size: 20
        }
      });

      return response.hits?.hits?.map((hit: any) => ({
        id: hit._id,
        type: 'warning',
        message: `Performance issue detected: ${hit._source.event_data?.metric_type || 'Unknown'}`,
        timestamp: hit._source.timestamp,
        resolved: false
      })) || [];
    } catch (error) {
      logger.error('❌ Error getting performance alerts:', error);
      return [];
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            range: {
              timestamp: {
                gte: oneDayAgo.toISOString()
              }
            }
          },
          aggs: {
            total_users: {
              cardinality: { field: 'user_id' }
            },
            total_events: {
              value_count: { field: 'event_type.keyword' }
            },
            event_types: {
              terms: { field: 'event_type.keyword' }
            }
          },
          size: 0
        }
      });

      return {
        totalUsers: (response.aggregations?.total_users as any)?.value || 0,
        totalListings: 3421,
        totalCategories: 156,
        totalRevenue: 45230,
        activeListings: 2891,
        pendingModeration: 23,
        newUsersToday: (response.aggregations?.total_users as any)?.value || 0,
        newListingsToday: 45
      };
    } catch (error) {
      logger.error('❌ Error getting dashboard stats:', error);
      return {
        totalUsers: 0,
        totalListings: 0,
        totalCategories: 0,
        totalRevenue: 0,
        activeListings: 0,
        pendingModeration: 0,
        newUsersToday: 0,
        newListingsToday: 0
      };
    }
  }

  // ===========================
  // STANDARDIZED ANALYTICS METHODS
  // ===========================

  async trackAnalyticsEvent(analyticsEvent: AnalyticsEvent): Promise<boolean> {
    try {
      // Enhanced document with additional metadata
      const document = {
        ...analyticsEvent,
        '@timestamp': analyticsEvent.event_timestamp,
        // Add legacy fields for backward compatibility
        user_id: analyticsEvent.user.id,
        event_type: analyticsEvent.event_name,
        event_data: analyticsEvent.event_properties,
        timestamp: analyticsEvent.event_timestamp,
        session_id: analyticsEvent.session.id,
        device_info: {
          platform: analyticsEvent.device.platform,
          version: analyticsEvent.device.version,
          model: analyticsEvent.device.model
        }
      };

      await this.client.index({
        index: this.behaviorIndex,
        body: document
      });

      logger.info(`Analytics event tracked: ${analyticsEvent.event_name} for user ${analyticsEvent.user.id} (session: ${analyticsEvent.session.id})`);
      return true;
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      return false;
    }
  }

  async getAnalyticsEvents(params: {
    page?: number;
    limit?: number;
    event_type?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    try {
      const { page = 1, limit = 20, event_type, user_id, start_date, end_date } = params;
      const from = (page - 1) * limit;

      const query: any = {
        bool: {
          must: []
        }
      };

      if (event_type) {
        query.bool.must.push({ term: { event_type: event_type } });
      }

      if (user_id) {
        query.bool.must.push({ term: { user_id: user_id } });
      }

      if (start_date || end_date) {
        const range: any = {};
        if (start_date) range.gte = start_date;
        if (end_date) range.lte = end_date;
        query.bool.must.push({ range: { timestamp: range } });
      }

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query,
          sort: [{ timestamp: { order: 'desc' } }],
          from,
          size: limit
        }
      });

      return {
        events: response.hits.hits.map((hit: any) => ({
          ...hit._source,
          _id: hit._id
        })),
        total: (response.hits.total as any)?.value || response.hits.total || 0,
        page,
        limit,
        totalPages: Math.ceil(((response.hits.total as any)?.value || response.hits.total || 0) / limit)
      };
    } catch (error) {
      logger.error('Error getting analytics events:', error);
      throw error;
    }
  }

  async getAnalyticsEventTypes(days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            range: {
              event_timestamp: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            event_types: {
              terms: {
                field: 'event_name.keyword',
                size: 20
              },
              aggs: {
                event_count: {
                  value_count: {
                    field: 'event_name.keyword'
                  }
                }
              }
            }
          },
          size: 0
        }
      });

      const buckets = (response.aggregations?.event_types as any)?.buckets || [];
      
      return buckets.map((bucket: any) => ({
        event_type: bucket.key,
        count: bucket.doc_count,
        percentage: (bucket.doc_count / ((response.hits.total as any)?.value || response.hits.total || 0)) * 100
      }));
    } catch (error) {
      logger.error('Error getting analytics event types:', error);
      throw error;
    }
  }

  async getAnalyticsUserJourney(userId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { 'user.id': userId } },
                {
                  range: {
                    event_timestamp: {
                      gte: startDate.toISOString()
                    }
                  }
                }
              ]
            }
          },
          sort: [{ event_timestamp: { order: 'asc' } }],
          size: 100
        }
      });

      const events = response.hits.hits.map((hit: any) => ({
        event_id: hit._source.event_id,
        event_name: hit._source.event_name,
        event_timestamp: hit._source.event_timestamp,
        event_properties: hit._source.event_properties,
        session_id: hit._source.session.id
      }));

      // Group events by session
      const sessions: { [key: string]: any[] } = {};
      events.forEach(event => {
        if (!sessions[event.session_id]) {
          sessions[event.session_id] = [];
        }
        sessions[event.session_id].push(event);
      });

      return {
        user_id: userId,
        total_sessions: Object.keys(sessions).length,
        total_events: events.length,
        sessions: Object.entries(sessions).map(([sessionId, sessionEvents]) => ({
          session_id: sessionId,
          events: sessionEvents,
          session_start: sessionEvents[0]?.event_timestamp,
          session_end: sessionEvents[sessionEvents.length - 1]?.event_timestamp,
          event_count: sessionEvents.length
        }))
      };
    } catch (error) {
      logger.error('Error getting analytics user journey:', error);
      throw error;
    }
  }

  async getAnalyticsSessionData(sessionId: string): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            term: { 'session.id': sessionId }
          },
          sort: [{ event_timestamp: { order: 'asc' } }],
          size: 100
        }
      });

      const events = response.hits.hits.map((hit: any) => ({
        event_id: hit._source.event_id,
        event_name: hit._source.event_name,
        event_timestamp: hit._source.event_timestamp,
        event_properties: hit._source.event_properties,
        user: hit._source.user,
        device: hit._source.device
      }));

      if (events.length === 0) {
        return null;
      }

      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];
      const sessionDuration = new Date(lastEvent.event_timestamp).getTime() - new Date(firstEvent.event_timestamp).getTime();

      return {
        session_id: sessionId,
        user: firstEvent.user,
        device: firstEvent.device,
        session_start: firstEvent.event_timestamp,
        session_end: lastEvent.event_timestamp,
        session_duration_ms: sessionDuration,
        total_events: events.length,
        events: events,
        event_types: [...new Set(events.map(e => e.event_name))]
      };
    } catch (error) {
      logger.error('Error getting analytics session data:', error);
      throw error;
    }
  }

  // Enhanced analytics methods
  async getAnalyticsUserStats(userId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { 'user.id': userId } },
                { range: { event_timestamp: { gte: startDate.toISOString() } } }
              ]
            }
          },
          aggs: {
            event_types: {
              terms: { field: 'event_name.keyword', size: 20 }
            },
            sessions: {
              cardinality: { field: 'session.id' }
            },
            total_events: {
              value_count: { field: 'event_id' }
            },
            avg_session_duration: {
              avg: { field: 'session.duration' }
            },
            platforms: {
              terms: { field: 'device.platform.keyword' }
            }
          }
        }
      });

      return {
        userId,
        period: `${days} days`,
        stats: {
          totalEvents: (response.aggregations?.total_events as any)?.value || 0,
          uniqueSessions: (response.aggregations?.sessions as any)?.value || 0,
          avgSessionDuration: (response.aggregations?.avg_session_duration as any)?.value || 0,
          eventTypes: (response.aggregations?.event_types as any)?.buckets || [],
          platforms: (response.aggregations?.platforms as any)?.buckets || []
        }
      };
    } catch (error) {
      logger.error('Error getting user analytics stats:', error);
      throw error;
    }
  }

  async getAnalyticsPerformanceMetrics(days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { range: { event_timestamp: { gte: startDate.toISOString() } } },
                { terms: { event_name: ['app_load', 'api_call', 'error_occurred'] } }
              ]
            }
          },
          aggs: {
            app_load_times: {
              filter: { term: { event_name: 'app_load' } },
              aggs: {
                avg_load_time: { avg: { field: 'event_properties.load_time_ms' } },
                p95_load_time: { percentiles: { field: 'event_properties.load_time_ms', percents: [95] } }
              }
            },
            api_call_times: {
              filter: { term: { event_name: 'api_call' } },
              aggs: {
                avg_duration: { avg: { field: 'event_properties.duration_ms' } },
                p95_duration: { percentiles: { field: 'event_properties.duration_ms', percents: [95] } }
              }
            },
            error_rates: {
              filter: { term: { event_name: 'error_occurred' } },
              aggs: {
                error_count: { value_count: { field: 'event_id' } },
                error_types: { terms: { field: 'event_properties.error_type.keyword' } }
              }
            }
          }
        }
      });

      return {
        period: `${days} days`,
        performance: {
          appLoad: {
            avgLoadTime: (response.aggregations?.app_load_times as any)?.avg_load_time?.value || 0,
            p95LoadTime: (response.aggregations?.app_load_times as any)?.p95_load_time?.values?.['95.0'] || 0
          },
          apiCalls: {
            avgDuration: (response.aggregations?.api_call_times as any)?.avg_duration?.value || 0,
            p95Duration: (response.aggregations?.api_call_times as any)?.p95_duration?.values?.['95.0'] || 0
          },
          errors: {
            totalErrors: (response.aggregations?.error_rates as any)?.error_count?.value || 0,
            errorTypes: (response.aggregations?.error_rates as any)?.error_types?.buckets || []
          }
        }
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  async getAnalyticsUserJourneyEnhanced(userId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { 'user.id': userId } },
                { range: { event_timestamp: { gte: startDate.toISOString() } } }
              ]
            }
          },
          sort: [{ event_timestamp: { order: 'asc' } }],
          size: 1000,
          aggs: {
            sessions: {
              terms: { field: 'session.id', size: 100 },
              aggs: {
                session_events: {
                  top_hits: {
                    sort: [{ event_timestamp: { order: 'asc' } }],
                    size: 50
                  }
                }
              }
            }
          }
        }
      });

      const sessions = (response.aggregations?.sessions as any)?.buckets?.map((bucket: any) => ({
        sessionId: bucket.key,
        events: bucket.session_events.hits.hits.map((hit: any) => hit._source),
        eventCount: bucket.doc_count
      })) || [];

      return {
        userId,
        period: `${days} days`,
        totalSessions: sessions.length,
        sessions
      };
    } catch (error) {
      logger.error('Error getting enhanced user journey:', error);
      throw error;
    }
  }

  // Session-based analytics methods
  async getSessionEvents(filters: {
    page?: number;
    limit?: number;
    event_type?: string;
    session_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    try {
      const { page = 1, limit = 50, event_type, session_id, start_date, end_date } = filters;
      
      const query: any = {
        bool: {
          must: []
        }
      };

      if (session_id) {
        query.bool.must.push({ term: { session_id: session_id } });
      }

      if (event_type) {
        query.bool.must.push({ term: { 'event_name.keyword': event_type } });
      }

      if (start_date || end_date) {
        const range: any = {};
        if (start_date) range.gte = start_date;
        if (end_date) range.lte = end_date;
        query.bool.must.push({ range: { event_timestamp: range } });
      }

      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query,
          sort: [{ event_timestamp: { order: 'desc' } }],
          from: (page - 1) * limit,
          size: limit
        }
      });

      return {
        events: response.hits.hits.map((hit: any) => hit._source),
        total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0,
        page,
        limit
      };
    } catch (error) {
      logger.error('Error getting session events:', error);
      return { events: [], total: 0, page: 1, limit: 50 };
    }
  }

  async getSessionStats(days: number = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Get session statistics
      const sessionStats = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            range: { event_timestamp: { gte: startDate.toISOString(), lte: endDate.toISOString() } }
          },
          aggs: {
            total_sessions: {
              cardinality: { field: 'session_id.keyword' }
            },
            active_sessions: {
              filter: {
                range: { event_timestamp: { gte: new Date(Date.now() - 30 * 60 * 1000).toISOString() } }
              },
              aggs: {
                session_count: {
                  cardinality: { field: 'session_id.keyword' }
                }
              }
            },
            event_types: {
              terms: { field: 'event_name.keyword', size: 20 }
            },
            platforms: {
              terms: { field: 'device_info.platform.keyword', size: 10 }
            }
          }
        }
      });

      const aggs = sessionStats.aggregations as any;
      
      return {
        totalSessions: aggs?.total_sessions?.value || 0,
        activeSessions: aggs?.active_sessions?.session_count?.value || 0,
        totalEvents: typeof sessionStats.hits.total === 'number' ? sessionStats.hits.total : sessionStats.hits.total?.value || 0,
        eventTypes: aggs?.event_types?.buckets || [],
        platforms: aggs?.platforms?.buckets || [],
        avgSessionDuration: this.calculateAverageSessionDuration(sessionStats.hits.hits)
      };
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalEvents: 0,
        eventTypes: [],
        platforms: [],
        avgSessionDuration: 0
      };
    }
  }

  async getSessionJourney(sessionId: string, days: number = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      const response = await this.client.search({
        index: this.behaviorIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { session_id: sessionId } },
                { range: { event_timestamp: { gte: startDate.toISOString(), lte: endDate.toISOString() } } }
              ]
            }
          },
          sort: [{ event_timestamp: { order: 'asc' } }],
          size: 1000
        }
      });

      const events = response.hits.hits.map((hit: any) => hit._source);
      
      const sessionDuration = this.calculateSessionDuration(events);
      const eventTypes = [...new Set(events.map((event: any) => event.event_name))];
      const screensVisited = [...new Set(events.map((event: any) => event.event_properties?.screen_name).filter(Boolean))];
      
      return {
        sessionId,
        totalEvents: events.length,
        sessionDuration: sessionDuration,
        screensVisited: screensVisited.length,
        eventTypes: eventTypes,
        startTime: events.length > 0 ? events[0].event_timestamp : new Date().toISOString(),
        endTime: events.length > 0 ? events[events.length - 1].event_timestamp : new Date().toISOString(),
        conversionRate: 15.5, // Mock data
        dropOffRate: 25.3, // Mock data
        engagementScore: 75, // Mock data
        topScreens: [
          { screen: 'HomeScreen', views: 5, conversionRate: 80.0 },
          { screen: 'ListingDetail', views: 3, conversionRate: 66.7 },
          { screen: 'CategoryList', views: 2, conversionRate: 50.0 }
        ],
        sessionFlow: [
          { from: 'HomeScreen', to: 'CategoryList', count: 3, conversionRate: 100.0 },
          { from: 'CategoryList', to: 'ListingDetail', count: 2, conversionRate: 66.7 },
          { from: 'ListingDetail', to: 'ChatScreen', count: 1, conversionRate: 50.0 }
        ],
        events: events.map((event: any) => ({
          id: event.id || Math.random().toString(),
          event_type: event.event_name,
          screen_name: event.event_properties?.screen_name,
          timestamp: event.event_timestamp,
          event_data: event.event_properties,
          device_info: event.device_info
        }))
      };
    } catch (error) {
      logger.error('Error getting session journey:', error);
      return null;
    }
  }

  async getSessionAnalytics(sessionId: string, days: number = 7): Promise<any> {
    try {
      const journey = await this.getSessionJourney(sessionId, days);
      if (!journey) return null;

      // Calculate analytics metrics
      const eventTypeCounts = new Map();
      const platformInfo = journey.events[0]?.device_info || {};
      
      journey.events.forEach((event: any) => {
        const count = eventTypeCounts.get(event.event_type) || 0;
        eventTypeCounts.set(event.event_type, count + 1);
      });

      return {
        sessionId,
        totalEvents: journey.totalEvents,
        duration: journey.duration,
        eventTypeDistribution: Array.from(eventTypeCounts.entries()).map(([type, count]) => ({
          event_type: type,
          count
        })),
        platform: platformInfo.platform,
        version: platformInfo.version,
        model: platformInfo.model,
        events: journey.events
      };
    } catch (error) {
      logger.error('Error getting session analytics:', error);
      return null;
    }
  }

  private calculateSessionDuration(events: any[]): number {
    if (events.length < 2) return 0;
    
    const sortedEvents = events.sort((a, b) => 
      new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
    );
    
    const startTime = new Date(sortedEvents[0].event_timestamp).getTime();
    const endTime = new Date(sortedEvents[sortedEvents.length - 1].event_timestamp).getTime();
    
    const durationInSeconds = Math.round((endTime - startTime) / 1000);
    return durationInSeconds > 0 ? durationInSeconds : 60; // Minimum 60 saniye
  }

  private calculateAverageSessionDuration(events: any[]): number {
    // Group events by session and calculate average duration
    const sessions = new Map();
    events.forEach((event: any) => {
      const sessionId = event._source.session?.id || 'unknown';
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId).push(event._source);
    });

    let totalDuration = 0;
    let sessionCount = 0;

    sessions.forEach((sessionEvents) => {
      const duration = this.calculateSessionDuration(sessionEvents);
      if (duration > 0) {
        totalDuration += duration;
        sessionCount++;
      }
    });

    return sessionCount > 0 ? totalDuration / sessionCount : 0;
  }
}

export default new UserBehaviorService(); 