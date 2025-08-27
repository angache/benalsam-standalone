// ===========================
// HOME SCREEN TYPES
// ===========================

import { ListingWithUser } from '../../services/listingService/core';
import { CategoryWithListings } from '../../services/categoryFollowService';
import { ListingWithFavorite } from '../../types';

export interface Banner {
  image: string;
  text: string;
  action: 'explore' | 'latest' | 'safety';
}

export interface Stat {
  icon: any;
  value: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'info';
}

export interface HomeData {
  listings: ListingWithUser[];
  popularListings: ListingWithUser[];
  todaysDeals: ListingWithUser[];
  mostOfferedListings: ListingWithUser[];
  followedCategoryListings: CategoryWithListings[];
  recentViews: ListingWithUser[];
  similarListings: ListingWithUser[];
  recommendations: ListingWithUser[];
}

export interface HomeActions {
  onRefresh: () => void;
  onListingPress: (listingId: string) => void;
  onCategoryPress: (category: string) => void;
  onFavoriteToggle: (listingId: string) => void;
  onBannerPress: (action: string) => void;
  onSearchPress: () => void;
  onCreatePress: () => void;
}

export interface HomePerformance {
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  errorMessage?: string;
  loadTime: number;
  renderCount: number;
}

export interface HomePreferences {
  contentTypePreference: 'compact' | 'list' | 'grid';
  showWelcomeMessage: boolean;
  showBanners: boolean;
  showStats: boolean;
  progressiveDisclosureLimits: {
    MOST_OFFERED: number;
    POPULAR: number;
    TODAYS_DEALS: number;
    NEW_LISTINGS: number;
    FOLLOWED_CATEGORIES: number;
  };
}

export interface HomeAnalytics {
  screenViewTime: number;
  interactions: {
    listingViews: number;
    categoryClicks: number;
    searchClicks: number;
    createClicks: number;
    bannerClicks: number;
  };
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}

export interface HomeSectionProps {
  title: string;
  data: any[];
  onItemPress: (item: any) => void;
  onViewAllPress?: () => void;
  isLoading?: boolean;
  error?: string;
  limit?: number;
  contentType?: 'compact' | 'list' | 'grid';
}

export interface HomeHeaderProps {
  onSearchPress: () => void;
  onCreatePress: () => void;
  onNotificationPress: () => void;
  user?: any;
  showWelcomeMessage: boolean;
  onWelcomeClose: () => void;
}

export interface HomeBannerProps {
  banners: Banner[];
  onBannerPress: (action: string) => void;
  autoPlay?: boolean;
  interval?: number;
}

export interface HomeStatsProps {
  stats: Stat[];
  onStatPress?: (stat: Stat) => void;
}

export interface HomeListingsProps {
  listings: ListingWithUser[];
  onListingPress: (listingId: string) => void;
  onFavoriteToggle: (listingId: string) => void;
  contentType?: 'compact' | 'list' | 'grid';
  limit?: number;
  isLoading?: boolean;
  error?: string;
  title?: string;
  onViewAllPress?: () => void;
}

export interface HomeCategoriesProps {
  categories: CategoryWithListings[];
  onCategoryPress: (category: string) => void;
  limit?: number;
  isLoading?: boolean;
  error?: string;
}
