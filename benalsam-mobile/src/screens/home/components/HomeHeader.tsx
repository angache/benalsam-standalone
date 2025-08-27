// ===========================
// HOME HEADER COMPONENT
// ===========================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search, Plus, X } from 'lucide-react-native';
import { useThemeColors } from '../../../stores';
import { HomeHeaderProps } from '../types';
import { spacing, margins, paddings, shadows, borderRadius } from '../../../utils/spacing';
import { typography, textPatterns } from '../../../utils/typography';

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onSearchPress,
  onCreatePress,
  onNotificationPress,
  user,
  showWelcomeMessage,
  onWelcomeClose
}) => {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <View style={[styles.welcomeSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Hoş geldiniz! 👋
          </Text>
          <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
            İhtiyacınız olan ürünleri hemen bulun ve satın alın.
          </Text>
          <TouchableOpacity
            style={styles.welcomeCloseButton}
            onPress={onWelcomeClose}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onSearchPress}
        >
          <Search size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onCreatePress}
        >
          <Plus size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onNotificationPress}
        >
          <Bell size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  welcomeSection: {
    ...margins.h.md,
    ...margins.v.sm,
    ...paddings.all.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  welcomeText: {
    ...textPatterns.sectionHeader,
    ...margins.b.xs,
  },
  welcomeSubtext: {
    ...typography.body2,
  },
  welcomeCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
});

export default HomeHeader;
