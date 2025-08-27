// ===========================
// USER ANALYTICS SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import { UserAnalytics, AnalyticsResult } from '../types';
import { createIndex, createAnalyticsIndexMapping } from '../utils/elasticsearchUtils';

export default class UserAnalyticsService {
  private client: Client;
  private analyticsIndex: string;
  private logger: any;

  constructor(client: Client, analyticsIndex: string, logger: any) {
    this.client = client;
    this.analyticsIndex = analyticsIndex;
    this.logger = logger;
  }

  async initializeIndex(): Promise<boolean> {
    try {
      const mapping = createAnalyticsIndexMapping();
      await createIndex(this.client, this.analyticsIndex, mapping);
      this.logger.info('✅ User analytics index created successfully');
      return true;
    } catch (error: any) {
      if (error.message?.includes('resource_already_exists_exception')) {
        this.logger.info('ℹ️ User analytics index already exists');
        return true;
      }
      this.logger.error('❌ Error creating user analytics index:', error);
      return false;
    }
  }

  async trackUserAnalytics(analytics: UserAnalytics): Promise<AnalyticsResult> {
    try {
      await this.client.index({
        index: this.analyticsIndex,
        body: {
          ...analytics,
          session_start: analytics.session_start || new Date().toISOString()
        }
      });
      
      this.logger.info(`📈 User analytics tracked for user ${analytics.user_id}`);
      
      return {
        success: true,
        analyticsId: analytics.user_id
      };
    } catch (error) {
      this.logger.error('❌ Error tracking user analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUserAnalytics(userId: string, days: number = 30): Promise<UserAnalytics[]> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.analyticsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { range: { session_start: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          sort: [
            { session_start: { order: 'desc' } }
          ]
        }
      });

      return response.hits.hits.map(hit => hit._source as UserAnalytics);
    } catch (error) {
      this.logger.error('❌ Error getting user analytics:', error);
      return [];
    }
  }

  async getSessionAnalytics(sessionId: string): Promise<UserAnalytics | null> {
    try {
      const response = await this.client.search({
        index: this.analyticsIndex,
        body: {
          query: {
            term: { session_id: sessionId }
          }
        }
      });

      if (response.hits.hits.length > 0) {
        return response.hits.hits[0]._source as UserAnalytics;
      }
      return null;
    } catch (error) {
      this.logger.error('❌ Error getting session analytics:', error);
      return null;
    }
  }

  async updateSessionEnd(userId: string, sessionId: string, sessionEnd: string): Promise<boolean> {
    try {
      await this.client.updateByQuery({
        index: this.analyticsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { term: { session_id: sessionId } }
              ]
            }
          },
          script: {
            source: "ctx._source.session_end = params.session_end",
            lang: "painless",
            params: {
              session_end: sessionEnd
            }
          }
        }
      });

      this.logger.info(`📈 Session end updated for user ${userId}, session ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Error updating session end:', error);
      return false;
    }
  }

  async calculateBounceRate(userId: string, days: number = 30): Promise<number> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.analyticsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { range: { session_start: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          aggs: {
            total_sessions: {
              value_count: {
                field: "session_id"
              }
            },
            bounced_sessions: {
              filter: {
                term: { bounce_rate: true }
              }
            }
          }
        }
      });

      const totalSessions = response.aggregations?.total_sessions?.value || 0;
      const bouncedSessions = response.aggregations?.bounced_sessions?.doc_count || 0;

      return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
    } catch (error) {
      this.logger.error('❌ Error calculating bounce rate:', error);
      return 0;
    }
  }

  async getAverageSessionDuration(userId: string, days: number = 30): Promise<number> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.analyticsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { range: { session_start: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          aggs: {
            avg_duration: {
              avg: {
                field: "time_spent"
              }
            }
          }
        }
      });

      return response.aggregations?.avg_duration?.value || 0;
    } catch (error) {
      this.logger.error('❌ Error getting average session duration:', error);
      return 0;
    }
  }

  async getMostEngagedSections(userId: string, days: number = 30): Promise<Array<{section: string, time_spent: number}>> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.client.search({
        index: this.analyticsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { user_id: userId } },
                { range: { session_start: { gte: fromDate.toISOString() } } }
              ]
            }
          },
          aggs: {
            sections: {
              nested: {
                path: "sections_engaged"
              },
              aggs: {
                section_names: {
                  terms: {
                    field: "sections_engaged.key"
                  },
                  aggs: {
                    total_time: {
                      sum: {
                        field: "sections_engaged.time_spent"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const buckets = response.aggregations?.sections?.section_names?.buckets || [];
      return buckets.map(bucket => ({
        section: bucket.key,
        time_spent: bucket.total_time.value
      })).sort((a, b) => b.time_spent - a.time_spent);
    } catch (error) {
      this.logger.error('❌ Error getting most engaged sections:', error);
      return [];
    }
  }
}
