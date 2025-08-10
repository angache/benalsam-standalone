// ===========================
// STATUS ENUMS
// ===========================
export const MessageStatus = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read'
};
export const PremiumSubscriptionStatus = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    PENDING: 'pending'
};
export const ProfileStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};
export const ReportStatus = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
};
export const ListingStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    REJECTED: 'REJECTED',
    SOLD: 'SOLD',
    DELETED: 'DELETED',
    EXPIRED: 'EXPIRED'
};
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
};
//# sourceMappingURL=enums.js.map