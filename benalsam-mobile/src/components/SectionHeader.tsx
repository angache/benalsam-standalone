import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ChevronRight, ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '../stores';
import { spacing, margins, paddings } from '../utils/spacing';
import { typography, textPatterns, fontWeight } from '../utils/typography';

interface SectionHeaderProps {
  title: string;
  count?: number;
  showCount?: boolean;
  actionText?: string;
  showAction?: boolean;
  showChevron?: boolean;
  onActionPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  countStyle?: TextStyle;
  actionStyle?: TextStyle;
  testID?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  showCount = false,
  actionText = 'Tümünü Gör',
  showAction = false,
  showChevron = false,
  onActionPress,
  style,
  titleStyle,
  countStyle,
  actionStyle,
  testID,
}) => {
  const colors = useThemeColors();

  const handleActionPress = () => {
    if (onActionPress) {
      onActionPress();
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.leftSection}>
        <Text style={[styles.title, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
        {showCount && count !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.countText, { color: colors.surface }, countStyle]}>
              {count}
            </Text>
          </View>
        )}
      </View>
      
      {(showAction || showChevron) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
          activeOpacity={0.7}
          disabled={!onActionPress}
        >
          {showAction && (
            <Text style={[styles.actionText, { color: colors.primary }, actionStyle]}>
              {actionText}
            </Text>
          )}
          {showChevron && (
            <ChevronRight 
              size={16} 
              color={colors.primary} 
              style={styles.chevron}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...margins.h.md, // marginHorizontal: 16
    ...margins.b.sm, // marginBottom: 12
    ...paddings.v.xs, // paddingVertical: 4
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    ...textPatterns.sectionHeader, // fontSize: 20, fontWeight: 'bold', lineHeight: 28
  },
  countBadge: {
    ...margins.l.sm, // marginLeft: 8
    ...paddings.h.sm, // paddingHorizontal: 8
    ...paddings.v.xs, // paddingVertical: 2
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...typography.badge, // fontSize: 12, fontWeight: 'semibold', lineHeight: 16
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    ...paddings.h.sm, // paddingHorizontal: 8
    ...paddings.v.xs, // paddingVertical: 4
    borderRadius: 8,
  },
  actionText: {
    ...textPatterns.buttonText, // fontSize: 14, fontWeight: 'semibold', lineHeight: 20
  },
  chevron: {
    ...margins.l.xs, // marginLeft: 4
  },
});

export default SectionHeader; 