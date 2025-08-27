// ===========================
// SETTING ITEM COMPONENT
// ===========================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SettingItemProps } from '../types';
import { createStyles } from '../utils/styles';

const SettingItem: React.FC<SettingItemProps> = ({ item, colors }) => {
  const styles = createStyles(colors);
  const IconComponent = item.icon;

  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconComponent size={20} color={colors.primary} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      
      <View style={styles.chevronContainer}>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

export default SettingItem;
