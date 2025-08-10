import { AnalyticsEventTypeType, AnalyticsEventProperties } from './enums';

// ===========================
// STANDARDIZED ANALYTICS TYPES
// ===========================

// Analytics User Interface
export interface AnalyticsUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  properties?: {
    registration_date?: string;
    subscription_type?: 'free' | 'premium' | 'lifetime';
    last_login?: string;
    trust_score?: number;
    verification_status?: 'unverified' | 'verified' | 'premium';
    user_type?: 'new' | 'returning';
    registration_method?: 'email' | 'google' | 'apple' | 'facebook';
  };
}

// Analytics Session Interface
export interface AnalyticsSession {
  id: string;
  start_time: string;
  duration?: number;
  page_views?: number;
  events_count?: number;
  last_activity?: string;
  session_source?: 'organic' | 'push_notification' | 'deep_link' | 'referral';
}

// Analytics Device Interface
export interface AnalyticsDevice {
  platform: 'ios' | 'android' | 'web' | 'desktop';
  version?: string;
  model?: string;
  screen_resolution?: string;
  app_version?: string;
  os_version?: string;
  browser?: string;
  user_agent?: string;
  device_id?: string;
  network_type?: 'wifi' | 'cellular' | 'none';
  battery_level?: number;
  memory_usage_mb?: number;
}

// Analytics Context Interface
export interface AnalyticsContext {
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  language?: string;
  timezone?: string;
  country?: string;
  city?: string;
  device_orientation?: 'portrait' | 'landscape';
  app_state?: 'foreground' | 'background' | 'terminated';
}

// Main Analytics Event Interface - Enhanced with Standardized Properties
export interface AnalyticsEvent {
  event_id: string;
  event_name: AnalyticsEventTypeType;
  event_timestamp: string;
  event_properties: AnalyticsEventProperties;
  user: AnalyticsUser;
  session: AnalyticsSession;
  device: AnalyticsDevice;
  context?: AnalyticsContext;
}

// ===========================
// EVENT TRACKING HELPERS
// ===========================

// Event Builder Interface
export interface EventBuilder {
  setEventName(name: AnalyticsEventTypeType): EventBuilder;
  setEventProperties(properties: AnalyticsEventProperties): EventBuilder;
  setUser(user: AnalyticsUser): EventBuilder;
  setSession(session: AnalyticsSession): EventBuilder;
  setDevice(device: AnalyticsDevice): EventBuilder;
  setContext(context: AnalyticsContext): EventBuilder;
  build(): AnalyticsEvent;
}

// Event Tracking Configuration
export interface EventTrackingConfig {
  enabled: boolean;
  sample_rate?: number; // 0-1, percentage of events to track
  batch_size?: number; // Number of events to batch before sending
  flush_interval_ms?: number; // How often to flush events
  max_queue_size?: number; // Maximum number of events in queue
  retry_attempts?: number; // Number of retry attempts for failed events
  retry_delay_ms?: number; // Delay between retry attempts
}

// Event Validation Result
export interface EventValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ===========================
// ANALYTICS METRICS INTERFACES
// ===========================

// User Engagement Metrics
export interface UserEngagementMetrics {
  user_id: string;
  session_count: number;
  total_session_duration: number;
  avg_session_duration: number;
  page_views_per_session: number;
  events_per_session: number;
  last_activity: string;
  engagement_score: number; // 0-100
}

// Feature Usage Metrics
export interface FeatureUsageMetrics {
  feature_name: string;
  usage_count: number;
  unique_users: number;
  avg_usage_per_user: number;
  success_rate: number; // 0-100
  error_rate: number; // 0-100
  avg_completion_time_ms: number;
}

// Performance Metrics
export interface PerformanceMetrics {
  metric_name: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  p95_value: number;
  p99_value: number;
  sample_count: number;
  timestamp: string;
}

// Business Metrics
export interface BusinessMetrics {
  metric_name: string;
  value: number;
  currency?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  timestamp: string;
  breakdown?: Record<string, number>;
} 