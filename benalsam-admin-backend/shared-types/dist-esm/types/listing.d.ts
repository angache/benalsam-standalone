import { UserProfile } from './user';
export interface Listing {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    location: string;
    urgency: 'low' | 'medium' | 'high';
    main_image_url: string;
    additional_image_urls?: string[];
    image_url: string;
    expires_at?: string;
    auto_republish: boolean;
    contact_preference: 'email' | 'phone' | 'both';
    accept_terms: boolean;
    is_featured: boolean;
    is_urgent_premium: boolean;
    is_showcase: boolean;
    geolocation?: {
        latitude: number;
        longitude: number;
    };
    created_at: string;
    updated_at: string;
    status: 'active' | 'inactive' | 'deleted' | 'expired';
    is_favorited?: boolean;
    user?: Partial<UserProfile>;
    condition: string[];
    attributes?: Record<string, string[]>;
}
export interface ListingLocation {
    province: string;
    district: string;
    neighborhood?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
export interface ListingBudget {
    min: number;
    max: number;
    currency: string;
    negotiable: boolean;
}
export interface ListingSearchMetadata {
    keywords: string[];
    popularity_score: number;
    engagement_metrics: {
        views: number;
        favorites: number;
        offers: number;
        messages: number;
    };
    last_activity: string;
}
export interface ListingUserTrust {
    trust_score: number;
    verification_status: 'unverified' | 'verified' | 'premium';
    response_rate: number;
    avg_response_time_hours: number;
}
export interface EnhancedListing extends Listing {
    location_details?: ListingLocation;
    budget_details?: ListingBudget;
    category_attributes?: {
        [category: string]: {
            [subcategory: string]: any;
        };
    };
    search_metadata?: ListingSearchMetadata;
    user_trust?: ListingUserTrust;
}
export interface SearchOptimizedListing {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    budget: {
        min: number;
        max: number;
        currency: string;
    };
    location: {
        province: string;
        district: string;
        neighborhood?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    condition: string;
    urgency: string;
    main_image_url: string;
    additional_image_urls?: string[];
    status: string;
    created_at: string;
    updated_at: string;
    attributes: Record<string, any>;
    search_keywords: string[];
    popularity_score: number;
    user_trust_score: number;
}
export interface ListingWithUser extends Listing {
    user: UserProfile;
    is_favorited: boolean;
    total_offers?: number;
    total_views?: number;
    popularity_score?: number;
}
export interface ListingWithFavorite extends Omit<Listing, 'user'> {
    user: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url'>;
    is_favorited: boolean;
}
//# sourceMappingURL=listing.d.ts.map