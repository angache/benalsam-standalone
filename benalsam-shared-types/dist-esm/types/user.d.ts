import { ProfileStatusType, PremiumSubscriptionStatusType, ReportStatusType } from './enums';
import { Listing } from './listing';
export interface User {
    id: string;
    email?: string;
    username?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
    app_metadata?: {
        provider?: string;
        [key: string]: any;
    };
    user_metadata?: {
        [key: string]: any;
    };
    aud?: string;
    role?: string;
}
export interface UserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    phone_number: string | null;
    platform_preferences: PlatformPreferences;
    notification_preferences: NotificationPreferences;
    chat_preferences: ChatPreferences;
    created_at: string;
    updated_at: string;
    status?: ProfileStatusType;
}
export interface PremiumSubscription {
    id: string;
    user_id: string;
    plan_type: 'monthly' | 'yearly' | 'lifetime';
    status: PremiumSubscriptionStatusType;
    start_date: string;
    end_date?: string;
    auto_renew: boolean;
    payment_method?: string;
    amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
    user?: UserProfile;
}
export interface ListingReport {
    id: string;
    listing_id: string;
    reporter_id: string;
    report_type: 'inappropriate' | 'spam' | 'fake' | 'duplicate' | 'other';
    reason: string;
    status: ReportStatusType;
    admin_notes?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
    listing?: Listing;
    reporter?: UserProfile;
}
export interface UserActivity {
    id: string;
    user_id: string;
    activity_type: 'login' | 'listing_created' | 'listing_updated' | 'offer_made' | 'offer_received' | 'message_sent' | 'profile_updated';
    description: string;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    user?: UserProfile;
}
export type FeedbackType = 'bug_report' | 'feature_request' | 'general_feedback' | 'complaint' | 'praise';
export interface UserFeedback {
    id: string;
    user_id: string;
    feedback_type: FeedbackType;
    content: string;
    status: 'pending' | 'in_review' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
    user?: UserProfile;
}
export interface UserStatistics {
    id: string;
    user_id: string;
    total_offers: number;
    accepted_offers: number;
    rejected_offers: number;
    pending_offers: number;
    total_views: number;
    total_messages_sent: number;
    total_messages_received: number;
    avg_response_time_hours: number;
    success_rate: number;
    created_at: string;
    updated_at: string;
    user?: UserProfile;
}
export interface MonthlyUsageStats {
    id: string;
    user_id: string;
    month: string;
    total_listings_created: number;
    total_offers_made: number;
    total_offers_received: number;
    total_messages_sent: number;
    total_reviews_given: number;
    total_reviews_received: number;
    total_successful_trades: number;
    total_views_received: number;
    total_favorites_received: number;
    created_at: string;
    updated_at: string;
}
export interface AuthCredentials {
    email: string;
    password: string;
}
export interface RegisterData extends AuthCredentials {
    username: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    refreshToken: string;
    admin: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
        permissions: any[];
        is_active: boolean;
        last_login: string;
        created_at: string;
        updated_at: string;
    };
}
export interface NotificationPreferences {
    new_offer_push: boolean;
    new_offer_email: boolean;
    new_message_push: boolean;
    new_message_email: boolean;
    review_push: boolean;
    review_email: boolean;
    summary_emails: 'daily' | 'weekly' | 'never';
}
export interface ChatPreferences {
    read_receipts: boolean;
    show_last_seen: boolean;
    auto_scroll_messages: boolean;
}
export interface PlatformPreferences {
    language: string;
    currency: string;
    default_location_province?: string;
    default_location_district?: string;
    default_category?: string;
}
//# sourceMappingURL=user.d.ts.map