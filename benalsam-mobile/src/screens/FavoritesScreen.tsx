import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import Header from '../components/Header';
import ListingCard from '../components/ListingCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useFavoriteListings } from '../hooks/queries/useFavorites';
import { Listing } from '../types';

interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const FavoritesScreen = ({ navigation }: NavigationProps) => {
  const colors = useThemeColors();
  const { user } = useAuthStore();

  const {
    data: favorites,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useFavoriteListings();

  const onRefresh = () => {
    refetch();
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Favorilerinizi görmek için giriş yapmalısınız
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.error }]}>
            {error instanceof Error ? error.message : 'Favoriler yüklenirken bir hata oluştu'}
          </Text>
        </View>
      </View>
    );
  }

  const renderFavoriteItem = ({ item }: { item: Listing }) => (
    <ListingCard
      listing={item}
      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
      screenName="FavoritesScreen"
      sectionName="Favorites"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>Favorilerim</Text>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz favori ilanınız yok
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FavoritesScreen; 