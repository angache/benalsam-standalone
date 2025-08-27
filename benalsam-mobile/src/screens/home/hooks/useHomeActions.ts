// ===========================
// USE HOME ACTIONS HOOK
// ===========================

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useToggleFavorite } from '../../../hooks/queries/useFavorites';
import { useTrackView } from '../../../hooks/queries/useRecommendations';
import analyticsService from '../../../services/analyticsService';
import { HomeActions } from '../types';

type RootStackParamList = {
  Search: { query?: string; filter?: string };
  Messages: undefined;
  Create: undefined;
  Login: undefined;
  Category: { category: string };
  ListingDetail: { listingId: string };
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const useHomeActions = () => {
  const navigation = useNavigation<NavigationProps>();
  const toggleFavoriteMutation = useToggleFavorite();
  const trackViewMutation = useTrackView();

  const onRefresh = useCallback(() => {
    // This would trigger a refetch of all data
    // Implementation depends on the specific refetch mechanism
    analyticsService.trackEvent('home_refresh', {
      timestamp: new Date().toISOString()
    });
  }, []);

  const onListingPress = useCallback((listingId: string) => {
    // Track view for analytics
    trackViewMutation.mutate({ listingId });
    
    // Track analytics event
    analyticsService.trackEvent('listing_view', {
      listingId,
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Navigate to listing detail
    navigation.navigate('ListingDetail', { listingId });
  }, [navigation, trackViewMutation]);

  const onCategoryPress = useCallback((category: string) => {
    // Track analytics event
    analyticsService.trackEvent('category_click', {
      category,
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Navigate to category
    navigation.navigate('Category', { category });
  }, [navigation]);

  const onFavoriteToggle = useCallback((listingId: string) => {
    // Toggle favorite
    toggleFavoriteMutation.mutate({ listingId });
    
    // Track analytics event
    analyticsService.trackEvent('favorite_toggle', {
      listingId,
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });
  }, [toggleFavoriteMutation]);

  const onBannerPress = useCallback((action: string) => {
    // Track analytics event
    analyticsService.trackEvent('banner_click', {
      action,
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Handle different banner actions
    switch (action) {
      case 'explore':
        navigation.navigate('Search', { query: '', filter: 'all' });
        break;
      case 'latest':
        navigation.navigate('Search', { query: '', filter: 'latest' });
        break;
      case 'safety':
        // Navigate to safety info or help
        break;
      default:
        break;
    }
  }, [navigation]);

  const onSearchPress = useCallback(() => {
    // Track analytics event
    analyticsService.trackEvent('search_click', {
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Navigate to search
    navigation.navigate('Search', { query: '', filter: 'all' });
  }, [navigation]);

  const onCreatePress = useCallback(() => {
    // Track analytics event
    analyticsService.trackEvent('create_click', {
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Navigate to create listing
    navigation.navigate('Create');
  }, [navigation]);

  const onNotificationPress = useCallback(() => {
    // Track analytics event
    analyticsService.trackEvent('notification_click', {
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Navigate to notifications or messages
    navigation.navigate('Messages');
  }, [navigation]);

  const onViewAllPress = useCallback((section: string) => {
    // Track analytics event
    analyticsService.trackEvent('view_all_click', {
      section,
      source: 'home_screen',
      timestamp: new Date().toISOString()
    });

    // Navigate to section-specific search
    navigation.navigate('Search', { query: '', filter: section });
  }, [navigation]);

  const homeActions: HomeActions = {
    onRefresh,
    onListingPress,
    onCategoryPress,
    onFavoriteToggle,
    onBannerPress,
    onSearchPress,
    onCreatePress
  };

  return {
    ...homeActions,
    onNotificationPress,
    onViewAllPress,
    // Mutation states for UI feedback
    isFavoriteToggling: toggleFavoriteMutation.isPending,
    isViewTracking: trackViewMutation.isPending
  };
};

export default useHomeActions;
