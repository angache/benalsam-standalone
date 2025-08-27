// ===========================
// HOME STATS COMPONENT
// ===========================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { HomeStatsProps, Stat } from '../types';
import { useThemeColors } from '../../../stores';
import { spacing, margins, paddings, shadows, borderRadius } from '../../../utils/spacing';
import { typography, fontWeight } from '../../../utils/typography';

const HomeStats: React.FC<HomeStatsProps> = ({
  stats,
  onStatPress
}) => {
  const colors = useThemeColors();

  const getStatColor = (color: string) => {
    switch (color) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.primary;
    }
  };

  const renderStat = ({ item }: { item: Stat }) => {
    const IconComponent = item.icon;
    const statColor = getStatColor(item.color);

    return (
      <TouchableOpacity
        style={[
          styles.statCard,
          { backgroundColor: colors.card }
        ]}
        onPress={() => onStatPress?.(item)}
        activeOpacity={0.8}
      >
        <IconComponent size={24} color={statColor} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {item.value}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (stats.length === 0) return null;

  return (
    <View style={styles.statsSection}>
      <FlashList
        data={stats}
        renderItem={renderStat}
        keyExtractor={(item, index) => `stat-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={100}
        contentContainerStyle={styles.statsContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: 0,
  },
  statsContainer: {
    paddingHorizontal: 8,
  },
  statCard: {
    width: 100,
    ...paddings.all.md,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.h2,
    fontWeight: fontWeight.extrabold,
    ...margins.t.sm,
    ...margins.b.xs,
  },
  statLabel: {
    ...typography.caption1,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
});

export default HomeStats;
