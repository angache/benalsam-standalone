import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { FlatList } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { TrendingUp, Clock, Star, Users, Bell, Search as SearchIcon, Plus, Filter, Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter, ExternalLink, Shield, FileText, HelpCircle } from 'lucide-react-native';
import { useThemeStore, useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { Header, SectionHeader } from '../components';
import ListingCard from '../components/ListingCard';
import CategoryCard from '../components/CategoryCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, margins, paddings, layout, shadows, borderRadius } from '../utils/spacing';
import { typography, textPatterns, fontWeight } from '../utils/typography';

// React Query Hooks - YENİ!
import { 
  useListings, 
  usePopularListings, 
  useTodaysDeals, 
  useMostOfferedListings 
} from '../hooks/queries/useListings';
import { useFollowedCategoryListings } from '../hooks/queries/useCategories';
import { useToggleFavorite } from '../hooks/queries/useFavorites';
import { useSmartRecommendations, useTrackView, useSellerRecommendations } from '../hooks/queries/useRecommendations';
import { useRecentViews } from '../hooks/queries/useRecentViews';
import { useSimilarListingsByCategory } from '../hooks/queries/useSimilarListings';
import { ListingWithUser } from '../services/listingService/core';
import { CategoryWithListings } from '../services/categoryFollowService';
import { ListingWithFavorite } from '../types';
import { UseQueryResult } from '@tanstack/react-query';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { useUserPreferencesContext } from '../contexts/UserPreferencesContext';
import analyticsService from '../services/analyticsService';
import { performanceService } from '../services/performanceService';
import ipChangeDetectionService from '../services/ipChangeDetectionService';


// Legacy imports - aşamalı olarak kaldırılacak
import { categoriesConfig } from '../config/categories-with-attributes';
import { SearchBar } from '../components/SearchBar';

type RootStackParamList = {
  Search: { query?: string; filter?: string };
  Messages: undefined;
  Create: undefined;
  Login: undefined;
  Category: { category: string };
  ListingDetail: { listingId: string };
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const BANNERS = [
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    text: 'İhtiyacınız olan ürünleri hemen bulun!',
    action: 'explore'
  },
  {
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
    text: 'Kaliteli ürünler uygun fiyatlarla',
    action: 'latest'
  },
  {
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80',
    text: 'Güvenli alışveriş, hızlı teslimat',
    action: 'safety'
  }
];

const STATS = [
  { icon: Users, value: '50K+', label: 'Aktif Kullanıcı', color: 'primary' },
  { icon: TrendingUp, value: '125K+', label: 'Alım İlanı', color: 'success' },
  { icon: Star, value: '89%', label: 'Memnuniyet', color: 'warning' },
  { icon: Clock, value: '24/7', label: 'Destek', color: 'info' },
];

const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDE_PADDING = spacing.md; // 16px - Sol ve sağ kenar mesafesi
const CARD_GAP = spacing.lg; // 24px - Kartlar arası mesafe (16px'den 24px'e artırıldı)
const getNumColumns = (contentTypePreference: string) => {
  switch (contentTypePreference) {
    case 'compact':
      return 3;
    case 'list':
      return 1;
    case 'grid':
    default:
      return 2;
  }
};

// Progressive Disclosure - Her section'da gösterilecek maksimum item sayısı
const PROGRESSIVE_DISCLOSURE_LIMITS = {
  MOST_OFFERED: 10, // En çok teklif alanlar (5'ten 10'a)
  POPULAR: 10, // Popüler ilanlar (5'ten 10'a)
  TODAYS_DEALS: 6, // Günün fırsatları (3'ten 6'ya)
  NEW_LISTINGS: 12, // Yeni ilanlar (8'den 12'ye)
  FOLLOWED_CATEGORIES: 5, // Takip edilen kategoriler (3'ten 5'e)
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 20 : 40,
  },
  skeletonCard: {
    width: (screenWidth - SIDE_PADDING * 2 - CARD_GAP) / 2,
    height: 260,
    borderRadius: borderRadius.md,
    ...margins.b.md, // marginBottom: 16
    marginHorizontal: CARD_GAP / 2,
    overflow: 'hidden',
  },
  skeletonImage: {
    height: 140,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  skeletonContent: {
    ...paddings.all.sm, // padding: 12
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    ...margins.b.sm, // marginBottom: 8
  },
  welcomeSection: {
    ...margins.h.md, // marginHorizontal: 16
    ...margins.v.sm, // marginVertical: 12
    ...paddings.all.md, // padding: 16
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  welcomeText: {
    ...textPatterns.sectionHeader, // fontSize: 20, fontWeight: 'bold', lineHeight: 28
    ...margins.b.xs, // marginBottom: 4
  },
  welcomeSubtext: {
    ...typography.body2, // fontSize: 14, fontWeight: 'normal', lineHeight: 20
  },
  welcomeCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  welcomeCloseText: {
    ...typography.caption1, // fontSize: 12, fontWeight: 'normal', lineHeight: 16
    textDecorationLine: 'underline',
  },
  searchSection: {
    ...margins.h.md, // marginHorizontal: 16
    ...margins.b.md, // marginBottom: 16
  },
  bannerSection: {
    height: 180,
    ...margins.b.md, // marginBottom: 16
  },
  bannerContainer: {
    ...paddings.h.sm, // paddingHorizontal: 8
  },
  bannerCard: {
    width: 280,
    height: 160,
    marginHorizontal: spacing.sm, // 8px
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    ...paddings.all.md, // padding: 16
  },
  bannerText: {
    ...typography.h3, // fontSize: 16, fontWeight: 'semibold', lineHeight: 22
    color: 'white',
  },
  bannerActionButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  bannerActionText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: 0,
  },
  statsContainer: {
    paddingHorizontal: 8,
  },
  statCard: {
    width: 100,
    ...paddings.all.md, // padding: 16
    marginHorizontal: spacing.sm, // 8px
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.h2, // fontSize: 18, fontWeight: 'semibold', lineHeight: 24
    fontWeight: fontWeight.extrabold, // Override for stats
    ...margins.t.sm, // marginTop: 8
    ...margins.b.xs, // marginBottom: 4
  },
  statLabel: {
    ...typography.caption1, // fontSize: 12, fontWeight: 'normal', lineHeight: 16
    textAlign: 'center',
    fontWeight: fontWeight.medium, // Override for stats
  },
  section: {
    ...margins.v.md, // marginVertical: 16 (increased from 12)
  },
  mostOfferedSection: {
    ...margins.v.md, // marginVertical: 16 (normal spacing)
  },
  todaysDealsSection: {
    ...margins.v.md, // marginVertical: 16 (normal spacing)
  },
  popularListingsSection: {
    ...margins.v.md, // marginVertical: 16 (normal spacing)
  },
  sectionTitle: {
    ...textPatterns.sectionHeader, // fontSize: 20, fontWeight: 'bold', lineHeight: 28
    ...margins.h.md, // marginHorizontal: 16
    ...margins.b.sm, // marginBottom: 12
  },
  categorySection: {
    ...margins.t.md, // marginTop: 16
    ...margins.b.lg, // marginBottom: 20
  },
  categoryTitle: {
    ...textPatterns.cardTitle, // fontSize: 16, fontWeight: 'semibold', lineHeight: 22
    ...margins.h.md, // marginHorizontal: 16
    ...margins.b.sm, // marginBottom: 8
  },
  categoryScrollerSection: {
    ...margins.b.sm, // marginBottom: 10
  },
  horizontalListContainer: {
    ...paddings.h.md, // paddingHorizontal: 16
  },
  gridListContainer: {
    paddingHorizontal: SIDE_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridItem: {
    marginBottom: spacing.lg, // 24px alt boşluk
    marginRight: spacing.lg, // 24px sağ boşluk
  },
  gridItemFirst: {
    marginLeft: 0,
  },
  gridItemLast: {
    marginRight: 0,
  },
  flashListContainer: {
    paddingHorizontal: 0,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_PADDING - CARD_GAP / 2,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  skeletonHorizontalCard: {
    width: 200,
    height: 280,
    borderRadius: borderRadius.md,
    ...margins.b.md, // marginBottom: 16
    marginHorizontal: spacing.sm, // 8px
    overflow: 'hidden',
  },
  skeletonHorizontalImage: {
    height: 160,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  skeletonHorizontalContent: {
    ...paddings.all.sm, // padding: 12
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...margins.h.md, // marginHorizontal: 16
    ...margins.b.sm, // marginBottom: 12
  },
  skeletonTitle: {
    width: 150,
    height: 24,
    borderRadius: 6,
  },
  skeletonAction: {
    width: 80,
    height: 24,
    borderRadius: 6,
  },
  errorContainer: {
    ...paddings.all.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...margins.v.sm,
    ...margins.h.md,
    ...shadows.sm,
  },
  errorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    ...paddings.all.sm,
  },
  errorMessage: {
    ...typography.body2,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    ...paddings.all.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.button1,
  },
  sectionErrorContainer: {
    ...margins.v.sm,
  },
  // Modern Footer Styles
  modernFooter: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerContent: {
    marginBottom: 24,
  },
  footerBrand: {
    marginBottom: 20,
  },
  footerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  footerLegal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerSectionTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerBottom: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    marginLeft: 8,
  },
  footerCopyright: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  copyrightText: {
    fontSize: 12,
  },
  footerSkeleton: {
    height: 150, // Approximate height for skeleton
  },
  // Test buttons styles
  testSection: {
    ...margins.h.md,
    ...margins.v.sm,
    ...paddings.all.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#f0f0f0',
  },
  testSectionTitle: {
    ...textPatterns.sectionHeader,
    ...margins.b.sm,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    ...margins.b.sm,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Skeleton loading components
const SkeletonCard = () => {
  const colors = useThemeColors();
  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.skeletonImage, { backgroundColor: colors.border }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '80%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '60%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '40%' }]} />
      </View>
    </View>
  );
};

const SkeletonHorizontalCard = () => {
  const colors = useThemeColors();
  return (
    <View style={[styles.skeletonHorizontalCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.skeletonHorizontalImage, { backgroundColor: colors.border }]} />
      <View style={styles.skeletonHorizontalContent}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '90%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '70%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '50%' }]} />
      </View>
    </View>
  );
};

const SkeletonSectionHeader = () => {
  const colors = useThemeColors();
  return (
    <View style={styles.skeletonSectionHeader}>
      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonAction, { backgroundColor: colors.border }]} />
    </View>
  );
};

// Error fallback components
const ErrorFallback = ({ 
  message = 'Bir hata oluştu', 
  onRetry, 
  showRetry = true 
}: { 
  message?: string; 
  onRetry?: () => void; 
  showRetry?: boolean;
}) => {
  const colors = useThemeColors();
  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.errorIcon, { backgroundColor: colors.error }]} />
      <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {showRetry && onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <Text style={[styles.retryButtonText, { color: colors.white }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const SectionErrorFallback = ({ 
  title, 
  onRetry 
}: { 
  title: string; 
  onRetry: () => void;
}) => {
  const colors = useThemeColors();
  return (
    <View style={styles.sectionErrorContainer}>
      <SectionHeader 
        title={title}
        showAction={false}
      />
      <ErrorFallback 
        message={`${title} yüklenirken bir hata oluştu`}
        onRetry={onRetry}
        showRetry={true}
      />
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const { handleScroll, headerOpacity, headerTranslateY } = useScrollHeader(50);
  
  // Analytics tracking
  useEffect(() => {
    analyticsService.trackScreenView('HomeScreen');
    
    // Performance monitoring - Bundle size tracking (estimated)
    performanceService.trackBundleSize(2500); // ~2.5MB estimated
    
    // Performance monitoring - Memory usage tracking (simulated)
    const usedMemory = Math.random() * 200 + 100; // 100-300MB
    const totalMemory = 4000; // 4GB total
    performanceService.trackMemoryUsage(usedMemory, totalMemory);
  }, []);
  
  // React Query hooks with proper typing
  const { data: listings = [], isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useListings() as UseQueryResult<ListingWithUser[], Error>;
  const { data: popularListings = [], isLoading: popularLoading, error: popularError, refetch: refetchPopular } = usePopularListings() as UseQueryResult<ListingWithUser[], Error>;
  const { data: todaysDeals = [], isLoading: dealsLoading, error: dealsError, refetch: refetchDeals } = useTodaysDeals() as UseQueryResult<ListingWithUser[], Error>;
  const { data: mostOffered = [], isLoading: mostOfferedLoading, error: mostOfferedError, refetch: refetchMostOffered } = useMostOfferedListings() as UseQueryResult<ListingWithUser[], Error>;
  
  // Smart Recommendations
  const { data: smartRecommendations, isLoading: recommendationsLoading, error: recommendationsError, refetch: refetchRecommendations } = useSmartRecommendations(8, 'hybrid');
  const { trackView } = useTrackView();
  
  // Seller-Focused Recommendations
  const { data: sellerRecommendations, isLoading: sellerRecommendationsLoading, error: sellerRecommendationsError, refetch: refetchSellerRecommendations } = useSellerRecommendations(6);

  // Recent Views
  const { data: recentViews, isLoading: recentViewsLoading, error: recentViewsError, refetch: refetchRecentViews } = useRecentViews(6);

  // Similar Listings (kategori bazlı)
  const { data: similarListings, isLoading: similarListingsLoading, error: similarListingsError, refetch: refetchSimilarListings } = useSimilarListingsByCategory('Elektronik > Telefon > Akıllı Telefon > Akıllı Telefonlar', undefined, 6);

  const { data: followedCategories = [], isLoading: followedLoading, error: followedError, refetch: refetchFollowed } = useFollowedCategoryListings() as UseQueryResult<CategoryWithListings[], Error>;
  const { toggleFavorite } = useToggleFavorite();
  const userPrefs = useUserPreferencesContext();
  const { 
    preferences, 
    addFavoriteCategory, 
    removeFavoriteCategory,
    hideCategory,
    showCategory,
    updateContentTypePreference,
    toggleCategoryBadges,
    toggleUrgencyBadges,
    toggleUserRatings,
    toggleDistance,
    addRecentSearch,
    addSearchHistory,
    hideWelcomeMessage
  } = userPrefs;

  // User preferences loaded

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const startTime = Date.now();
    
    try {
      await Promise.all([
        refetchListings(),
        refetchPopular(),
        refetchDeals(),
        refetchMostOffered(),
        refetchFollowed(),
        refetchRecommendations(),
        refetchSellerRecommendations(),
        refetchRecentViews(),
        refetchSimilarListings()
      ]);
      
      // Performance monitoring - API response time tracking
      const duration = Date.now() - startTime;
      performanceService.trackApiResponseTime('home-refresh', duration);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      
      // Performance monitoring - Error tracking
      if (error instanceof Error) {
        performanceService.trackError(error, 'home-refresh');
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchListings, refetchPopular, refetchDeals, refetchMostOffered, refetchFollowed, refetchRecommendations, refetchSellerRecommendations, refetchRecentViews, refetchSimilarListings]);

  const isLoading = listingsLoading || popularLoading || dealsLoading || mostOfferedLoading || followedLoading || recommendationsLoading || sellerRecommendationsLoading || recentViewsLoading || similarListingsLoading;

  // Individual section loading states
  const isCategoriesLoading = false; // Categories are static for now
  const isMostOfferedLoading = mostOfferedLoading;
  const isPopularLoading = popularLoading;
  const isTodaysDealsLoading = dealsLoading;
  const isNewListingsLoading = listingsLoading;
  const isFollowedLoading = followedLoading;
  const isRecommendationsLoading = recommendationsLoading;

  // Individual section error states
  // Performance monitoring - Error tracking for individual sections
  useEffect(() => {
    if (listingsError) {
      performanceService.trackError(listingsError, 'listings-fetch');
    }
    if (popularError) {
      performanceService.trackError(popularError, 'popular-fetch');
    }
    if (dealsError) {
      performanceService.trackError(dealsError, 'deals-fetch');
    }
    if (mostOfferedError) {
      performanceService.trackError(mostOfferedError, 'most-offered-fetch');
    }
    if (followedError) {
      performanceService.trackError(followedError, 'followed-fetch');
    }
    if (recommendationsError) {
      performanceService.trackError(recommendationsError, 'recommendations-fetch');
    }
    if (sellerRecommendationsError) {
      performanceService.trackError(sellerRecommendationsError, 'seller-recommendations-fetch');
    }
    if (recentViewsError) {
      performanceService.trackError(recentViewsError, 'recent-views-fetch');
    }
    if (similarListingsError) {
      performanceService.trackError(similarListingsError, 'similar-listings-fetch');
    }
  }, [listingsError, popularError, dealsError, mostOfferedError, followedError, recommendationsError, sellerRecommendationsError, recentViewsError, similarListingsError]);
  const isMostOfferedError = !!mostOfferedError;
  const isPopularError = !!popularError;
  const isTodaysDealsError = !!dealsError;
  const isNewListingsError = !!listingsError;
  const isFollowedError = !!followedError;
  const isRecommendationsError = !!recommendationsError;
  const isSellerRecommendationsLoading = sellerRecommendationsLoading;
  const isSellerRecommendationsError = !!sellerRecommendationsError;
  const isRecentViewsLoading = recentViewsLoading;
  const isRecentViewsError = !!recentViewsError;
  const isSimilarListingsLoading = similarListingsLoading;
  const isSimilarListingsError = !!similarListingsError;

  // Progressive Disclosure - Limited data for better UX
  const limitedMostOffered = mostOffered.slice(0, PROGRESSIVE_DISCLOSURE_LIMITS.MOST_OFFERED);
  const limitedPopularListings = popularListings.slice(0, PROGRESSIVE_DISCLOSURE_LIMITS.POPULAR);
  const limitedTodaysDeals = todaysDeals.slice(0, PROGRESSIVE_DISCLOSURE_LIMITS.TODAYS_DEALS);
  const limitedNewListings = listings.slice(0, PROGRESSIVE_DISCLOSURE_LIMITS.NEW_LISTINGS);
  const limitedFollowedCategories = followedCategories.slice(0, PROGRESSIVE_DISCLOSURE_LIMITS.FOLLOWED_CATEGORIES);
  const limitedRecommendations = smartRecommendations?.data?.listings || [];
  const limitedSellerRecommendations = sellerRecommendations?.data?.listings || [];
  const limitedRecentViews = recentViews?.recentViews || [];
  const limitedSimilarListings = similarListings?.similarListings || [];
  
  // Debug: Smart recommendations durumunu kontrol et
  if (__DEV__) {
    // Debug logs removed for cleaner console
  }

  const getCurrentCategories = () => {
    if (categoryPath.length === 0) {
      // Filter out hidden categories
      return categoriesConfig.filter(cat => !preferences.hiddenCategories.includes(cat.name));
    }
    let current: any = categoriesConfig.find(cat => cat.name === categoryPath[0]);
    for (let i = 1; i < categoryPath.length; i++) {
      if (!current || !current.subcategories) return [];
      current = current.subcategories.find((cat: any) => cat.name === categoryPath[i]);
    }
    return (current?.subcategories || []).filter((cat: any) => !preferences.hiddenCategories.includes(cat.name));
  };



  const handleCategoryPress = (cat: any) => {
    setSelectedCategory(cat.name);
  };

  const handleSubCategoryPress = (cat: any) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      setSelectedCategory(cat.name);
    } else {
      navigation.navigate('Search', { query: cat.name });
    }
  };

  const handleBreadcrumb = (idx: number) => {
    setSelectedCategory(selectedCategory.slice(0, idx + 1));
  };

  // Favori toggle fonksiyonu
  const handleToggleFavorite = useCallback(async (listingId: string, currentStatus: boolean) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    
    // If this listing is already being processed, don't process again
    if (selectedListingId === listingId) {
      return;
    }
    
    setSelectedListingId(listingId);
    
    try {
      await toggleFavorite(listingId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setSelectedListingId(null);
    }
  }, [user, toggleFavorite, navigation, selectedListingId]);

  // Memoized render functions for performance
  const renderGridListing = useCallback(({ item, index }: { item: ListingWithUser; index: number }) => (
    <ListingCard
      key={item.id}
      listing={item}
      index={index}
      onPress={() => {
        // Track view behavior
        trackView(item.id, { category: item.category, price: item.budget });
        navigation.navigate('ListingDetail', { listingId: item.id });
      }}
      onToggleFavorite={() => handleToggleFavorite(item.id, !!item.is_favorited)}
      isFavoriteLoading={selectedListingId === item.id}
      isGrid={true} // Grid layout için marginRight devre dışı
      showCategoryBadges={preferences.showCategoryBadges}
      showUrgencyBadges={preferences.showUrgencyBadges}
      numColumns={getNumColumns(preferences.contentTypePreference)}
      screenName="HomeScreen"
      sectionName="All Listings"
    />
  ), [navigation, handleToggleFavorite, selectedListingId, preferences.showCategoryBadges, preferences.showUrgencyBadges, preferences.contentTypePreference, trackView]);

  const renderHorizontalListing = useCallback(({ item, index }: { item: ListingWithUser; index: number }) => (
    <ListingCard
      key={item.id}
      listing={item}
      onPress={() => {
        // Track view behavior
        trackView(item.id, { category: item.category, price: item.budget });
        navigation.navigate('ListingDetail', { listingId: item.id });
      }}
      onToggleFavorite={() => handleToggleFavorite(item.id, !!item.is_favorited)}
      isFavoriteLoading={selectedListingId === item.id}
      isGrid={false} // Horizontal layout için marginRight aktif
      style={{ width: 200, marginRight: 12 }}
      showCategoryBadges={preferences.showCategoryBadges}
      showUrgencyBadges={preferences.showUrgencyBadges}
      screenName="HomeScreen"
      sectionName="Horizontal Listings"
    />
  ), [navigation, handleToggleFavorite, selectedListingId, preferences.showCategoryBadges, preferences.showUrgencyBadges, trackView]);

  const renderSkeletonGrid = useCallback(() => (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  ), []);

  const renderSkeletonHorizontalList = useCallback(() => (
    <View style={styles.horizontalListContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonHorizontalCard key={index} />
      ))}
    </View>
  ), []);

  const renderSkeletonSectionHeader = useCallback(() => (
    <SkeletonSectionHeader />
  ), []);

  const keyExtractor = useCallback((item: ListingWithUser, index: number) => 
    `${item.id}_${index}`, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 280, // Approximate card height + margin
    offset: 280 * Math.floor(index / getNumColumns(preferences.contentTypePreference)),
    index,
  }), [preferences.contentTypePreference]);

  const navigateToScreen = (screen: keyof RootStackParamList, params?: any) => {
    navigation.navigate(screen, params);
  };

  // Progressive Disclosure Navigation Functions
  const navigateToMostOffered = () => {
    navigation.navigate('Search', { 
      query: 'en çok teklif alan',
      filter: 'most_offered'
    });
  };

  const navigateToPopular = () => {
    navigation.navigate('Search', { 
      query: 'popüler',
      filter: 'popular'
    });
  };

  const navigateToTodaysDeals = () => {
    navigation.navigate('Search', { 
      query: 'günün fırsatları',
      filter: 'todays_deals'
    });
  };

  const navigateToAllListings = () => {
    navigation.navigate('Search', { 
      query: '',
      filter: 'all'
    });
  };

  const darkMode = isDarkMode();

  // Modern Footer Component
  const ModernFooter = () => {
    const colors = useThemeColors();
    
    const handleFooterLink = (type: string) => {
      // Footer link handling
      switch (type) {
        case 'about':
          // Navigate to About page
          break;
        case 'contact':
          // Navigate to Contact page
          break;
        case 'help':
          // Navigate to Help page
          break;
        case 'privacy':
          // Navigate to Privacy Policy
          break;
        case 'terms':
          // Navigate to Terms of Service
          break;
        case 'instagram':
          // Open Instagram
          break;
        case 'facebook':
          // Open Facebook
          break;
        case 'twitter':
          // Open Twitter
          break;
        default:
          break;
      }
    };

    return (
      <View style={[styles.modernFooter, { backgroundColor: colors.surface }]}>
        {/* Ana Footer İçeriği */}
        <View style={styles.footerContent}>
          {/* Logo ve Açıklama */}
          <View style={styles.footerBrand}>
            <Text style={[styles.footerLogo, { color: colors.primary }]}>
              BenAlsam
            </Text>
            <Text style={[styles.footerDescription, { color: colors.textSecondary }]}>
              Güvenli alışveriş platformu. İhtiyacınız olan ürünleri kolayca bulun ve satın.
            </Text>
          </View>

          {/* Hızlı Linkler */}
          <View style={styles.footerLinks}>
            <View>
              <Text style={[styles.footerSectionTitle, { color: colors.text }]}>
                Hızlı Erişim
              </Text>
              <TouchableOpacity onPress={() => handleFooterLink('about')}>
                <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
                  Hakkımızda
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFooterLink('contact')}>
                <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
                  İletişim
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFooterLink('help')}>
                <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
                  Yardım
                </Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={[styles.footerSectionTitle, { color: colors.text }]}>
                Yasal
              </Text>
              <TouchableOpacity onPress={() => handleFooterLink('privacy')}>
                <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
                  Gizlilik Politikası
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFooterLink('terms')}>
                <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
                  Kullanım Şartları
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sosyal Medya ve İletişim */}
        <View style={styles.footerBottom}>
          <View style={styles.socialLinks}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.border }]}
              onPress={() => handleFooterLink('instagram')}
            >
              <Instagram size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.border }]}
              onPress={() => handleFooterLink('facebook')}
            >
              <Facebook size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.border }]}
              onPress={() => handleFooterLink('twitter')}
            >
              <Twitter size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Mail size={16} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                info@benalsam.com
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={16} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                +90 212 555 0123
              </Text>
            </View>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.footerCopyright}>
          <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>
            © 2024 BenAlsam. Tüm hakları saklıdır.
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['left', 'right']}
      >
        <StatusBar
          backgroundColor={colors.background}
          barStyle="light-content"
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.content, { 
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
        }]}>
          <Animated.View
            style={{
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          >
            <Header 
              onThemeToggle={() => {}}
              isDarkMode={darkMode}
              onSearchPress={() => navigateToScreen('Search')}
              onNotificationPress={() => navigateToScreen('Messages')}
              onCreatePress={() => navigateToScreen('Create')}
            />
          </Animated.View>
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.section}>
              {renderSkeletonSectionHeader()}
              {renderSkeletonGrid()}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
      />
      <View style={[styles.content, { 
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
      }]}>
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          <Header 
            onThemeToggle={() => {}}
            isDarkMode={darkMode}
            onSearchPress={() => navigateToScreen('Search')}
            onNotificationPress={() => navigateToScreen('Messages')}
            onCreatePress={() => navigateToScreen('Create')}
          />
        </Animated.View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={(event) => {
            handleScroll(event);
            // Analytics tracking
            const scrollY = event.nativeEvent.contentOffset.y;
            analyticsService.trackScrollDepth(Math.floor(scrollY), 'HomeScreen');
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              title="Yenileniyor..."
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Hoşgeldin Mesajı */}
          {user && preferences.showWelcomeMessage && (
            <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                Merhaba {user.username || user.email?.split('@')[0]}! 👋
              </Text>
              <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
                İhtiyacınız olan ürünleri keşfedin ve satın alın!
              </Text>
              <TouchableOpacity 
                style={styles.welcomeCloseButton}
                onPress={hideWelcomeMessage}
              >
                <Text style={[styles.welcomeCloseText, { color: colors.textSecondary }]}>
                  Kapat
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Arama Çubuğu */}
          <View style={styles.searchSection}>
            <SearchBar
              value={selectedCategory}
              onChangeText={(text) => {
                setSelectedCategory(text);
              }}
              onSearch={() => {
                if (selectedCategory.trim()) {
                  const searchTerm = selectedCategory.trim();
                  addRecentSearch(searchTerm);
                  addSearchHistory(searchTerm);
                  navigation.navigate('Search', { query: searchTerm });
                }
              }}
              placeholder="Ne arıyorsunuz?"
              showSuggestions={false}
            />
          </View>

          {/* Banner Section */}
          <View style={styles.bannerSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerContainer}>
              {BANNERS.map((banner, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.bannerCard}
                  onPress={() => {
                    switch (banner.action) {
                      case 'explore':
                        navigateToScreen('Search', { query: '' });
                        break;
                      case 'latest':
                        navigateToAllListings();
                        break;
                      case 'safety':
                        // TODO: Navigate to safety guide
                        break;
                      default:
                        navigateToScreen('Search', { query: banner.text });
                    }
                  }}
                >
                  <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerText}>{banner.text}</Text>
                    <TouchableOpacity 
                      style={styles.bannerActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        switch (banner.action) {
                          case 'explore':
                            navigateToScreen('Search', { query: '' });
                            break;
                          case 'latest':
                            navigateToAllListings();
                            break;
                          case 'safety':
                            // Navigate to safety guide
                            break;
                          default:
                            navigateToScreen('Search', { query: banner.text });
                        }
                      }}
                    >
                      <Text style={styles.bannerActionText}>Keşfet</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
              {STATS.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.statCard, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      switch (stat.label) {
                        case 'Aktif Kullanıcı':
                          // TODO: Navigate to user directory
                          break;
                        case 'Alım İlanı':
                          navigateToScreen('Search', { query: 'alınık' });
                          break;
                        case 'Memnuniyet':
                          // TODO: Navigate to reviews
                          break;
                        case 'Destek':
                          // TODO: Navigate to support
                          break;
                        default:
                          navigateToScreen('Search', { query: stat.label });
                      }
                    }}
                  >
                    <IconComponent size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Kategoriler */}
          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getCurrentCategories().map((category: any) => (
                <CategoryCard
                  key={category.name}
                  title={category.name}
                  onPress={() => handleSubCategoryPress(category)}
                  icon={category.icon}
                />
              ))}
            </ScrollView>
          </View>

          {/* Günün Fırsatları - PROMOSYONLU İLANLAR */}
          <View style={styles.todaysDealsSection}>
            {isTodaysDealsLoading ? (
              <>
                {renderSkeletonSectionHeader()}
                {renderSkeletonHorizontalList()}
              </>
            ) : isTodaysDealsError ? (
              <SectionErrorFallback 
                title="Günün Fırsatları"
                onRetry={() => refetchDeals()}
              />
            ) : limitedTodaysDeals.length > 0 ? (
              <>
                <SectionHeader 
                  title="Günün Fırsatları"
                  count={limitedTodaysDeals.length}
                  showCount={true}
                  showAction={true}
                  actionText="Tümünü Gör"
                  onActionPress={navigateToTodaysDeals}
                />
                <FlashList
                  data={limitedTodaysDeals}
                  renderItem={renderHorizontalListing}
                  keyExtractor={keyExtractor}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContainer}
                  estimatedItemSize={200}
                />
              </>
            ) : null}
          </View>

          {/* Yeni İlanlar - MODERN GRID */}
          <View style={styles.section}>
            {isNewListingsLoading ? (
              <>
                {renderSkeletonSectionHeader()}
                {renderSkeletonGrid()}
              </>
            ) : isNewListingsError ? (
              <SectionErrorFallback 
                title="Yeni İlanlar"
                onRetry={() => refetchListings()}
              />
            ) : limitedNewListings.length > 0 ? (
              <>
                <SectionHeader 
                  title="Yeni İlanlar"
                  count={limitedNewListings.length}
                  showCount={true}
                  showAction={true}
                  actionText="Tümünü Gör"
                  onActionPress={navigateToAllListings}
                />
                <View style={styles.flashListContainer}>
                  <View style={styles.gridListContainer}>
                    {limitedNewListings.map((item, index) => {
                      const numColumns = getNumColumns(preferences.contentTypePreference);
                      const isFirstInRow = index % numColumns === 0;
                      const isLastInRow = (index + 1) % numColumns === 0;
                      
                      // Dinamik genişlik hesaplama
                      const cardWidth = (screenWidth - SIDE_PADDING * 2 - spacing.lg * (numColumns - 1)) / numColumns;
                      
                      return (
                        <View 
                          key={item.id}
                          style={[
                            styles.gridItem,
                            { width: cardWidth },
                            isFirstInRow && styles.gridItemFirst,
                            isLastInRow && styles.gridItemLast,
                          ]}
                        >
                          {renderGridListing({ item, index })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}
          </View>

          {/* Takip Ettiğiniz Kategoriler */}
          {followedCategories.length > 0 && (
            <View style={styles.section}>
              {renderSkeletonSectionHeader()}
              {limitedFollowedCategories.map((category: CategoryWithListings) => (
                <View key={category.category_name}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {category.category_name}
                  </Text>
                  {category.listings && category.listings.length > 0 && (
                    <FlashList
                      data={category.listings}
                      renderItem={renderHorizontalListing}
                      keyExtractor={keyExtractor}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalListContainer}
                      estimatedItemSize={200}
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Son Baktıkların Section */}
          {user && limitedRecentViews.length > 0 && (
            <View style={styles.section}>
              {isRecentViewsLoading ? (
                <>
                  {renderSkeletonSectionHeader()}
                  {renderSkeletonHorizontalList()}
                </>
              ) : isRecentViewsError ? (
                <SectionErrorFallback 
                  title="Son Baktıkların"
                  onRetry={() => refetchRecentViews()}
                />
              ) : (
                <>
                  <SectionHeader 
                    title="Son Baktıkların"
                    count={limitedRecentViews.length}
                    showCount={true}
                    showAction={true}
                    actionText="Tümünü Gör"
                    onActionPress={() => navigateToScreen('Search', { query: '', filter: 'recent-views' })}
                  />
                  <FlashList
                    data={limitedRecentViews.map(view => view.listing).filter((listing): listing is ListingWithUser => !!listing)}
                    renderItem={renderHorizontalListing}
                    keyExtractor={keyExtractor}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContainer}
                    estimatedItemSize={200}
                  />
                </>
              )}
            </View>
          )}

          {/* Smart Recommendations Section - Kişiselleştirilmiş İçerik */}
          {user && (
            <View style={styles.section}>
              {isRecommendationsLoading ? (
                <>
                  {renderSkeletonSectionHeader()}
                  {renderSkeletonHorizontalList()}
                </>
              ) : isRecommendationsError ? (
                <SectionErrorFallback 
                  title="Senin İçin Öneriler"
                  onRetry={() => refetchRecommendations()}
                />
              ) : limitedRecommendations.length > 0 ? (
                <>
                  <SectionHeader 
                    title="Senin İçin Öneriler"
                    count={limitedRecommendations.length}
                    showCount={true}
                    showAction={true}
                    actionText="Daha Fazla"
                    onActionPress={() => navigateToScreen('Search', { query: '', filter: 'recommendations' })}
                  />
                  <FlashList
                    data={limitedRecommendations}
                    renderItem={renderHorizontalListing}
                    keyExtractor={keyExtractor}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContainer}
                    estimatedItemSize={200}
                  />
                </>
              ) : null}
            </View>
          )}

          {/* Seller-Focused Recommendations Section - Envanter Bazlı */}
          {user && limitedSellerRecommendations.length > 0 && (
            <View style={styles.section}>
              {isSellerRecommendationsLoading ? (
                <>
                  {renderSkeletonSectionHeader()}
                  {renderSkeletonHorizontalList()}
                </>
              ) : isSellerRecommendationsError ? (
                <SectionErrorFallback 
                  title="Envanter Önerileri"
                  onRetry={() => refetchSellerRecommendations()}
                />
              ) : (
                <>
                  <SectionHeader 
                    title="Envanter Önerileri"
                    count={limitedSellerRecommendations.length}
                    showCount={true}
                    showAction={true}
                    actionText="Daha Fazla"
                    onActionPress={() => navigateToScreen('Search', { query: '', filter: 'seller-recommendations' })}
                  />
                  <FlashList
                    data={limitedSellerRecommendations}
                    renderItem={renderHorizontalListing}
                    keyExtractor={keyExtractor}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContainer}
                    estimatedItemSize={200}
                  />
                </>
              )}
            </View>
          )}

          {/* Benzer İlanlar Section */}
          {limitedSimilarListings.length > 0 && (
            <View style={styles.section}>
              {isSimilarListingsLoading ? (
                <>
                  {renderSkeletonSectionHeader()}
                  {renderSkeletonHorizontalList()}
                </>
              ) : isSimilarListingsError ? (
                <SectionErrorFallback 
                  title="Benzer İlanlar"
                  onRetry={() => refetchSimilarListings()}
                />
              ) : (
                <>
                  <SectionHeader 
                    title="Benzer İlanlar"
                    count={limitedSimilarListings.length}
                    showCount={true}
                    showAction={true}
                    actionText="Tümünü Gör"
                    onActionPress={() => navigateToScreen('Search', { query: '', filter: 'similar-listings' })}
                  />
                  <FlashList
                    data={limitedSimilarListings.map(item => item.listing)}
                    renderItem={renderHorizontalListing}
                    keyExtractor={(item, index) => `similar-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContainer}
                    estimatedItemSize={200}
                  />
                </>
              )}
            </View>
          )}

          {/* En Çok Teklif Alanlar */}
          <View style={styles.mostOfferedSection}>
            {isMostOfferedLoading ? (
              <>
                {renderSkeletonSectionHeader()}
                {renderSkeletonHorizontalList()}
              </>
            ) : isMostOfferedError ? (
              <SectionErrorFallback 
                title="En Çok Teklif Alanlar"
                onRetry={() => refetchMostOffered()}
              />
            ) : limitedMostOffered.length > 0 ? (
              <>
                <SectionHeader 
                  title="En Çok Teklif Alanlar"
                  count={limitedMostOffered.length}
                  showCount={true}
                  showAction={true}
                  actionText="Tümünü Gör"
                  onActionPress={navigateToMostOffered}
                />
                <FlashList
                  data={limitedMostOffered}
                  renderItem={renderHorizontalListing}
                  keyExtractor={keyExtractor}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContainer}
                  estimatedItemSize={200}
                />
              </>
            ) : null}
          </View>

          {/* Popüler İlanlar */}
          <View style={styles.popularListingsSection}>
            {isPopularLoading ? (
              <>
                {renderSkeletonSectionHeader()}
                {renderSkeletonHorizontalList()}
              </>
            ) : isPopularError ? (
              <SectionErrorFallback 
                title="Popüler İlanlar"
                onRetry={() => refetchPopular()}
              />
            ) : limitedPopularListings.length > 0 ? (
              <>
                <SectionHeader 
                  title="Popüler İlanlar"
                  count={limitedPopularListings.length}
                  showCount={true}
                  showAction={true}
                  actionText="Tümünü Gör"
                  onActionPress={navigateToPopular}
                />
                <FlashList
                  data={limitedPopularListings}
                  renderItem={renderHorizontalListing}
                  keyExtractor={keyExtractor}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContainer}
                  estimatedItemSize={200}
                />
              </>
            ) : null}
          </View>
          
          {/* Test Buttons - Development Only */}
          {__DEV__ && (
            <View style={styles.testSection}>
              <Text style={styles.testSectionTitle}>🧪 Test Buttons (DEV)</Text>
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => ipChangeDetectionService.testIPChange()}
              >
                <Text style={styles.testButtonText}>Test IP Change</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Modern Footer */}
          <ModernFooter />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen; 