export type IconType = any;
export declare const MessageStatus: {
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
};
export type MessageStatusType = typeof MessageStatus[keyof typeof MessageStatus];
export declare const PremiumSubscriptionStatus: {
    readonly ACTIVE: "active";
    readonly CANCELLED: "cancelled";
    readonly EXPIRED: "expired";
    readonly PENDING: "pending";
};
export type PremiumSubscriptionStatusType = typeof PremiumSubscriptionStatus[keyof typeof PremiumSubscriptionStatus];
export declare const ProfileStatus: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
};
export type ProfileStatusType = typeof ProfileStatus[keyof typeof ProfileStatus];
export declare const ReportStatus: {
    readonly PENDING: "pending";
    readonly REVIEWED: "reviewed";
    readonly RESOLVED: "resolved";
    readonly DISMISSED: "dismissed";
};
export type ReportStatusType = typeof ReportStatus[keyof typeof ReportStatus];
export declare const ListingStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly PENDING_APPROVAL: "PENDING_APPROVAL";
    readonly REJECTED: "REJECTED";
    readonly SOLD: "SOLD";
    readonly DELETED: "DELETED";
    readonly EXPIRED: "EXPIRED";
};
export type ListingStatusType = typeof ListingStatus[keyof typeof ListingStatus];
export declare const AnalyticsEventType: {
    readonly PAGE_VIEW: "page_view";
    readonly SCREEN_VIEW: "screen_view";
    readonly BUTTON_CLICK: "button_click";
    readonly FORM_SUBMIT: "form_submit";
    readonly SEARCH: "search";
    readonly LISTING_VIEW: "listing_view";
    readonly LISTING_CREATE: "listing_create";
    readonly LISTING_EDIT: "listing_edit";
    readonly LISTING_DELETE: "listing_delete";
    readonly OFFER_SENT: "offer_sent";
    readonly OFFER_ACCEPTED: "offer_accepted";
    readonly OFFER_REJECTED: "offer_rejected";
    readonly MESSAGE_SENT: "message_sent";
    readonly MESSAGE_READ: "message_read";
    readonly FAVORITE_ADDED: "favorite_added";
    readonly FAVORITE_REMOVED: "favorite_removed";
    readonly SHARE: "share";
    readonly SCROLL: "scroll";
    readonly TAP: "tap";
    readonly SWIPE: "swipe";
    readonly APP_LOAD: "app_load";
    readonly APP_START: "app_start";
    readonly SCREEN_LOAD: "screen_load";
    readonly API_CALL: "api_call";
    readonly API_SUCCESS: "api_success";
    readonly API_ERROR: "api_error";
    readonly ERROR_OCCURRED: "error_occurred";
    readonly CRASH: "crash";
    readonly MEMORY_WARNING: "memory_warning";
    readonly BATTERY_LOW: "battery_low";
    readonly NETWORK_CHANGE: "network_change";
    readonly USER_REGISTERED: "user_registered";
    readonly USER_LOGGED_IN: "user_logged_in";
    readonly USER_LOGGED_OUT: "user_logged_out";
    readonly USER_PROFILE_UPDATED: "user_profile_updated";
    readonly PREMIUM_UPGRADED: "premium_upgraded";
    readonly PREMIUM_CANCELLED: "premium_cancelled";
    readonly PAYMENT_COMPLETED: "payment_completed";
    readonly PAYMENT_FAILED: "payment_failed";
    readonly SUBSCRIPTION_RENEWED: "subscription_renewed";
    readonly SUBSCRIPTION_EXPIRED: "subscription_expired";
    readonly NOTIFICATION_RECEIVED: "notification_received";
    readonly NOTIFICATION_OPENED: "notification_opened";
    readonly PUSH_ENABLED: "push_enabled";
    readonly PUSH_DISABLED: "push_disabled";
    readonly DEEP_LINK_OPENED: "deep_link_opened";
    readonly APP_OPENED_FROM_BACKGROUND: "app_opened_from_background";
    readonly FILTER_APPLIED: "filter_applied";
    readonly SORT_CHANGED: "sort_changed";
    readonly CATEGORY_SELECTED: "category_selected";
    readonly LOCATION_SELECTED: "location_selected";
    readonly IMAGE_UPLOADED: "image_uploaded";
    readonly IMAGE_DELETED: "image_deleted";
    readonly CONTACT_SHOWN: "contact_shown";
    readonly REPORT_SUBMITTED: "report_submitted";
    readonly FEEDBACK_SUBMITTED: "feedback_submitted";
};
export type AnalyticsEventTypeType = typeof AnalyticsEventType[keyof typeof AnalyticsEventType];
export interface CoreEventProperties {
    page_name?: string;
    screen_name?: string;
    section_name?: string;
    tab_name?: string;
    button_name?: string;
    button_id?: string;
    button_type?: 'primary' | 'secondary' | 'tertiary';
    button_location?: string;
    form_name?: string;
    form_id?: string;
    field_name?: string;
    field_type?: string;
    validation_errors?: string[];
    search_query?: string;
    search_filters?: Record<string, any>;
    search_results_count?: number;
    search_time_ms?: number;
    listing_id?: string;
    listing_category?: string;
    listing_price?: number;
    listing_location?: string;
    listing_status?: string;
    message_id?: string;
    offer_id?: string;
    recipient_id?: string;
    message_type?: 'text' | 'image' | 'offer';
    scroll_depth?: number;
    scroll_direction?: 'up' | 'down' | 'left' | 'right';
    swipe_direction?: 'up' | 'down' | 'left' | 'right';
    scroll_time_ms?: number;
}
export interface PerformanceEventProperties {
    app_start_time_ms?: number;
    app_load_time_ms?: number;
    cold_start?: boolean;
    screen_load_time_ms?: number;
    screen_name?: string;
    api_endpoint?: string;
    api_method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    api_response_time_ms?: number;
    api_status_code?: number;
    api_error_message?: string;
    error_type?: string;
    error_message?: string;
    error_stack?: string;
    error_context?: Record<string, any>;
    memory_usage_mb?: number;
    battery_level?: number;
    network_type?: 'wifi' | 'cellular' | 'none';
    network_speed?: string;
}
export interface BusinessEventProperties {
    user_id?: string;
    user_type?: 'new' | 'returning';
    registration_method?: 'email' | 'google' | 'apple' | 'facebook';
    subscription_plan?: 'free' | 'premium' | 'lifetime';
    subscription_price?: number;
    subscription_currency?: string;
    subscription_duration?: number;
    payment_method?: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
    payment_amount?: number;
    payment_currency?: string;
    payment_status?: 'success' | 'failed' | 'pending';
    transaction_id?: string;
}
export interface EngagementEventProperties {
    notification_type?: 'push' | 'email' | 'sms';
    notification_title?: string;
    notification_category?: string;
    deep_link_url?: string;
    deep_link_source?: string;
    filter_type?: string;
    filter_values?: Record<string, any>;
    sort_type?: string;
    category_id?: string;
    category_name?: string;
    location_type?: 'current' | 'selected' | 'saved';
    location_coordinates?: {
        lat: number;
        lng: number;
    };
}
export interface AnalyticsEventProperties extends CoreEventProperties, PerformanceEventProperties, BusinessEventProperties, EngagementEventProperties {
    [key: string]: any;
}
//# sourceMappingURL=enums.d.ts.map