// ===========================
// TOGGLE ITEM COMPONENT
// ===========================

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { ToggleItemProps } from '../types';
import { createStyles } from '../utils/styles';

const ToggleItem: React.FC<ToggleItemProps> = ({ item, colors }) => {
  const styles = createStyles(colors);

  return (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      
      <View style={styles.toggleContainer}>
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={item.value ? colors.primary : colors.textSecondary}
          ios_backgroundColor={colors.border}
        />
      </View>
    </View>
  );
};

export default ToggleItem;
