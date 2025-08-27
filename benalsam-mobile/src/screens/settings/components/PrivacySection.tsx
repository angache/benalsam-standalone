// ===========================
// PRIVACY SECTION COMPONENT
// ===========================

import React from 'react';
import { View, Text } from 'react-native';
import { Shield, Eye, UserX } from 'lucide-react-native';
import { PrivacySectionProps } from '../types';
import { createStyles } from '../utils/styles';
import SettingItem from './SettingItem';

const PrivacySection: React.FC<PrivacySectionProps> = ({ 
  chatPreferences, 
  onNavigate, 
  colors 
}) => {
  const styles = createStyles(colors);

  const privacyItems = [
    {
      id: 'privacy',
      title: 'Gizlilik',
      subtitle: 'Profil görünürlüğü ve gizlilik ayarları',
      icon: Eye,
      onPress: () => onNavigate('Privacy')
    },
    {
      id: 'chat-preferences',
      title: 'Sohbet Tercihleri',
      subtitle: 'Okundu bilgisi ve son görülme ayarları',
      icon: Shield,
      onPress: () => onNavigate('ChatPreferences', {
        preferences: chatPreferences,
        onUpdate: (preferences) => {
          // This will be handled by the parent component
        }
      })
    },
    {
      id: 'blocked-users',
      title: 'Engellenen Kullanıcılar',
      subtitle: 'Engellediğiniz kullanıcıları yönetin',
      icon: UserX,
      onPress: () => onNavigate('BlockedUsers')
    }
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Shield size={24} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitleText}>Gizlilik</Text>
      </View>
      
      {privacyItems.map((item) => (
        <SettingItem
          key={item.id}
          item={item}
          colors={colors}
        />
      ))}
    </View>
  );
};

export default PrivacySection;
