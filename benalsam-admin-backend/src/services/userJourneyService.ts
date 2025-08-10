import { elasticsearchClient } from './elasticsearchService';
import logger from '../config/logger';

export interface UserJourneyEvent {
  userId: string;
  sessionId: string;
  eventType: 'page_view' | 'click' | 'form_submit' | 'conversion' | 'drop_off';
  page: string;
  timestamp: string;
  metadata: {
    referrer?: string;
    userAgent?: string;
    deviceType?: string;
    duration?: number;
    scrollDepth?: number;
    clicks?: number;
    formFields?: string[];
    conversionValue?: number;
    dropOffReason?: string;
  };
}

export interface UserJourneyMetrics {
  totalUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  conversionRate: number;
  dropOffRate: number;
  engagementScore: number;
  topPages: Array<{ page: string; views: number; conversionRate: number }>;
  userFlow: Array<{ from: string; to: string; count: number; conversionRate: number }>;
}

export class UserJourneyService {
  private readonly indexName = 'user_journey_events';

  constructor() {
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      const indexExists = await elasticsearchClient.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        await elasticsearchClient.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                userId: { type: 'keyword' },
                sessionId: { type: 'keyword' },
                eventType: { type: 'keyword' },
                page: { type: 'keyword' },
                timestamp: { type: 'date' },
                metadata: {
                  properties: {
                    referrer: { type: 'keyword' },
                    userAgent: { type: 'text' },
                    deviceType: { type: 'keyword' },
                    duration: { type: 'long' },
                    scrollDepth: { type: 'float' },
                    clicks: { type: 'long' },
                    formFields: { type: 'keyword' },
                    conversionValue: { type: 'float' },
                    dropOffReason: { type: 'keyword' }
                  }
                }
              }
            }
          }
        });
        logger.info(`✅ User journey index created: ${this.indexName}`);
      }
    } catch (error) {
      logger.error('Failed to initialize user journey index:', error);
    }
  }

  async trackEvent(event: UserJourneyEvent): Promise<boolean> {
    try {
      await elasticsearchClient.index({
        index: this.indexName,
        body: event
      });

      logger.info(`✅ User journey event tracked: ${event.eventType} for user ${event.userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to track user journey event:', error);
      return false;
    }
  }

  async getJourneyMetrics(days: number = 7): Promise<UserJourneyMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total users and sessions
      const userStats = await elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            unique_users: {
              cardinality: {
                field: 'userId'
              }
            },
            unique_sessions: {
              cardinality: {
                field: 'sessionId'
              }
            }
          }
        }
      });

      // Session duration
      const sessionDuration = await elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            session_duration: {
              terms: {
                field: 'sessionId',
                size: 10000
              },
              aggs: {
                duration_stats: {
                  stats: {
                    field: 'metadata.duration'
                  }
                }
              }
            }
          }
        }
      });

      // Conversion and drop-off rates
      const conversionStats = await elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            event_types: {
              terms: {
                field: 'eventType'
              }
            }
          }
        }
      });

      // Top pages
      const topPages = await elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            pages: {
              terms: {
                field: 'page',
                size: 10
              },
              aggs: {
                conversion_rate: {
                  filter: {
                    term: {
                      eventType: 'conversion'
                    }
                  }
                }
              }
            }
          }
        }
      });

      // User flow
      const userFlow = await this.getUserFlow(startDate);

      const totalUsers = (userStats as any).aggregations?.unique_users?.value || 0;
      const totalSessions = (userStats as any).aggregations?.unique_sessions?.value || 0;
      
      const conversionEvents = (conversionStats as any).aggregations?.event_types?.buckets?.find(
        (b: any) => b.key === 'conversion'
      )?.doc_count || 0;
      const dropOffEvents = (conversionStats as any).aggregations?.event_types?.buckets?.find(
        (b: any) => b.key === 'drop_off'
      )?.doc_count || 0;

      const avgSessionDuration = this.calculateAverageSessionDuration(sessionDuration);
      const conversionRate = totalSessions > 0 ? (conversionEvents / totalSessions) * 100 : 0;
      const dropOffRate = totalSessions > 0 ? (dropOffEvents / totalSessions) * 100 : 0;
      const engagementScore = this.calculateEngagementScore(conversionRate, dropOffRate, avgSessionDuration);

      return {
        totalUsers,
        totalSessions,
        avgSessionDuration,
        conversionRate,
        dropOffRate,
        engagementScore,
        topPages: this.formatTopPages(topPages),
        userFlow
      };
    } catch (error) {
      logger.error('Failed to get user journey metrics:', error);
      throw error;
    }
  }

  private async getUserFlow(startDate: Date): Promise<Array<{ from: string; to: string; count: number; conversionRate: number }>> {
    try {
      const response = await elasticsearchClient.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: startDate.toISOString()
              }
            }
          },
          aggs: {
            sessions: {
              terms: {
                field: 'sessionId',
                size: 1000
              },
              aggs: {
                page_sequence: {
                  date_histogram: {
                    field: 'timestamp',
                    calendar_interval: '1m'
                  },
                  aggs: {
                    pages: {
                      terms: {
                        field: 'page',
                        size: 1
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Process user flow from session data
      const flow: { [key: string]: { [key: string]: number } } = {};
      
      (response as any).aggregations?.sessions?.buckets?.forEach((session: any) => {
        const pages = session.page_sequence.buckets
          .map((bucket: any) => bucket.pages.buckets[0]?.key)
          .filter(Boolean);

        for (let i = 0; i < pages.length - 1; i++) {
          const from = pages[i];
          const to = pages[i + 1];
          const key = `${from}->${to}`;
          
          if (!flow[key]) {
            flow[key] = { count: 0, conversions: 0 };
          }
          flow[key].count++;
        }
      });

      return Object.entries(flow).map(([key, data]) => {
        const [from, to] = key.split('->');
        return {
          from,
          to,
          count: data.count,
          conversionRate: 0 // Would need additional logic to calculate
        };
      }).sort((a, b) => b.count - a.count).slice(0, 10);
    } catch (error) {
      logger.error('Failed to get user flow:', error);
      return [];
    }
  }

  private calculateAverageSessionDuration(sessionDuration: any): number {
    try {
      const sessions = (sessionDuration as any).aggregations?.session_duration?.buckets || [];
      const totalDuration = sessions.reduce((sum: number, session: any) => {
        return sum + (session.duration_stats.avg || 0);
      }, 0);
      return sessions.length > 0 ? totalDuration / sessions.length : 0;
    } catch (error) {
      logger.error('Failed to calculate average session duration:', error);
      return 0;
    }
  }

  private calculateEngagementScore(conversionRate: number, dropOffRate: number, avgSessionDuration: number): number {
    // Simple engagement score calculation
    const conversionScore = Math.min(conversionRate / 10, 1) * 40; // Max 40 points
    const dropOffScore = Math.max(0, (100 - dropOffRate) / 100) * 30; // Max 30 points
    const durationScore = Math.min(avgSessionDuration / 300, 1) * 30; // Max 30 points (5 minutes)
    
    return conversionScore + dropOffScore + durationScore;
  }

  private formatTopPages(topPages: any): Array<{ page: string; views: number; conversionRate: number }> {
    try {
      return (topPages as any).aggregations?.pages?.buckets?.map((bucket: any) => ({
        page: bucket.key,
        views: bucket.doc_count,
        conversionRate: bucket.conversion_rate.doc_count > 0 ? 
          (bucket.conversion_rate.doc_count / bucket.doc_count) * 100 : 0
      })) || [];
    } catch (error) {
      logger.error('Failed to format top pages:', error);
      return [];
    }
  }

  async getOptimizationRecommendations(metrics: UserJourneyMetrics): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.conversionRate < 15) {
      recommendations.push('🚨 Conversion rate çok düşük! Funnel optimization gerekli.');
    } else if (metrics.conversionRate < 25) {
      recommendations.push('⚠️ Conversion rate iyileştirilebilir. A/B testing yapılmalı.');
    }

    if (metrics.dropOffRate > 30) {
      recommendations.push('🚨 Drop-off rate çok yüksek! User experience iyileştirmesi gerekli.');
    } else if (metrics.dropOffRate > 20) {
      recommendations.push('⚠️ Drop-off rate dikkat edilmeli. Exit page analizi yapılmalı.');
    }

    if (metrics.avgSessionDuration < 120) {
      recommendations.push('⚠️ Session duration kısa. Content engagement artırılmalı.');
    }

    if (metrics.engagementScore < 50) {
      recommendations.push('🚨 Engagement score düşük! Kullanıcı deneyimi gözden geçirilmeli.');
    }

    return recommendations;
  }
}

export default new UserJourneyService(); 