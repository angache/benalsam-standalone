// ===========================
// NOTIFICATION SECTION COMPONENT
// ===========================

import React from 'react';
import { View, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { NotificationSectionProps } from '../types';
import { createStyles } from '../utils/styles';
import SettingItem from './SettingItem';

const NotificationSection: React.FC<NotificationSectionProps> = ({ 
  notificationPreferences, 
  onNavigate, 
  colors 
}) => {
  const styles = createStyles(colors);

  const notificationItems = [
    {
      id: 'notification-preferences',
      title: 'Bildirim Tercihleri',
      subtitle: 'Push ve e-posta bildirimlerini yönetin',
      icon: Bell,
      onPress: () => onNavigate('NotificationPreferences', {
        preferences: notificationPreferences,
        onUpdate: (preferences) => {
          // This will be handled by the parent component
        }
      })
    }
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Bell size={24} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitleText}>Bildirimler</Text>
      </View>
      
      {notificationItems.map((item) => (
        <SettingItem
          key={item.id}
          item={item}
          colors={colors}
        />
      ))}
    </View>
  );
};

export default NotificationSection;
