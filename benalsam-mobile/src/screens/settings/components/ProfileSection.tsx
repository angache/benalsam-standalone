// ===========================
// PROFILE SECTION COMPONENT
// ===========================

import React from 'react';
import { View, Text } from 'react-native';
import { User, Shield, Award } from 'lucide-react-native';
import { ProfileSectionProps } from '../types';
import { createStyles } from '../utils/styles';
import SettingItem from './SettingItem';

const ProfileSection: React.FC<ProfileSectionProps> = ({ userProfile, onNavigate, colors }) => {
  const styles = createStyles(colors);

  const profileItems = [
    {
      id: 'edit-profile',
      title: 'Profili Düzenle',
      subtitle: userProfile?.full_name || 'Adınızı ve bilgilerinizi güncelleyin',
      icon: User,
      onPress: () => onNavigate('EditProfile')
    },
    {
      id: 'security',
      title: 'Güvenlik',
      subtitle: 'Şifre, 2FA ve güvenlik ayarları',
      icon: Shield,
      onPress: () => onNavigate('Security')
    },
    {
      id: 'trust-score',
      title: 'Güven Puanı',
      subtitle: userProfile?.trust_score ? `${userProfile.trust_score}/100` : 'Güven puanınızı görüntüleyin',
      icon: Award,
      onPress: () => onNavigate('TrustScore', { userId: userProfile?.id })
    }
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <User size={24} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitleText}>Profil</Text>
      </View>
      
      {profileItems.map((item) => (
        <SettingItem
          key={item.id}
          item={item}
          colors={colors}
        />
      ))}
    </View>
  );
};

export default ProfileSection;
