// Icon type for both React Native and Web
export type IconType = any; // Will be replaced with proper icon type based on platform

// ===========================
// STATUS ENUMS
// ===========================

export const MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
} as const;

export type MessageStatusType = typeof MessageStatus[keyof typeof MessageStatus];

export const PremiumSubscriptionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending'
} as const;

export type PremiumSubscriptionStatusType = typeof PremiumSubscriptionStatus[keyof typeof PremiumSubscriptionStatus];

export const ProfileStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export type ProfileStatusType = typeof ProfileStatus[keyof typeof ProfileStatus];

export const ReportStatus = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
} as const;

export type ReportStatusType = typeof ReportStatus[keyof typeof ReportStatus];

export const ListingStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_APPROVAL: 'pending_approval',
  REJECTED: 'rejected',
  SOLD: 'sold',
  DELETED: 'deleted',
  EXPIRED: 'expired'
} as const;

export type ListingStatusType = typeof ListingStatus[keyof typeof ListingStatus];

// Admin-specific listing status (farklı değerler)
export const AdminListingStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REJECTED: 'REJECTED',
  SOLD: 'SOLD',
  EXPIRED: 'EXPIRED'
} as const;

export type AdminListingStatusType = typeof AdminListingStatus[keyof typeof AdminListingStatus];

// ===========================
// ANALYTICS EVENT TYPES - STANDARDIZED
// ===========================

export const AnalyticsEventType = {
  // ===== CORE EVENTS =====
  PAGE_VIEW: 'page_view',
  SCREEN_VIEW: 'screen_view',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  SEARCH: 'search',
  LISTING_VIEW: 'listing_view',
  LISTING_CREATE: 'listing_create',
  LISTING_EDIT: 'listing_edit',
  LISTING_DELETE: 'listing_delete',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',
  SHARE: 'share',
  SCROLL: 'scroll',
  TAP: 'tap',
  SWIPE: 'swipe',
  
  // ===== PERFORMANCE EVENTS =====
  APP_LOAD: 'app_load',
  APP_START: 'app_start',
  SCREEN_LOAD: 'screen_load',
  API_CALL: 'api_call',
  API_SUCCESS: 'api_success',
  API_ERROR: 'api_error',
  ERROR_OCCURRED: 'error_occurred',
  CRASH: 'crash',
  MEMORY_WARNING: 'memory_warning',
  BATTERY_LOW: 'battery_low',
  NETWORK_CHANGE: 'network_change',
  
  // ===== BUSINESS EVENTS =====
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  PREMIUM_UPGRADED: 'premium_upgraded',
  PREMIUM_CANCELLED: 'premium_cancelled',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  
  // ===== ENGAGEMENT EVENTS =====
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  PUSH_ENABLED: 'push_enabled',
  PUSH_DISABLED: 'push_disabled',
  DEEP_LINK_OPENED: 'deep_link_opened',
  APP_OPENED_FROM_BACKGROUND: 'app_opened_from_background',
  
  // ===== FEATURE USAGE EVENTS =====
  FILTER_APPLIED: 'filter_applied',
  SORT_CHANGED: 'sort_changed',
  CATEGORY_SELECTED: 'category_selected',
  LOCATION_SELECTED: 'location_selected',
  IMAGE_UPLOADED: 'image_uploaded',
  IMAGE_DELETED: 'image_deleted',
  CONTACT_SHOWN: 'contact_shown',
  REPORT_SUBMITTED: 'report_submitted',
  FEEDBACK_SUBMITTED: 'feedback_submitted'
} as const;

export type AnalyticsEventTypeType = typeof AnalyticsEventType[keyof typeof AnalyticsEventType];

// ===========================
// EVENT PROPERTY STANDARDS
// ===========================

// Core Event Properties
export interface CoreEventProperties {
  // Page/Screen Events
  page_name?: string;
  screen_name?: string;
  section_name?: string;
  tab_name?: string;
  
  // Button/Interaction Events
  button_name?: string;
  button_id?: string;
  button_type?: 'primary' | 'secondary' | 'tertiary';
  button_location?: string;
  
  // Form Events
  form_name?: string;
  form_id?: string;
  field_name?: string;
  field_type?: string;
  validation_errors?: string[];
  
  // Search Events
  search_query?: string;
  search_filters?: Record<string, any>;
  search_results_count?: number;
  search_time_ms?: number;
  
  // Listing Events
  listing_id?: string;
  listing_category?: string;
  listing_price?: number;
  listing_location?: string;
  listing_status?: string;
  
  // Message/Offer Events
  message_id?: string;
  offer_id?: string;
  recipient_id?: string;
  message_type?: 'text' | 'image' | 'offer';
  
  // Scroll/Swipe Events
  scroll_depth?: number;
  scroll_direction?: 'up' | 'down' | 'left' | 'right';
  swipe_direction?: 'up' | 'down' | 'left' | 'right';
  scroll_time_ms?: number;
}

// Performance Event Properties
export interface PerformanceEventProperties {
  // App Load Events
  app_start_time_ms?: number;
  app_load_time_ms?: number;
  cold_start?: boolean;
  
  // Screen Load Events
  screen_load_time_ms?: number;
  screen_name?: string;
  
  // API Events
  api_endpoint?: string;
  api_method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  api_response_time_ms?: number;
  api_status_code?: number;
  api_error_message?: string;
  
  // Error Events
  error_type?: string;
  error_message?: string;
  error_stack?: string;
  error_context?: Record<string, any>;
  
  // System Events
  memory_usage_mb?: number;
  battery_level?: number;
  network_type?: 'wifi' | 'cellular' | 'none';
  network_speed?: string;
}

// Business Event Properties
export interface BusinessEventProperties {
  // User Events
  user_id?: string;
  user_type?: 'new' | 'returning';
  registration_method?: 'email' | 'google' | 'apple' | 'facebook';
  
  // Subscription Events
  subscription_plan?: 'free' | 'premium' | 'lifetime';
  subscription_price?: number;
  subscription_currency?: string;
  subscription_duration?: number;
  
  // Payment Events
  payment_method?: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  payment_amount?: number;
  payment_currency?: string;
  payment_status?: 'success' | 'failed' | 'pending';
  transaction_id?: string;
}

// Engagement Event Properties
export interface EngagementEventProperties {
  // Notification Events
  notification_type?: 'push' | 'email' | 'sms';
  notification_title?: string;
  notification_category?: string;
  
  // Deep Link Events
  deep_link_url?: string;
  deep_link_source?: string;
  
  // Feature Events
  filter_type?: string;
  filter_values?: Record<string, any>;
  sort_type?: string;
  category_id?: string;
  category_name?: string;
  location_type?: 'current' | 'selected' | 'saved';
  location_coordinates?: { lat: number; lng: number };
}

// Combined Event Properties Interface
export interface AnalyticsEventProperties {
  [key: string]: any;
} 