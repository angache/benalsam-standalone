import { AnalyticsEventTypeType, AnalyticsEventProperties } from './enums';
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
export interface AnalyticsSession {
    id: string;
    start_time: string;
    duration?: number;
    page_views?: number;
    events_count?: number;
    last_activity?: string;
    session_source?: 'organic' | 'push_notification' | 'deep_link' | 'referral';
}
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
export interface EventBuilder {
    setEventName(name: AnalyticsEventTypeType): EventBuilder;
    setEventProperties(properties: AnalyticsEventProperties): EventBuilder;
    setUser(user: AnalyticsUser): EventBuilder;
    setSession(session: AnalyticsSession): EventBuilder;
    setDevice(device: AnalyticsDevice): EventBuilder;
    setContext(context: AnalyticsContext): EventBuilder;
    build(): AnalyticsEvent;
}
export interface EventTrackingConfig {
    enabled: boolean;
    sample_rate?: number;
    batch_size?: number;
    flush_interval_ms?: number;
    max_queue_size?: number;
    retry_attempts?: number;
    retry_delay_ms?: number;
}
export interface EventValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface UserEngagementMetrics {
    user_id: string;
    session_count: number;
    total_session_duration: number;
    avg_session_duration: number;
    page_views_per_session: number;
    events_per_session: number;
    last_activity: string;
    engagement_score: number;
}
export interface FeatureUsageMetrics {
    feature_name: string;
    usage_count: number;
    unique_users: number;
    avg_usage_per_user: number;
    success_rate: number;
    error_rate: number;
    avg_completion_time_ms: number;
}
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
export interface BusinessMetrics {
    metric_name: string;
    value: number;
    currency?: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    timestamp: string;
    breakdown?: Record<string, number>;
}
//# sourceMappingURL=analytics.d.ts.map