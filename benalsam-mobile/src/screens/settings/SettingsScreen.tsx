// ===========================
// MAIN SETTINGS SCREEN
// ===========================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { LogOut } from 'lucide-react-native';

// Components
import ProfileSection from './components/ProfileSection';
import NotificationSection from './components/NotificationSection';
import PrivacySection from './components/PrivacySection';
import AppSection from './components/AppSection';
import SupportSection from './components/SupportSection';

// Hooks
import useSettingsData from './hooks/useSettingsData';
import useSettingsActions from './hooks/useSettingsActions';

// Utils
import { createStyles } from './utils/styles';
import { useThemeColors } from '../../stores';

// Types
import { SettingsScreenProps } from './types';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  // Data and actions
  const { data, refreshData } = useSettingsData();
  const actions = useSettingsActions(navigation.navigate, refreshData);

  const { userProfile, isLoading, isRefreshing, error } = data;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={[colors.primary]}
            tintColor={colors.primary}
            style={styles.refreshControl}
          />
        }
      >
        {/* Profile Section */}
        <ProfileSection
          userProfile={userProfile}
          onNavigate={actions.onNavigate}
          colors={colors}
        />

        {/* Notification Section */}
        <NotificationSection
          notificationPreferences={userProfile?.notification_preferences}
          onNavigate={actions.onNavigate}
          colors={colors}
        />

        {/* Privacy Section */}
        <PrivacySection
          chatPreferences={userProfile?.chat_preferences}
          onNavigate={actions.onNavigate}
          colors={colors}
        />

        {/* App Section */}
        <AppSection
          platformPreferences={userProfile?.platform_preferences}
          onNavigate={actions.onNavigate}
          colors={colors}
        />

        {/* Support Section */}
        <SupportSection
          onNavigate={actions.onNavigate}
          colors={colors}
        />

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={actions.onLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
