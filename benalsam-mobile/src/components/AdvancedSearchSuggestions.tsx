import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Clock, TrendingUp, Search, Tag, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '../stores/themeStore';
import { useSearchSuggestions, SearchSuggestion } from '../hooks/useSearchSuggestions';

interface AdvancedSearchSuggestionsProps {
  query: string;
  onSuggestionPress: (text: string) => void;
  visible: boolean;
  maxSuggestions?: number;
  enablePullToRefresh?: boolean;
}

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  onPress: (text: string) => void;
  colors: any;
}

interface SuggestionGroupProps {
  title: string;
  suggestions: SearchSuggestion[];
  onSuggestionPress: (text: string) => void;
  colors: any;
  showClearButton?: boolean;
  onClearPress?: () => void;
}

// Memoized suggestion item component
const SuggestionItem = memo<SuggestionItemProps>(({ suggestion, onPress, colors }) => {
  const handlePress = useCallback(() => {
    onPress(suggestion.text);
  }, [suggestion.text, onPress]);

  const iconProps = useMemo(() => {
    switch (suggestion.type) {
      case 'recent':
        return { icon: Clock, color: colors.textSecondary };
      case 'popular':
        return { icon: TrendingUp, color: colors.primary };
      case 'category':
        return { icon: Tag, color: colors.warning };
      case 'similar':
        return { icon: Search, color: colors.success };
      default:
        return { icon: Search, color: colors.text };
    }
  }, [suggestion.type, colors]);

  const IconComponent = iconProps.icon;

  return (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <IconComponent size={16} color={iconProps.color} style={styles.icon} />
      <Text 
        style={[styles.suggestionText, { color: colors.text }]} 
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {suggestion.text}
      </Text>
      {suggestion.relevance && suggestion.relevance < 0.8 && (
        <View style={[styles.relevanceBadge, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.relevanceText, { color: colors.textSecondary }]}>
            {Math.round(suggestion.relevance * 100)}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

SuggestionItem.displayName = 'SuggestionItem';

// Memoized suggestion group component
const SuggestionGroup = memo<SuggestionGroupProps>(({ 
  title, 
  suggestions, 
  onSuggestionPress, 
  colors, 
  showClearButton, 
  onClearPress 
}) => {
  const handleClearPress = useCallback(() => {
    onClearPress?.();
  }, [onClearPress]);

  const renderSuggestionItem = useCallback(({ item }: { item: SearchSuggestion }) => (
    <SuggestionItem
      suggestion={item}
      onPress={onSuggestionPress}
      colors={colors}
    />
  ), [onSuggestionPress, colors]);

  const keyExtractor = useCallback((item: SearchSuggestion) => item.id, []);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
        {showClearButton && (
          <TouchableOpacity onPress={handleClearPress} activeOpacity={0.7}>
            <Text style={[styles.clearButton, { color: colors.primary }]}>
              Temizle
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={suggestions}
        renderItem={renderSuggestionItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={3}
      />
    </View>
  );
});

SuggestionGroup.displayName = 'SuggestionGroup';

// Error boundary component
const ErrorFallback = memo<{ error: string; colors: any; onRetry: () => void }>(({ 
  error, 
  colors, 
  onRetry 
}) => (
  <View style={styles.errorContainer}>
    <AlertCircle size={24} color={colors.error} style={styles.errorIcon} />
    <Text style={[styles.errorText, { color: colors.textSecondary }]}>
      Öneriler yüklenirken hata oluştu
    </Text>
    <TouchableOpacity 
      style={[styles.retryButton, { backgroundColor: colors.primary }]} 
      onPress={onRetry}
      activeOpacity={0.8}
    >
      <Text style={[styles.retryButtonText, { color: colors.white }]}>
        Tekrar Dene
      </Text>
    </TouchableOpacity>
  </View>
));

ErrorFallback.displayName = 'ErrorFallback';

// Main component
const AdvancedSearchSuggestions: React.FC<AdvancedSearchSuggestionsProps> = ({
  query,
  onSuggestionPress,
  visible,
  maxSuggestions = 15,
  enablePullToRefresh = true,
}) => {
  const colors = useThemeColors();

  // Custom hook for suggestions
  const {
    suggestions,
    loading,
    error,
    clearHistory,
    addToRecentSearches,
    refreshSuggestions,
  } = useSearchSuggestions(query, visible, {
    maxSuggestions,
    debounceMs: 300,
    enableCategorySuggestions: true,
    enableSimilarTitles: true,
    enablePopularSearches: true,
    enableRecentSearches: true,
  });

  // Group suggestions by type
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, SearchSuggestion[]> = {};
    
    suggestions.forEach(suggestion => {
      if (!groups[suggestion.type]) {
        groups[suggestion.type] = [];
      }
      groups[suggestion.type].push(suggestion);
    });

    return groups;
  }, [suggestions]);

  // Handle suggestion press
  const handleSuggestionPress = useCallback(async (text: string) => {
    console.log('🔍 AdvancedSearchSuggestions - Suggestion pressed:', text);
    
    // Add to recent searches
    await addToRecentSearches(text);
    
    // Call parent callback
    onSuggestionPress(text);
  }, [addToRecentSearches, onSuggestionPress]);

  // Handle clear history
  const handleClearHistory = useCallback(async () => {
    await clearHistory();
  }, [clearHistory]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  // Render suggestion group
  const renderSuggestionGroup = useCallback(({ item }: { item: [string, SearchSuggestion[]] }) => {
    const [type, typeSuggestions] = item;
    
    const groupConfig = {
      recent: { title: 'Son Aramalar', showClearButton: true },
      popular: { title: 'Popüler Aramalar', showClearButton: false },
      category: { title: 'Kategori Önerileri', showClearButton: false },
      similar: { title: 'Benzer İlanlar', showClearButton: false },
    };

    const config = groupConfig[type as keyof typeof groupConfig] || { 
      title: 'Öneriler', 
      showClearButton: false 
    };

    return (
      <SuggestionGroup
        title={config.title}
        suggestions={typeSuggestions}
        onSuggestionPress={handleSuggestionPress}
        colors={colors}
        showClearButton={config.showClearButton}
        onClearPress={type === 'recent' ? handleClearHistory : undefined}
      />
    );
  }, [handleSuggestionPress, colors, handleClearHistory]);

  // Key extractor for groups
  const keyExtractor = useCallback((item: [string, SearchSuggestion[]]) => item[0], []);

  // Refresh control
  const refreshControl = useMemo(() => {
    if (!enablePullToRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={loading}
        onRefresh={refreshSuggestions}
        tintColor={colors.primary}
        colors={[colors.primary]}
        progressBackgroundColor={colors.background}
      />
    );
  }, [loading, refreshSuggestions, colors, enablePullToRefresh]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <ErrorFallback error={error} colors={colors} onRetry={handleRetry} />
      ) : (
        <FlatList
          data={Object.entries(groupedSuggestions)}
          renderItem={renderSuggestionGroup}
          keyExtractor={keyExtractor}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={2}
          getItemLayout={(data, index) => ({
            length: 200, // Estimated height
            offset: 200 * index,
            index,
          })}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Öneriler yükleniyor...
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Search size={24} color={colors.textSecondary} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Öneri bulunamadı
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listContainer: {
    paddingVertical: 8,
  },
  group: {
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  relevanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  relevanceText: {
    fontSize: 10,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default memo(AdvancedSearchSuggestions); 