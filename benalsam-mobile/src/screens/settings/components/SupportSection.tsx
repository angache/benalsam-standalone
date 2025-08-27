// ===========================
// SUPPORT SECTION COMPONENT
// ===========================

import React from 'react';
import { View, Text } from 'react-native';
import { HelpCircle, MessageCircle, Star, Info } from 'lucide-react-native';
import { SupportSectionProps } from '../types';
import { createStyles } from '../utils/styles';
import SettingItem from './SettingItem';

const SupportSection: React.FC<SupportSectionProps> = ({ onNavigate, colors }) => {
  const styles = createStyles(colors);

  const supportItems = [
    {
      id: 'help',
      title: 'Yardım',
      subtitle: 'Sık sorulan sorular ve rehberler',
      icon: HelpCircle,
      onPress: () => onNavigate('Help')
    },
    {
      id: 'contact',
      title: 'İletişim',
      subtitle: 'Destek ekibiyle iletişime geçin',
      icon: MessageCircle,
      onPress: () => onNavigate('Contact')
    },
    {
      id: 'feedback',
      title: 'Geri Bildirim',
      subtitle: 'Uygulama hakkında görüşlerinizi paylaşın',
      icon: Star,
      onPress: () => onNavigate('Feedback')
    },
    {
      id: 'about',
      title: 'Hakkında',
      subtitle: 'Uygulama versiyonu ve lisans bilgileri',
      icon: Info,
      onPress: () => onNavigate('About')
    }
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <HelpCircle size={24} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitleText}>Destek</Text>
      </View>
      
      {supportItems.map((item) => (
        <SettingItem
          key={item.id}
          item={item}
          colors={colors}
        />
      ))}
    </View>
  );
};

export default SupportSection;
