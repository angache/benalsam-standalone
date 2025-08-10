import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { ArrowLeft, Eye, Phone, MapPin, MessageCircle } from 'lucide-react-native';
import { updateUserProfile, getUserProfile } from '../services/supabaseService';
import type { UserProfile } from '../types';

const PrivacyScreen = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Privacy preferences
  const [showPhone, setShowPhone] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data: userProfile } = await getUserProfile(user?.id || '');
      if (userProfile) {
        setProfile(userProfile);
        // Set initial states based on profile preferences
        setShowPhone(userProfile.privacy_preferences?.show_phone ?? false);
        setShowLocation(userProfile.privacy_preferences?.show_location ?? false);
        setAllowMessages(userProfile.privacy_preferences?.allow_messages ?? true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handlePreferenceUpdate = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const { error } = await updateUserProfile(user.id, updates);
      if (error) {
        Alert.alert('Hata', 'Tercihleriniz kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Hata', 'Tercihleriniz kaydedilirken bir hata oluştu.');
    }
  };

  const renderToggleItem = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        {icon}
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Gizlilik
        </Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderToggleItem(
            'Telefon Numarası',
            'Telefon numaranızın görünürlüğü',
            <Phone size={20} color={colors.primary} />,
            showPhone,
            (value) => {
              setShowPhone(value);
              handlePreferenceUpdate({
                privacy_preferences: {
                  ...profile?.privacy_preferences,
                  show_phone: value
                }
              });
            }
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderToggleItem(
            'Konum',
            'Konumunuzun görünürlüğü',
            <MapPin size={20} color={colors.primary} />,
            showLocation,
            (value) => {
              setShowLocation(value);
              handlePreferenceUpdate({
                privacy_preferences: {
                  ...profile?.privacy_preferences,
                  show_location: value
                }
              });
            }
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderToggleItem(
            'Mesajlaşma',
            'Diğer kullanıcılardan mesaj alma',
            <MessageCircle size={20} color={colors.primary} />,
            allowMessages,
            (value) => {
              setAllowMessages(value);
              handlePreferenceUpdate({
                privacy_preferences: {
                  ...profile?.privacy_preferences,
                  allow_messages: value
                }
              });
            }
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});

export default PrivacyScreen; 