import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useThemeColors } from '../stores';
import { 
  Grid3X3, 
  List, 
  Package, 
  TrendingUp,
  Search,
  Filter
} from 'lucide-react-native';
import ListingCard from './ListingCard';
import { LoadingSpinner } from './LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

interface SearchResultsProps {
  results: any[];
  isLoading: boolean;
  totalCount: number;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onItemPress?: (item: any) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  emptySubtitle?: string;
  showFilters?: boolean;
  onShowFilters?: () => void;
  screenName?: string; // Analytics için screen adı
  sectionName?: string; // Analytics için section adı
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results = [],
  isLoading = false,
  totalCount = 0,
  viewMode = 'grid',
  onViewModeChange,
  onItemPress,
  onRefresh,
  onLoadMore,
  hasMore = false,
  emptyMessage = 'Sonuç bulunamadı',
  emptySubtitle = 'Farklı anahtar kelimeler deneyin',
  showFilters = false,
  onShowFilters,
  screenName = 'Unknown',
  sectionName = 'Unknown',
}) => {
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      onLoadMore?.();
    }
  }, [isLoading, hasMore, onLoadMore]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <View style={[
      styles.itemContainer,
      viewMode === 'grid' ? styles.gridItem : styles.listItem,
      index % 2 === 0 && viewMode === 'grid' ? styles.gridItemLeft : styles.gridItemRight
    ]}>
      <ListingCard
        listing={item}
        onPress={() => onItemPress?.(item)}
        style={viewMode === 'list' ? styles.listCard : undefined}
        screenName={screenName}
        sectionName={sectionName}
      />
    </View>
  ), [viewMode, onItemPress]);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerInfo}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>
          {totalCount} sonuç
        </Text>
        {showFilters && (
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface }]}
            onPress={onShowFilters}
          >
            <Filter size={16} color={colors.primary} />
            <Text style={[styles.filterButtonText, { color: colors.primary }]}>
              Filtrele
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {onViewModeChange && (
        <View style={[styles.viewModeContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && { backgroundColor: colors.primary }
            ]}
            onPress={() => onViewModeChange('grid')}
          >
            <Grid3X3 
              size={16} 
              color={viewMode === 'grid' ? colors.white : colors.text} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'list' && { backgroundColor: colors.primary }
            ]}
            onPress={() => onViewModeChange('list')}
          >
            <List 
              size={16} 
              color={viewMode === 'list' ? colors.white : colors.text} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <Search size={48} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {emptyMessage}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {emptySubtitle}
      </Text>
    </View>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={[
          styles.skeletonItem,
          viewMode === 'grid' ? styles.skeletonGridItem : styles.skeletonListItem,
          { backgroundColor: colors.surface }
        ]}>
          <View style={[styles.skeletonImage, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonSubtitle, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonPrice, { backgroundColor: colors.border }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderFooter = () => {
    if (isLoading && results.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <LoadingSpinner size="small" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Daha fazla yükleniyor...
          </Text>
        </View>
      );
    }
    return null;
  };

  if (isLoading && results.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderLoadingSkeleton()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.content,
          results.length === 0 && styles.emptyContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              title="Yenileniyor..."
            />
          ) : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        key={viewMode} // Force re-render when view mode changes
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    flex: 1,
    marginBottom: 16,
  },
  gridItem: {
    marginHorizontal: 4,
  },
  gridItemLeft: {
    marginRight: 2,
  },
  gridItemRight: {
    marginLeft: 2,
  },
  listItem: {
    marginHorizontal: 0,
  },
  listCard: {
    marginHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 400,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonGridItem: {
    width: (screenWidth - 48) / 2,
    height: 200,
  },
  skeletonListItem: {
    width: '100%',
    height: 120,
    flexDirection: 'row',
  },
  skeletonImage: {
    borderRadius: 8,
  },
  skeletonContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  skeletonPrice: {
    height: 14,
    borderRadius: 4,
    width: '40%',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
}); 