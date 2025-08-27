// ===========================
// MAIN HOME SCREEN
// ===========================

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Clock, Star, Users } from 'lucide-react-native';
import { useThemeColors } from '../../stores';
import { useUserPreferencesContext } from '../../contexts/UserPreferencesContext';
import { useAuthStore } from '../../stores';

// Custom components
import HomeHeader from './components/HomeHeader';
import HomeBanner from './components/HomeBanner';
import HomeStats from './components/HomeStats';
import HomeListings from './components/HomeListings';
import HomeCategories from './components/HomeCategories';

// Custom hooks
import useHomeData from './hooks/useHomeData';
import useHomeActions from './hooks/useHomeActions';
import useHomePerformance from './hooks/useHomePerformance';

// Types
import { Banner, Stat, HomePreferences } from './types';

const HomeScreen: React.FC = () => {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { preferences } = useUserPreferencesContext();
  
  // Custom hooks
  const { data, isLoading, error } = useHomeData();
  const actions = useHomeActions();
  const performance = useHomePerformance();

  // Local state
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Constants
  const BANNERS: Banner[] = [
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

  const STATS: Stat[] = [
    { icon: Users, value: '50K+', label: 'Aktif Kullanıcı', color: 'primary' },
    { icon: TrendingUp, value: '125K+', label: 'Alım İlanı', color: 'success' },
    { icon: Star, value: '89%', label: 'Memnuniyet', color: 'warning' },
    { icon: Clock, value: '24/7', label: 'Destek', color: 'info' },
  ];

  const PROGRESSIVE_DISCLOSURE_LIMITS = {
    MOST_OFFERED: 10,
    POPULAR: 10,
    TODAYS_DEALS: 6,
    NEW_LISTINGS: 12,
    FOLLOWED_CATEGORIES: 5,
  };

  // Effects
  useEffect(() => {
    performance.startPerformanceTracking();
  }, []);

  useEffect(() => {
    if (!isLoading && !error) {
      performance.endLoadingTracking();
    }
  }, [isLoading, error]);

  useEffect(() => {
    if (error) {
      performance.setError(error.message || 'Unknown error');
    }
  }, [error]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    performance.setRefreshing(true);
    
    try {
      actions.onRefresh();
      // Wait for data to refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
      performance.setRefreshing(false);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcomeMessage(false);
  };

  const handleViewAllPress = (section: string) => {
    actions.onViewAllPress(section);
  };

  // Render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <HomeHeader
          onSearchPress={actions.onSearchPress}
          onCreatePress={actions.onCreatePress}
          onNotificationPress={actions.onNotificationPress}
          user={user}
          showWelcomeMessage={showWelcomeMessage}
          onWelcomeClose={handleWelcomeClose}
        />

        {/* Banner Section */}
        <HomeBanner
          banners={BANNERS}
          onBannerPress={actions.onBannerPress}
          autoPlay={true}
          interval={3000}
        />

        {/* Stats Section */}
        <HomeStats
          stats={STATS}
          onStatPress={(stat) => {
            // Handle stat press
          }}
        />

        {/* Most Offered Listings */}
        <HomeListings
          listings={data.mostOfferedListings}
          onListingPress={actions.onListingPress}
          onFavoriteToggle={actions.onFavoriteToggle}
          contentType={preferences.contentTypePreference}
          limit={PROGRESSIVE_DISCLOSURE_LIMITS.MOST_OFFERED}
          isLoading={isLoading}
          error={error?.message}
          title="En Çok Teklif Alanlar"
          onViewAllPress={() => handleViewAllPress('most-offered')}
        />

        {/* Today's Deals */}
        <HomeListings
          listings={data.todaysDeals}
          onListingPress={actions.onListingPress}
          onFavoriteToggle={actions.onFavoriteToggle}
          contentType={preferences.contentTypePreference}
          limit={PROGRESSIVE_DISCLOSURE_LIMITS.TODAYS_DEALS}
          isLoading={isLoading}
          error={error?.message}
          title="Günün Fırsatları"
          onViewAllPress={() => handleViewAllPress('todays-deals')}
        />

        {/* Popular Listings */}
        <HomeListings
          listings={data.popularListings}
          onListingPress={actions.onListingPress}
          onFavoriteToggle={actions.onFavoriteToggle}
          contentType={preferences.contentTypePreference}
          limit={PROGRESSIVE_DISCLOSURE_LIMITS.POPULAR}
          isLoading={isLoading}
          error={error?.message}
          title="Popüler İlanlar"
          onViewAllPress={() => handleViewAllPress('popular')}
        />

        {/* Followed Categories */}
        <HomeCategories
          categories={data.followedCategoryListings}
          onCategoryPress={actions.onCategoryPress}
          limit={PROGRESSIVE_DISCLOSURE_LIMITS.FOLLOWED_CATEGORIES}
          isLoading={isLoading}
          error={error?.message}
        />

        {/* Recent Views */}
        {data.recentViews.length > 0 && (
          <HomeListings
            listings={data.recentViews}
            onListingPress={actions.onListingPress}
            onFavoriteToggle={actions.onFavoriteToggle}
            contentType={preferences.contentTypePreference}
            limit={6}
            isLoading={isLoading}
            error={error?.message}
            title="Son Görüntülenenler"
            onViewAllPress={() => handleViewAllPress('recent-views')}
          />
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <HomeListings
            listings={data.recommendations}
            onListingPress={actions.onListingPress}
            onFavoriteToggle={actions.onFavoriteToggle}
            contentType={preferences.contentTypePreference}
            limit={8}
            isLoading={isLoading}
            error={error?.message}
            title="Sizin İçin Öneriler"
            onViewAllPress={() => handleViewAllPress('recommendations')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default HomeScreen;
