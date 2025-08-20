import { UserProfile } from './user';
import { ListingStatusType } from './enums';

// ===========================
// LISTING TYPES
// ===========================

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;           // ✅ Geriye uyumluluk için koru
  category_id?: number;       // ✅ Yeni ID field
  category_path?: number[];   // ✅ Hiyerarşik path [1,2,3]
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
  attributes?: Record<string, string[]>; // Category-specific attributes
}

// ===========================
// ENHANCED LISTING TYPES
// ===========================

// Enhanced Location Interface
export interface ListingLocation {
  province: string;
  district: string;
  neighborhood?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Enhanced Budget Interface
export interface ListingBudget {
  min: number;
  max: number;
  currency: string;
  negotiable: boolean;
}

// Search Metadata Interface
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

// User Trust Metrics Interface
export interface ListingUserTrust {
  trust_score: number;
  verification_status: 'unverified' | 'verified' | 'premium';
  response_rate: number;
  avg_response_time_hours: number;
}

// Enhanced Listing Interface (extends base Listing)
export interface EnhancedListing extends Listing {
  // Enhanced location
  location_details?: ListingLocation;
  
  // Enhanced budget
  budget_details?: ListingBudget;
  
  // Category-specific attributes (extends existing attributes field)
  category_attributes?: {
    [category: string]: {
      [subcategory: string]: any;
    };
  };
  
  // Search optimization
  search_metadata?: ListingSearchMetadata;
  
  // User trust metrics
  user_trust?: ListingUserTrust;
}

// Search-Optimized Listing Interface (for Elasticsearch)
export interface SearchOptimizedListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;           // ✅ Geriye uyumluluk
  category_id: number;        // ✅ Yeni ID field
  category_path: number[];    // ✅ Hiyerarşik path [1,2,3]
  subcategory?: string;       // ✅ Geriye uyumluluk
  
  // Temel alanlar
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
  
  // Esnek attribute sistemi
  attributes: Record<string, any>;
  
  // Search optimization
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

// Omit the user field from Listing first, then extend it with our own user field
export interface ListingWithFavorite extends Omit<Listing, 'user'> {
  user: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url'>;
  is_favorited: boolean;
} 