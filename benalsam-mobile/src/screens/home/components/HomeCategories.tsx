// ===========================
// HOME CATEGORIES COMPONENT
// ===========================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CategoryCard } from '../../../components';
import { HomeCategoriesProps } from '../types';
import { useThemeColors } from '../../../stores';
import { spacing, margins, paddings, shadows, borderRadius } from '../../../utils/spacing';
import { typography, textPatterns } from '../../../utils/typography';

const HomeCategories: React.FC<HomeCategoriesProps> = ({
  categories,
  onCategoryPress,
  limit,
  isLoading,
  error
}) => {
  const colors = useThemeColors();

  const displayCategories = limit ? categories.slice(0, limit) : categories;

  const renderCategory = ({ item }: { item: any }) => (
    <CategoryCard
      category={item}
      onPress={() => onCategoryPress(item.name)}
      showListingCount={true}
    />
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
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
      <View style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          Takip Edilen Kategoriler
        </Text>
        {renderSkeleton()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          Takip Edilen Kategoriler
        </Text>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  if (displayCategories.length === 0) {
    return (
      <View style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          Takip Edilen Kategoriler
        </Text>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz kategori takip etmiyorsunuz
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.categorySection}>
      <Text style={[styles.categoryTitle, { color: colors.text }]}>
        Takip Edilen Kategoriler
      </Text>
      
      <View style={styles.categoryScrollerSection}>
        <FlashList
          data={displayCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={120}
          contentContainerStyle={styles.horizontalListContainer}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  categorySection: {
    ...margins.t.md,
    ...margins.b.lg,
  },
  categoryTitle: {
    ...textPatterns.cardTitle,
    ...margins.h.md,
    ...margins.b.sm,
  },
  categoryScrollerSection: {
    ...margins.b.sm,
  },
  horizontalListContainer: {
    ...paddings.h.md,
  },
  skeletonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  skeletonCard: {
    width: 120,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
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

export default HomeCategories;
