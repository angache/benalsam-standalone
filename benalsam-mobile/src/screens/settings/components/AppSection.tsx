// ===========================
// APP SECTION COMPONENT
// ===========================

import React from 'react';
import { View, Text } from 'react-native';
import { Smartphone, Globe, Moon, Sun } from 'lucide-react-native';
import { AppSectionProps } from '../types';
import { createStyles } from '../utils/styles';
import SettingItem from './SettingItem';

const AppSection: React.FC<AppSectionProps> = ({ 
  platformPreferences, 
  onNavigate, 
  colors 
}) => {
  const styles = createStyles(colors);

  const appItems = [
    {
      id: 'language',
      title: 'Dil',
      subtitle: platformPreferences.language === 'tr' ? 'Türkçe' : 'English',
      icon: Globe,
      onPress: () => {
        // Language selection logic will be handled by parent
      }
    },
    {
      id: 'currency',
      title: 'Para Birimi',
      subtitle: platformPreferences.currency === 'TRY' ? 'Türk Lirası (₺)' : 'USD ($)',
      icon: Smartphone,
      onPress: () => {
        // Currency selection logic will be handled by parent
      }
    },
    {
      id: 'theme',
      title: 'Tema',
      subtitle: 'Otomatik',
      icon: Moon,
      onPress: () => {
        // Theme selection logic will be handled by parent
      }
    }
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Smartphone size={24} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitleText}>Uygulama</Text>
      </View>
      
      {appItems.map((item) => (
        <SettingItem
          key={item.id}
          item={item}
          colors={colors}
        />
      ))}
    </View>
  );
};

export default AppSection;
