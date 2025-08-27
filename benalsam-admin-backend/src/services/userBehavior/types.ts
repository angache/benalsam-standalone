// ===========================
// USER BEHAVIOR SERVICE TYPES
// ===========================

import { Client } from '@elastic/elasticsearch';

export interface UserBehaviorEvent {
  user_id?: string;
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
  time_spent: number;
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

export interface UserBehaviorStats {
  event_types: Array<{
    key: string;
    doc_count: number;
  }>;
  daily_activity: Array<{
    key_as_string: string;
    doc_count: number;
  }>;
  screen_usage: Array<{
    key: string;
    doc_count: number;
  }>;
}

export interface PopularSections {
  popular_sections: Array<{
    key: string;
    doc_count: number;
  }>;
  event_types: Array<{
    key: string;
    doc_count: number;
  }>;
  time_distribution: Array<{
    key_as_string: string;
    doc_count: number;
  }>;
}

export interface UserEngagementMetrics {
  total_users: number;
  active_users: number;
  average_session_duration: number;
  bounce_rate: number;
  pages_per_session: number;
  conversion_rate: number;
}

export interface SearchAnalytics {
  popular_terms: Array<{
    key: string;
    doc_count: number;
  }>;
  search_volume: Array<{
    key_as_string: string;
    doc_count: number;
  }>;
  no_results_rate: number;
  average_results_clicked: number;
}

export interface ListingInteractionMetrics {
  most_viewed_listings: Array<{
    key: string;
    doc_count: number;
  }>;
  favorite_actions: Array<{
    key: string;
    doc_count: number;
  }>;
  offer_actions: Array<{
    key: string;
    doc_count: number;
  }>;
  message_actions: Array<{
    key: string;
    doc_count: number;
  }>;
}

export interface DeviceAnalytics {
  platform_usage: Array<{
    key: string;
    doc_count: number;
  }>;
  browser_usage: Array<{
    key: string;
    doc_count: number;
  }>;
  screen_resolutions: Array<{
    key: string;
    doc_count: number;
  }>;
}

export interface PerformanceMetrics {
  page_load_times: Array<{
    key: string;
    doc_count: number;
  }>;
  error_rates: Array<{
    key: string;
    doc_count: number;
  }>;
  api_response_times: Array<{
    key: string;
    doc_count: number;
  }>;
}

export interface ElasticsearchConfig {
  node: string;
  username?: string;
  password?: string;
  behaviorIndex: string;
  analyticsIndex: string;
}

export interface UserBehaviorServiceConfig {
  elasticsearch: ElasticsearchConfig;
  logger: any;
}

export interface TrackingResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface AnalyticsResult {
  success: boolean;
  analyticsId?: string;
  error?: string;
}

export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IndexMapping {
  properties: Record<string, any>;
  settings?: Record<string, any>;
}

export interface AggregationQuery {
  query?: Record<string, any>;
  aggs: Record<string, any>;
  size?: number;
  from?: number;
  sort?: Array<Record<string, any>>;
}
