// ===========================
// USER BEHAVIOR QUERY SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import { 
  UserBehaviorStats, 
  PopularSections, 
  UserEngagementMetrics, 
  SearchAnalytics, 
  ListingInteractionMetrics, 
  DeviceAnalytics, 
  PerformanceMetrics,
  QueryResult 
} from '../types';
import { 
  executeAggregation, 
  buildDateRangeQuery, 
  buildUserQuery, 
  buildBoolQuery, 
  buildTermsAggregation, 
  buildDateHistogramAggregation, 
  buildCardinalityAggregation, 
  buildAvgAggregation, 
  buildPercentilesAggregation 
} from '../utils/elasticsearchUtils';

export default class UserBehaviorQueryService {
  private client: Client;
  private behaviorIndex: string;
  private logger: any;

  constructor(client: Client, behaviorIndex: string, logger: any) {
    this.client = client;
    this.behaviorIndex = behaviorIndex;
    this.logger = logger;
  }

  async getUserBehaviorStats(userId: string, days: number = 30): Promise<QueryResult<UserBehaviorStats>> {
    try {
      const query = {
        query: buildBoolQuery([
          buildUserQuery(userId),
          buildDateRangeQuery(days)
        ]),
        aggs: {
          event_types: buildTermsAggregation('event_type'),
          daily_activity: buildDateHistogramAggregation('timestamp'),
          screen_usage: buildTermsAggregation('event_data.screen_name')
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: UserBehaviorStats = {
        event_types: response.aggregations?.event_types?.buckets || [],
        daily_activity: response.aggregations?.daily_activity?.buckets || [],
        screen_usage: response.aggregations?.screen_usage?.buckets || []
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting user behavior stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { event_types: [], daily_activity: [], screen_usage: [] }
      };
    }
  }

  async getPopularSections(days: number = 7): Promise<QueryResult<PopularSections>> {
    try {
      const query = {
        query: buildDateRangeQuery(days),
        aggs: {
          popular_sections: buildTermsAggregation('event_data.section_name', 10),
          event_types: buildTermsAggregation('event_type'),
          time_distribution: buildDateHistogramAggregation('timestamp', 'hour')
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: PopularSections = {
        popular_sections: response.aggregations?.popular_sections?.buckets || [],
        event_types: response.aggregations?.event_types?.buckets || [],
        time_distribution: response.aggregations?.time_distribution?.buckets || []
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting popular sections:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { popular_sections: [], event_types: [], time_distribution: [] }
      };
    }
  }

  async getUserEngagementMetrics(days: number = 30): Promise<QueryResult<UserEngagementMetrics>> {
    try {
      const query = {
        query: buildDateRangeQuery(days),
        aggs: {
          total_users: buildCardinalityAggregation('user_id'),
          active_users: buildCardinalityAggregation('user_id'),
          average_session_duration: buildAvgAggregation('event_data.time_spent'),
          bounce_rate: {
            filter: {
              term: { 'event_data.bounce_rate': true }
            }
          },
          pages_per_session: buildAvgAggregation('event_data.page_views'),
          conversion_rate: {
            filter: {
              terms: { 
                'event_type': ['FORM_SUBMIT', 'OFFER_SENT', 'MESSAGE_SENT'] 
              }
            }
          }
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: UserEngagementMetrics = {
        total_users: response.aggregations?.total_users?.value || 0,
        active_users: response.aggregations?.active_users?.value || 0,
        average_session_duration: response.aggregations?.average_session_duration?.value || 0,
        bounce_rate: response.aggregations?.bounce_rate?.doc_count || 0,
        pages_per_session: response.aggregations?.pages_per_session?.value || 0,
        conversion_rate: response.aggregations?.conversion_rate?.doc_count || 0
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting user engagement metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          total_users: 0,
          active_users: 0,
          average_session_duration: 0,
          bounce_rate: 0,
          pages_per_session: 0,
          conversion_rate: 0
        }
      };
    }
  }

  async getSearchAnalytics(days: number = 30): Promise<QueryResult<SearchAnalytics>> {
    try {
      const query = {
        query: buildBoolQuery([
          buildDateRangeQuery(days),
          { term: { event_type: 'search' } }
        ]),
        aggs: {
          popular_terms: buildTermsAggregation('event_data.search_term', 20),
          search_volume: buildDateHistogramAggregation('timestamp'),
          no_results_rate: {
            filter: {
              term: { 'event_data.no_results': true }
            }
          },
          average_results_clicked: buildAvgAggregation('event_data.results_clicked')
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: SearchAnalytics = {
        popular_terms: response.aggregations?.popular_terms?.buckets || [],
        search_volume: response.aggregations?.search_volume?.buckets || [],
        no_results_rate: response.aggregations?.no_results_rate?.doc_count || 0,
        average_results_clicked: response.aggregations?.average_results_clicked?.value || 0
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting search analytics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { popular_terms: [], search_volume: [], no_results_rate: 0, average_results_clicked: 0 }
      };
    }
  }

  async getListingInteractionMetrics(days: number = 30): Promise<QueryResult<ListingInteractionMetrics>> {
    try {
      const query = {
        query: buildDateRangeQuery(days),
        aggs: {
          most_viewed_listings: buildTermsAggregation('event_data.listing_id', 20),
          favorite_actions: {
            filter: {
              term: { event_type: 'FAVORITE_ADDED' }
            }
          },
          offer_actions: {
            filter: {
              term: { event_type: 'OFFER_SENT' }
            }
          },
          message_actions: {
            filter: {
              term: { event_type: 'MESSAGE_SENT' }
            }
          }
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: ListingInteractionMetrics = {
        most_viewed_listings: response.aggregations?.most_viewed_listings?.buckets || [],
        favorite_actions: response.aggregations?.favorite_actions?.buckets || [],
        offer_actions: response.aggregations?.offer_actions?.buckets || [],
        message_actions: response.aggregations?.message_actions?.buckets || []
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting listing interaction metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { most_viewed_listings: [], favorite_actions: [], offer_actions: [], message_actions: [] }
      };
    }
  }

  async getDeviceAnalytics(days: number = 30): Promise<QueryResult<DeviceAnalytics>> {
    try {
      const query = {
        query: buildDateRangeQuery(days),
        aggs: {
          platform_usage: buildTermsAggregation('device_info.platform'),
          browser_usage: buildTermsAggregation('device_info.browser'),
          screen_resolutions: buildTermsAggregation('device_info.screen_resolution', 20)
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: DeviceAnalytics = {
        platform_usage: response.aggregations?.platform_usage?.buckets || [],
        browser_usage: response.aggregations?.browser_usage?.buckets || [],
        screen_resolutions: response.aggregations?.screen_resolutions?.buckets || []
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting device analytics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { platform_usage: [], browser_usage: [], screen_resolutions: [] }
      };
    }
  }

  async getPerformanceMetrics(days: number = 30): Promise<QueryResult<PerformanceMetrics>> {
    try {
      const query = {
        query: buildBoolQuery([
          buildDateRangeQuery(days),
          { term: { event_type: 'performance' } }
        ]),
        aggs: {
          page_load_times: buildPercentilesAggregation('event_data.load_time'),
          error_rates: buildTermsAggregation('event_data.error_type'),
          api_response_times: buildPercentilesAggregation('event_data.api_response_time')
        },
        size: 0
      };

      const response = await executeAggregation(this.client, this.behaviorIndex, query);

      const data: PerformanceMetrics = {
        page_load_times: response.aggregations?.page_load_times?.buckets || [],
        error_rates: response.aggregations?.error_rates?.buckets || [],
        api_response_times: response.aggregations?.api_response_times?.buckets || []
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('❌ Error getting performance metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { page_load_times: [], error_rates: [], api_response_times: [] }
      };
    }
  }
}
