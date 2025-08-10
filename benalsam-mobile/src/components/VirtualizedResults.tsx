import React, { useCallback, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator,
  Text 
} from 'react-native';
import { useThemeColors } from '../stores/themeStore';
import ListingCard from './ListingCard';
import ListingListItem from './ListingListItem';

interface VirtualizedResultsProps {
  data: any[];
  viewMode: 'grid' | 'list';
  onItemPress: (item: any) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMoreData?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  screenName?: string; // Analytics için screen adı
  sectionName?: string; // Analytics için section adı
}

const VirtualizedResults: React.FC<VirtualizedResultsProps> = ({
  data,
  viewMode,
  onItemPress,
  onRefresh,
  onLoadMore,
  isLoading = false,
  isRefreshing = false,
  hasMoreData = false,
  emptyMessage = 'Sonuç bulunamadı',
  loadingMessage = 'Yükleniyor...',
  error = null,
  onRetry,
  screenName = 'Unknown',
  sectionName = 'Unknown',
}) => {
  const colors = useThemeColors();

  // Performance optimizations
  const keyExtractor = useCallback((item: any) => item.id?.toString() || Math.random().toString(), []);
  
  const getItemLayout = useCallback((data: ArrayLike<any> | null | undefined, index: number) => {
    const itemHeight = viewMode === 'grid' ? 280 : 120; // Approximate heights
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  }, [viewMode]);

  // Render item with memoization
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (viewMode === 'grid') {
      return (
        <View style={[styles.gridItem, { marginLeft: index % 2 === 0 ? 0 : 8 }]}>
          <ListingCard
            listing={item}
            onPress={() => onItemPress(item)}
            screenName={screenName}
            sectionName={sectionName}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.listItem}>
          <ListingListItem
            listing={item}
            onPress={() => onItemPress(item)}
          />
        </View>
      );
    }
  }, [viewMode, onItemPress]);

  // Empty state component
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {emptyMessage}
      </Text>
    </View>
  ), [emptyMessage, colors.textSecondary]);

  // Loading footer component
  const renderFooterComponent = useCallback(() => {
    if (!hasMoreData || !isLoading) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {loadingMessage}
        </Text>
      </View>
    );
  }, [hasMoreData, isLoading, loadingMessage, colors.primary, colors.textSecondary]);

  // Error component
  const renderErrorComponent = useCallback(() => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
        {onRetry && (
          <Text 
            style={[styles.retryText, { color: colors.primary }]}
            onPress={onRetry}
          >
            Tekrar Dene
          </Text>
        )}
      </View>
    );
  }, [error, onRetry, colors.error, colors.primary]);

  // Optimized FlatList configuration
  const flatListProps = useMemo(() => ({
    data,
    keyExtractor,
    renderItem,
    getItemLayout,
    numColumns: viewMode === 'grid' ? 2 : 1,
    columnWrapperStyle: viewMode === 'grid' ? styles.row : undefined,
    contentContainerStyle: [
      styles.contentContainer,
      data.length === 0 && styles.emptyContentContainer
    ],
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 50,
    onEndReachedThreshold: 0.5,
    onEndReached: hasMoreData ? onLoadMore : undefined,
    ListEmptyComponent: renderEmptyComponent,
    ListFooterComponent: renderFooterComponent,
    ListHeaderComponent: error ? renderErrorComponent : undefined,
    refreshControl: onRefresh ? (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        colors={[colors.primary]}
        tintColor={colors.primary}
      />
    ) : undefined,
  }), [
    data,
    keyExtractor,
    renderItem,
    getItemLayout,
    viewMode,
    hasMoreData,
    onLoadMore,
    renderEmptyComponent,
    renderFooterComponent,
    renderErrorComponent,
    onRefresh,
    isRefreshing,
    error,
    colors.primary,
  ]);

  return (
    <View style={styles.container}>
      <FlatList {...flatListProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
  },
  listItem: {
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default VirtualizedResults; 