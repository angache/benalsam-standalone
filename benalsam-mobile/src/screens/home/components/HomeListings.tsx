// ===========================
// HOME LISTINGS COMPONENT
// ===========================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ListingCard } from '../../../components';
import { HomeListingsProps } from '../types';
import { useThemeColors } from '../../../stores';
import { spacing, margins, paddings, shadows, borderRadius } from '../../../utils/spacing';
import { typography, textPatterns } from '../../../utils/typography';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');
const SIDE_PADDING = spacing.md;
const CARD_GAP = spacing.lg;

const HomeListings: React.FC<HomeListingsProps> = ({
  listings,
  onListingPress,
  onFavoriteToggle,
  contentType = 'grid',
  limit,
  isLoading,
  error,
  title,
  onViewAllPress
}) => {
  const colors = useThemeColors();

  const getNumColumns = () => {
    switch (contentType) {
      case 'compact':
        return 3;
      case 'list':
        return 1;
      case 'grid':
      default:
        return 2;
    }
  };

  const getItemWidth = () => {
    const numColumns = getNumColumns();
    return (screenWidth - SIDE_PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns;
  };

  const displayListings = limit ? listings.slice(0, limit) : listings;

  const renderListing = ({ item, index }: { item: any; index: number }) => (
    <View style={[
      styles.gridItem,
      { width: getItemWidth() },
      index % getNumColumns() === 0 && styles.gridItemFirst,
      index % getNumColumns() === getNumColumns() - 1 && styles.gridItemLast
    ]}>
      <ListingCard
        listing={item}
        onPress={() => onListingPress(item.id)}
        onFavoriteToggle={() => onFavoriteToggle(item.id)}
        compact={contentType === 'compact'}
      />
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.border }
          ]}
        />
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        {title && (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        )}
        {renderSkeleton()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        {title && (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        )}
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  if (displayListings.length === 0) {
    return (
      <View style={styles.section}>
        {title && (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        )}
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz ilan bulunmuyor
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {title && (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        )}
        {onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              Tümünü Gör
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {contentType === 'list' ? (
        <View style={styles.listContainer}>
          <FlashList
            data={displayListings}
            renderItem={renderListing}
            keyExtractor={(item) => item.id}
            estimatedItemSize={200}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.gridContainer}>
          <FlashList
            data={displayListings}
            renderItem={renderListing}
            keyExtractor={(item) => item.id}
            numColumns={getNumColumns()}
            estimatedItemSize={260}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    ...margins.v.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...margins.h.md,
    ...margins.b.sm,
  },
  sectionTitle: {
    ...textPatterns.sectionHeader,
  },
  viewAllText: {
    ...typography.body2,
    fontWeight: '600',
  },
  listContainer: {
    ...paddings.h.md,
  },
  gridContainer: {
    paddingHorizontal: SIDE_PADDING,
  },
  gridContent: {
    paddingBottom: spacing.lg,
  },
  gridItem: {
    marginBottom: CARD_GAP,
    marginRight: CARD_GAP,
  },
  gridItemFirst: {
    marginLeft: 0,
  },
  gridItemLast: {
    marginRight: 0,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE_PADDING,
  },
  skeletonCard: {
    width: (screenWidth - SIDE_PADDING * 2 - CARD_GAP) / 2,
    height: 260,
    borderRadius: borderRadius.md,
    ...margins.b.md,
    marginHorizontal: CARD_GAP / 2,
    overflow: 'hidden',
  },
  errorContainer: {
    ...paddings.all.md,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body2,
    textAlign: 'center',
  },
  emptyContainer: {
    ...paddings.all.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body2,
    textAlign: 'center',
  },
});

export default HomeListings;
