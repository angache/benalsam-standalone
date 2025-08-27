// ===========================
// SETTINGS SCREEN TYPES
// ===========================

import { NavigationProp } from '@react-navigation/native';
import type { 
  District, 
  Province, 
  Currency, 
  Language, 
  Category,
  UserProfile as UserProfileType,
} from '../../types';
import type { RootStackParamList as RootStackParamListType } from '../../types/navigation';

export interface NotificationPreferences {
  new_offer_push: boolean;
  new_offer_email: boolean;
  new_message_push: boolean;
  new_message_email: boolean;
  review_push: boolean;
  review_email: boolean;
  summary_emails: 'daily' | 'weekly' | 'never';
}

export interface ChatPreferences {
  read_receipts: boolean;
  show_last_seen: boolean;
  auto_scroll_messages: boolean;
}

export interface PlatformPreferences {
  language: string;
  currency: string;
  default_location_province?: string;
  default_location_district?: string;
  default_category?: string;
}

export interface UserProfile extends UserProfileType {
  platform_preferences: PlatformPreferences;
  notification_preferences: NotificationPreferences;
  chat_preferences: ChatPreferences;
}

export interface RootStackParamList extends RootStackParamListType {
  Settings: undefined;
  EditProfile: undefined;
  Security: undefined;
  NotificationPreferences: {
    preferences: NotificationPreferences | undefined;
    onUpdate: (preferences: NotificationPreferences) => void;
  };
  Privacy: undefined;
  BlockedUsers: undefined;
  ChatPreferences: {
    preferences: ChatPreferences | undefined;
    onUpdate: (preferences: ChatPreferences) => void;
  };
  Help: undefined;
  Contact: undefined;
  Feedback: undefined;
  About: undefined;
  Login: undefined;
  TrustScore: { userId: string | undefined };
}

export interface ErrorBoundaryProps {
  error: Error;
  resetError: () => void;
}

export interface SettingsScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  onPress?: () => void;
}

export interface ToggleItem {
  id: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export interface ThemeColors {
  primary: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  background: string;
  error: string;
  white: string;
  black: string;
}

export interface SettingsData {
  userProfile: UserProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface SettingsActions {
  onRefresh: () => void;
  onLogout: () => void;
  onUpdateNotificationPreferences: (preferences: NotificationPreferences) => void;
  onUpdateChatPreferences: (preferences: ChatPreferences) => void;
  onUpdatePlatformPreferences: (preferences: PlatformPreferences) => void;
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void;
}

export interface ProfileSectionProps {
  userProfile: UserProfile | null;
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void;
}

export interface NotificationSectionProps {
  notificationPreferences: NotificationPreferences;
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void;
}

export interface PrivacySectionProps {
  chatPreferences: ChatPreferences;
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void;
}

export interface AppSectionProps {
  platformPreferences: PlatformPreferences;
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void;
}

export interface SupportSectionProps {
  onNavigate: (screen: keyof RootStackParamList, params?: any) => void;
}

export interface SettingItemProps {
  item: SettingItem;
  colors: ThemeColors;
}

export interface ToggleItemProps {
  item: ToggleItem;
  colors: ThemeColors;
}

export interface ModalItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
}

export interface SelectionModalProps {
  visible: boolean;
  title: string;
  items: ModalItem[];
  selectedItemId?: string;
  onSelect: (itemId: string) => void;
  onClose: () => void;
  colors: ThemeColors;
}
