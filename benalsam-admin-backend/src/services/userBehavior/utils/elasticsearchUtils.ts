// ===========================
// ELASTICSEARCH UTILITIES
// ===========================

import { Client } from '@elastic/elasticsearch';
import { IndexMapping, AggregationQuery } from '../types';

export const createBehaviorIndexMapping = (): IndexMapping => ({
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
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
});

export const createAnalyticsIndexMapping = (): IndexMapping => ({
  properties: {
    user_id: { type: 'keyword' },
    screen_name: { type: 'keyword' },
    scroll_depth: { type: 'integer' },
    time_spent: { type: 'integer' },
    sections_engaged: { type: 'object' },
    session_start: { type: 'date' },
    session_end: { type: 'date' },
    bounce_rate: { type: 'boolean' }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
});

export const createIndex = async (
  client: Client, 
  indexName: string, 
  mapping: IndexMapping
): Promise<boolean> => {
  try {
    await client.indices.create({
      index: indexName,
      body: {
        mappings: mapping.properties,
        settings: mapping.settings
      }
    });
    return true;
  } catch (error: any) {
    if (error.message?.includes('resource_already_exists_exception')) {
      return true;
    }
    throw error;
  }
};

export const executeAggregation = async (
  client: Client,
  indexName: string,
  query: AggregationQuery
): Promise<any> => {
  try {
    const response = await client.search({
      index: indexName,
      body: query
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const buildDateRangeQuery = (days: number = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  return {
    range: { 
      timestamp: { 
        gte: fromDate.toISOString() 
      } 
    }
  };
};

export const buildUserQuery = (userId: string) => ({
  term: { user_id: userId }
});

export const buildBoolQuery = (must: any[] = [], should: any[] = [], must_not: any[] = []) => ({
  bool: {
    must,
    should,
    must_not
  }
});

export const buildTermsAggregation = (field: string, size: number = 10) => ({
  terms: { 
    field: `${field}.keyword`, 
    size 
  }
});

export const buildDateHistogramAggregation = (field: string, interval: string = 'day') => ({
  date_histogram: {
    field,
    calendar_interval: interval,
    format: 'yyyy-MM-dd'
  }
});

export const buildCardinalityAggregation = (field: string) => ({
  cardinality: {
    field: `${field}.keyword`
  }
});

export const buildAvgAggregation = (field: string) => ({
  avg: {
    field
  }
});

export const buildPercentilesAggregation = (field: string, percents: number[] = [1, 5, 25, 50, 75, 95, 99]) => ({
  percentiles: {
    field,
    percents
  }
});
