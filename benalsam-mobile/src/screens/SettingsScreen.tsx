import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  Heart, 
  HelpCircle, 
  Star, 
  MessageCircle, 
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Eye,
  Lock,
  Info,
  Mail,
  Phone,
  MapPin,
  Check,
  DollarSign,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Flower2,
  Car,
  Grid,
  MessageSquarePlus,
  UserX,
  ArrowLeft,
  Award,
  Database,
  BarChart3,
  Activity,
} from 'lucide-react-native';
import { useThemeStore, useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { useUserPreferencesContext } from '../contexts/UserPreferencesContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { LoadingSpinner, ErrorBoundary, Modal, Button } from '../components';
import { updateUserProfile, getUserProfile, supabase } from '../services/supabaseService';
import type { 
  District, 
  Province, 
  Currency, 
  Language, 
  Category,
  UserProfile as UserProfileType,
} from '../types';
import type { RootStackParamList as RootStackParamListType } from '../types/navigation';


interface NotificationPreferences {
  new_offer_push: boolean;
  new_offer_email: boolean;
  new_message_push: boolean;
  new_message_email: boolean;
  review_push: boolean;
  review_email: boolean;
  summary_emails: 'daily' | 'weekly' | 'never';
}

interface ChatPreferences {
  read_receipts: boolean;
  show_last_seen: boolean;
  auto_scroll_messages: boolean;
}

interface PlatformPreferences {
  language: string;
  currency: string;
  default_location_province?: string;
  default_location_district?: string;
  default_category?: string;
}

interface UserProfile extends UserProfileType {
  platform_preferences: PlatformPreferences;
  notification_preferences: NotificationPreferences;
  chat_preferences: ChatPreferences;
}

interface RootStackParamList extends RootStackParamListType {
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

interface ErrorBoundaryProps {
  error: Error;
  resetError: () => void;
}

interface SettingsScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  onPress?: () => void;
}

interface ToggleItem {
  id: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

interface ThemeColors {
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

const languages: Language[] = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

const currencies: Currency[] = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

const provinces: Province[] = [
  { code: 'TR-34', name: 'İstanbul', districts: [] },
  { code: 'TR-06', name: 'Ankara', districts: [] },
  { code: 'TR-35', name: 'İzmir', districts: [] },
];

const districts: Record<string, District[]> = {
  'TR-34': [
    { code: 'TR-34-01', name: 'Adalar' },
    { code: 'TR-34-02', name: 'Bakırköy' },
    { code: 'TR-34-03', name: 'Beşiktaş' },
    { code: 'TR-34-04', name: 'Beyoğlu' },
    { code: 'TR-34-05', name: 'Kadıköy' },
  ],
  'TR-06': [
    { code: 'TR-06-01', name: 'Altındağ' },
    { code: 'TR-06-02', name: 'Çankaya' },
    { code: 'TR-06-03', name: 'Keçiören' },
    { code: 'TR-06-04', name: 'Mamak' },
    { code: 'TR-06-05', name: 'Yenimahalle' },
  ],
  'TR-35': [
    { code: 'TR-35-01', name: 'Bornova' },
    { code: 'TR-35-02', name: 'Buca' },
    { code: 'TR-35-03', name: 'Karşıyaka' },
    { code: 'TR-35-04', name: 'Konak' },
    { code: 'TR-35-05', name: 'Menemen' },
  ],
};

const categories: Category[] = [
  { code: 'electronics', name: 'Elektronik', icon: Smartphone },
  { code: 'fashion', name: 'Moda', icon: Shirt },
  { code: 'home', name: 'Ev & Yaşam', icon: Home },
  { code: 'sports', name: 'Spor', icon: Dumbbell },
  { code: 'books', name: 'Kitap', icon: BookOpen },
  { code: 'games', name: 'Oyun', icon: Gamepad2 },
  { code: 'garden', name: 'Bahçe', icon: Flower2 },
  { code: 'auto', name: 'Otomotiv', icon: Car },
  { code: 'other', name: 'Diğer', icon: Grid },
];

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  selectedModalItem: {
    backgroundColor: colors.surface,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedModalItemText: {
    fontWeight: '600',
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: colors.border,
  },
  summaryEmailContainer: {
    paddingVertical: 12,
  },
  summaryEmailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryEmailOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 52,
  },
  summaryEmailOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryEmailOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeButton: {
    padding: 8,
  },
});

const ErrorDisplay = ({ onRetry }: { onRetry: () => void }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  return (
    <View style={styles.loadingContainer}>
      <Text style={[styles.settingTitle, { color: colors.error }]}>
        Bir hata oluştu
      </Text>
      <Text style={[styles.settingSubtitle, { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }]}>
        Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
      </Text>
      <Button
        title="Tekrar Dene"
        onPress={onRetry}
        style={{ backgroundColor: colors.primary }}
        textStyle={{ color: colors.white }}
      />
    </View>
  );
};

const EmailInfo = () => {
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user));
  }, []);

  const isVerified = !!authUser?.email_confirmed_at;

  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ fontSize: 16, color: '#888' }}>E-posta adresiniz</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#999' }}>
          {authUser?.email}
        </Text>
        <View style={{
          marginLeft: 12,
          backgroundColor: isVerified ? '#4CAF50' : '#FF9800',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}>
          <Text style={{ color: '#fff', fontSize: 13 }}>
            {isVerified ? 'Doğrulandı' : 'Doğrulanmadı'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { toggleTheme, isDarkMode } = useThemeStore();
  const colors = useThemeColors();
  const isDark = isDarkMode();
  const { user, signOut } = useAuthStore();
  const { 
    preferences, 
    updateContentTypePreference,
    toggleCategoryBadges,
    toggleUrgencyBadges,
    toggleUserRatings,
    toggleDistance,
    setTheme,
    resetToDefaults
  } = useUserPreferencesContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  // Platform preferences
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [selectedCurrency, setSelectedCurrency] = useState('TRY');
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  // Notification preferences
  const [newOfferPush, setNewOfferPush] = useState(true);
  const [newOfferEmail, setNewOfferEmail] = useState(true);
  const [newMessagePush, setNewMessagePush] = useState(true);
  const [newMessageEmail, setNewMessageEmail] = useState(true);
  const [reviewPush, setReviewPush] = useState(true);
  const [reviewEmail, setReviewEmail] = useState(true);
  const [summaryEmails, setSummaryEmails] = useState<'daily' | 'weekly' | 'never'>('weekly');
  
  // Chat preferences
  const [readReceipts, setReadReceipts] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [autoScrollMessages, setAutoScrollMessages] = useState(true);

  // Modal visibility
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    if (profile) {
      handlePreferenceUpdate({
        platform_preferences: {
          ...profile.platform_preferences,
          language: languageCode,
        },
      });
    }
    setIsLanguageModalVisible(false);
  };

  const handleCurrencySelect = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    if (profile) {
      handlePreferenceUpdate({
        platform_preferences: {
          ...profile.platform_preferences,
          currency: currencyCode,
        },
      });
    }
    setIsCurrencyModalVisible(false);
  };

  const handleProvinceSelect = (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    setSelectedDistrict(undefined);
  };

  const handleDistrictSelect = (districtCode: string) => {
    setSelectedDistrict(districtCode);
  };

  const handleCategorySelect = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
  };

  const handleClearLocation = () => {
    setSelectedProvince(undefined);
    setSelectedDistrict(undefined);
  };

  const handleClearCategory = () => {
    setSelectedCategory(undefined);
  };

  const handleLocationSave = () => {
    if (!selectedProvince || !profile) return;

    handlePreferenceUpdate({
      platform_preferences: {
        ...profile.platform_preferences,
        default_location_province: selectedProvince,
        default_location_district: selectedDistrict,
      },
    });
    setIsLocationModalVisible(false);
  };

  const handleCategorySave = () => {
    if (!selectedCategory || !profile) return;

    handlePreferenceUpdate({
      platform_preferences: {
        ...profile.platform_preferences,
        default_category: selectedCategory,
      },
    });
    setIsCategoryModalVisible(false);
  };

  const getLocationText = () => {
    if (!selectedProvince) return 'Seçilmedi';
    const province = provinces.find(p => p.code === selectedProvince)?.name || '';
    if (!selectedDistrict) return province;
    const district = districts[selectedProvince]?.find(d => d.code === selectedDistrict)?.name || '';
    return `${province} / ${district}`;
  };

  const getCategoryText = () => {
    if (!selectedCategory) return 'Seçilmedi';
    return categories.find(c => c.code === selectedCategory)?.name || 'Seçilmedi';
  };

  const renderLanguageModal = () => (
    <Modal
      visible={isLanguageModalVisible}
      onRequestClose={() => setIsLanguageModalVisible(false)}
      title="Dil Seçimi"
    >
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.modalItem,
            selectedLanguage === language.code && styles.selectedModalItem,
          ]}
          onPress={() => handleLanguageSelect(language.code)}
        >
          <Text
            style={[
              styles.modalItemText,
              selectedLanguage === language.code && styles.selectedModalItemText,
            ]}
          >
            {language.nativeName}
          </Text>
        </TouchableOpacity>
      ))}
    </Modal>
  );

  const renderCurrencyModal = () => (
    <Modal
      visible={isCurrencyModalVisible}
      onRequestClose={() => setIsCurrencyModalVisible(false)}
      title="Para Birimi"
    >
      {currencies.map((currency) => (
        <TouchableOpacity
          key={currency.code}
          style={[
            styles.modalItem,
            selectedCurrency === currency.code && styles.selectedModalItem,
          ]}
          onPress={() => handleCurrencySelect(currency.code)}
        >
          <Text
            style={[
              styles.modalItemText,
              selectedCurrency === currency.code && styles.selectedModalItemText,
            ]}
          >
            {currency.name} ({currency.symbol})
          </Text>
        </TouchableOpacity>
      ))}
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal
      visible={isLocationModalVisible}
      onRequestClose={() => setIsLocationModalVisible(false)}
      title="Konum Seçimi"
    >
      {provinces.map((province) => (
        <TouchableOpacity
          key={province.code}
          style={[
            styles.modalItem,
            selectedProvince === province.code && styles.selectedModalItem,
          ]}
          onPress={() => {
            setSelectedProvince(province.code);
            setSelectedDistrict(undefined);
          }}
        >
          <Text
            style={[
              styles.modalItemText,
              selectedProvince === province.code && styles.selectedModalItemText,
            ]}
          >
            {province.name}
          </Text>
        </TouchableOpacity>
      ))}
      {selectedProvince && districts[selectedProvince]?.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>İlçe</Text>
          {districts[selectedProvince].map((district) => (
            <TouchableOpacity
              key={district.code}
              style={[
                styles.modalItem,
                selectedDistrict === district.code && styles.selectedModalItem,
              ]}
              onPress={() => setSelectedDistrict(district.code)}
            >
              <Text
                style={[
                  styles.modalItemText,
                  selectedDistrict === district.code && styles.selectedModalItemText,
                ]}
              >
                {district.name}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.modalButton, styles.modalButtonSecondary]}
          onPress={() => setIsLocationModalVisible(false)}
        >
          <Text style={[styles.modalButtonText, { color: colors.text }]}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.modalButtonPrimary]}
          onPress={handleLocationSave}
        >
          <Text style={[styles.modalButtonText, { color: colors.white }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={isCategoryModalVisible}
      onRequestClose={() => setIsCategoryModalVisible(false)}
      title="Kategori Seçimi"
    >
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <TouchableOpacity
            key={category.code}
            style={[
              styles.modalItem,
              selectedCategory === category.code && styles.selectedModalItem,
            ]}
            onPress={() => {
              setSelectedCategory(category.code);
              handleCategorySave();
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Icon size={20} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.modalItemText,
                  selectedCategory === category.code && styles.selectedModalItemText,
                ]}
              >
                {category.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </Modal>
  );

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      const { data: userProfile, error } = await getUserProfile(user.id);

      if (error) {
        Alert.alert(
          'Hata',
          'Profil bilgileriniz yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        );
        return;
      }

      if (userProfile) {
        setProfile(userProfile);
        setSelectedLanguage(userProfile.platform_preferences.language || 'tr');
        setSelectedCurrency(userProfile.platform_preferences.currency || 'TRY');
        setSelectedProvince(userProfile.platform_preferences.default_location_province);
        setSelectedDistrict(userProfile.platform_preferences.default_location_district);
        setSelectedCategory(userProfile.platform_preferences.default_category);
        setNewOfferPush(userProfile.notification_preferences.new_offer_push);
        setNewOfferEmail(userProfile.notification_preferences.new_offer_email);
        setNewMessagePush(userProfile.notification_preferences.new_message_push);
        setNewMessageEmail(userProfile.notification_preferences.new_message_email);
        setReviewPush(userProfile.notification_preferences.review_push);
        setReviewEmail(userProfile.notification_preferences.review_email);
        setSummaryEmails(userProfile.notification_preferences.summary_emails);
        setReadReceipts(userProfile.chat_preferences.read_receipts);
        setShowLastSeen(userProfile.chat_preferences.show_last_seen);
        setAutoScrollMessages(userProfile.chat_preferences.auto_scroll_messages);
      }
    } catch (error) {
      Alert.alert(
        'Hata',
        'Profil bilgileriniz yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const handleEditProfile = () => {
    console.log('🔵 [Settings] handleEditProfile called');
    try {
      navigation.navigate('EditProfile');
      console.log('🔵 [Settings] Navigation to EditProfile successful');
    } catch (error) {
      console.error('🔴 [Settings] Navigation to EditProfile failed:', error);
    }
  };

  const handleSecurity = () => {
    navigation.navigate('Security');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword' as never);
  };

  const handleNotificationPreferences = () => {
    navigation.navigate('NotificationPreferences', {
      preferences: profile?.notification_preferences,
      onUpdate: (preferences: NotificationPreferences) => handlePreferenceUpdate({
        notification_preferences: preferences,
      }),
    });
  };

  const handlePrivacy = () => {
    navigation.navigate('Privacy');
  };

  const handleBlockedUsers = () => {
    navigation.navigate('BlockedUsers');
  };

  const handleChatPreferences = () => {
    navigation.navigate('ChatPreferences', {
      preferences: profile?.chat_preferences,
      onUpdate: (preferences: ChatPreferences) => handlePreferenceUpdate({
        chat_preferences: preferences,
      }),
    });
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };

  const handleContact = () => {
    navigation.navigate('Contact');
  };

  const handleFeedback = () => {
    navigation.navigate('Feedback');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  // Admin kontrolü - basit bir kontrol (gerçek uygulamada daha güvenli olmalı)
  const isAdmin = user?.email === 'admin@bensalm.com' || user?.id === 'admin-user-id';

  const handleModeration = () => {
    if (isAdmin) {
      navigation.navigate('Moderation' as never);
    } else {
      Alert.alert('Yetkisiz Erişim', 'Bu sayfaya erişim yetkiniz bulunmuyor.');
    }
  };

  const handleAnalytics = () => {
    if (isAdmin) {
      navigation.navigate('AnalyticsDashboard' as never);
    } else {
      Alert.alert('Yetkisiz Erişim', 'Bu sayfaya erişim yetkiniz bulunmuyor.');
    }
  };

  const handleAnalyticsTest = () => {
    navigation.navigate('AnalyticsTest' as never);
  };

  const handleSettingPress = async (onPress?: () => void) => {
    console.log('🔵 [Settings] handleSettingPress called, isUpdating:', isUpdating, 'onPress:', !!onPress);
    if (isUpdating || !onPress) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('🔵 [Settings] Calling onPress function');
    onPress();
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                'Hata',
                'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
              );
            }
          },
        },
      ],
    );
  };

  const handlePreferenceUpdate = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    setIsUpdating(true);
    try {
      const { data: updatedProfile, error } = await updateUserProfile(user.id, {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Hata',
          'Tercihleriniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
        );
        return;
      }

      if (updatedProfile) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setProfile(updatedProfile);
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Hata',
        'Tercihleriniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationToggle = (key: keyof NotificationPreferences, value: boolean | 'daily' | 'weekly' | 'never') => {
    if (!profile) return;

    handlePreferenceUpdate({
      notification_preferences: {
        ...profile.notification_preferences,
        [key]: value,
      },
    });
  };

  const handleChatPreferenceToggle = (key: keyof ChatPreferences, value: boolean) => {
    if (!profile) return;

    handlePreferenceUpdate({
      chat_preferences: {
        ...profile.chat_preferences,
        [key]: value,
      },
    });
  };

  // İsim soyisim oluştur fonksiyonu
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    } else if (user?.username) {
      return user.username;
    } else if (user?.email) {
      return user.email;
    } else {
      return 'Kullanıcı';
    }
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profil',
      subtitle: getDisplayName(),
      icon: User,
      onPress: () => {
        console.log('🔵 [Settings] Profile item onPress called directly');
        handleEditProfile();
      },
    },
    {
      id: 'trust-score',
      title: 'Güven Puanı',
      subtitle: 'Güvenilirlik puanınızı görün ve artırın',
      icon: Award,
      onPress: () => navigation.navigate('TrustScore', { userId: user?.id }),
    },
    {
      id: 'security',
      title: 'Güvenlik',
      subtitle: 'Şifre ve güvenlik ayarları',
      icon: Shield,
      onPress: handleSecurity,
    },
    {
      id: 'notifications',
      title: 'Bildirimler',
      subtitle: 'Bildirim tercihleri',
      icon: Bell,
      onPress: handleNotificationPreferences,
    },
    {
      id: 'privacy',
      title: 'Gizlilik',
      subtitle: 'Gizlilik ayarları',
      icon: Eye,
      onPress: handlePrivacy,
    },
    {
      id: 'blocked',
      title: 'Engellenen Kullanıcılar',
      subtitle: 'Engellediğiniz kullanıcıları yönetin',
      icon: UserX,
      onPress: handleBlockedUsers,
    },
  ];

  const notificationSettings = [
    {
      id: 'new_offer_push',
      title: 'Yeni Teklif Bildirimleri',
      subtitle: 'Push bildirimleri',
      value: newOfferPush,
      onToggle: (value: boolean) => {
        setNewOfferPush(value);
        handleNotificationToggle('new_offer_push', value);
      },
    },
    {
      id: 'new_offer_email',
      title: 'Yeni Teklif E-postaları',
      subtitle: 'E-posta bildirimleri',
      value: newOfferEmail,
      onToggle: (value: boolean) => {
        setNewOfferEmail(value);
        handleNotificationToggle('new_offer_email', value);
      },
    },
    {
      id: 'new_message_push',
      title: 'Yeni Mesaj Bildirimleri',
      subtitle: 'Push bildirimleri',
      value: newMessagePush,
      onToggle: (value: boolean) => {
        setNewMessagePush(value);
        handleNotificationToggle('new_message_push', value);
      },
    },
    {
      id: 'new_message_email',
      title: 'Yeni Mesaj E-postaları',
      subtitle: 'E-posta bildirimleri',
      value: newMessageEmail,
      onToggle: (value: boolean) => {
        setNewMessageEmail(value);
        handleNotificationToggle('new_message_email', value);
      },
    },
    {
      id: 'review_push',
      title: 'Değerlendirme Bildirimleri',
      subtitle: 'Push bildirimleri',
      value: reviewPush,
      onToggle: (value: boolean) => {
        setReviewPush(value);
        handleNotificationToggle('review_push', value);
      },
    },
    {
      id: 'review_email',
      title: 'Değerlendirme E-postaları',
      subtitle: 'E-posta bildirimleri',
      value: reviewEmail,
      onToggle: (value: boolean) => {
        setReviewEmail(value);
        handleNotificationToggle('review_email', value);
      },
    },
  ];

  const chatSettings: SettingItem[] = [
    {
      id: 'chat',
      title: 'Sohbet Ayarları',
      subtitle: 'Sohbet tercihlerinizi düzenleyin',
      icon: MessageCircle,
      onPress: handleChatPreferences,
    },
    {
      id: 'language',
      title: 'Dil',
      subtitle: selectedLanguage === 'tr' ? 'Türkçe' : 'English',
      icon: Globe,
      onPress: () => setIsLanguageModalVisible(true),
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'theme',
      title: 'Tema',
      subtitle: isDark ? 'Koyu tema' : 'Açık tema',
      icon: isDark ? Moon : Sun,
      onPress: toggleTheme,
    },
    {
      id: 'currency',
      title: 'Para Birimi',
      subtitle: currencies.find(c => c.code === selectedCurrency)?.name || 'Türk Lirası',
      icon: DollarSign,
      onPress: () => setIsCurrencyModalVisible(true),
    },
    {
      id: 'location',
      title: 'Varsayılan Konum',
      subtitle: getLocationText(),
      icon: MapPin,
      onPress: () => setIsLocationModalVisible(true),
    },
    {
      id: 'category',
      title: 'Varsayılan Kategori',
      subtitle: getCategoryText(),
      icon: Grid,
      onPress: () => setIsCategoryModalVisible(true),
    },
    {
      id: 'firebase-test',
      title: 'Firebase Test',
      subtitle: 'Firebase bağlantısını test edin',
      icon: Database,
      onPress: () => navigation.navigate('FirebaseTest'),
    },
    {
      id: 'fcm-test',
      title: 'FCM Token Test',
      subtitle: 'Push notification token yönetimi',
      icon: Bell,
      onPress: () => navigation.navigate('FCMTest'),
    },
    {
      id: 'analytics-test',
      title: 'Analytics Test',
      subtitle: 'Yeni analytics sistemini test edin',
      icon: Activity,
      onPress: handleAnalyticsTest,
    },
    // Admin seçenekleri
    ...(isAdmin ? [
      {
        id: 'moderation',
        title: 'Moderasyon Paneli',
        subtitle: 'Bekleyen özellik ve etiketleri yönetin',
        icon: Shield,
        onPress: handleModeration,
      },
      {
        id: 'analytics',
        title: 'Analitik Dashboard',
        subtitle: 'AI performansı ve popüler içerikler',
        icon: BarChart3,
        onPress: handleAnalytics,
      },
    ] : []),
  ];

  // User Preferences Settings
  const userPreferencesSettings: ToggleItem[] = [
    {
      id: 'content-type',
      title: 'İçerik Düzeni',
      subtitle: preferences?.contentTypePreference === 'compact' ? 'Kompakt' : 
                preferences?.contentTypePreference === 'list' ? 'Liste' : 'Grid',
      value: preferences?.contentTypePreference === 'compact',
      onToggle: async (value: boolean) => {
        const newPreference = value ? 'compact' : 'grid';
        console.log('🔧 SettingsScreen: Content type changing to:', newPreference);
        console.log('🔧 SettingsScreen: Current preferences before:', preferences);
        await updateContentTypePreference(newPreference);
        console.log('🔧 SettingsScreen: Content type changed to:', newPreference);
        console.log('🔧 SettingsScreen: Current preferences after:', preferences);
      },
    },
    {
      id: 'category-badges',
      title: 'Kategori Rozetleri',
      subtitle: 'İlan kartlarında kategori etiketlerini göster',
      value: preferences?.showCategoryBadges || false,
      onToggle: async (value: boolean) => {
        await toggleCategoryBadges();
      },
    },
    {
      id: 'urgency-badges',
      title: 'Acil Rozetleri',
      subtitle: 'İlan kartlarında acil etiketlerini göster',
      value: preferences?.showUrgencyBadges || false,
      onToggle: async (value: boolean) => {
        await toggleUrgencyBadges();
      },
    },
    {
      id: 'user-ratings',
      title: 'Kullanıcı Puanları',
      subtitle: 'İlan kartlarında kullanıcı değerlendirmelerini göster',
      value: preferences?.showUserRatings || false,
      onToggle: async (value: boolean) => {
        await toggleUserRatings();
      },
    },
    {
      id: 'distance',
      title: 'Mesafe Bilgisi',
      subtitle: 'İlan kartlarında mesafe bilgisini göster',
      value: preferences?.showDistance || false,
      onToggle: async (value: boolean) => {
        await toggleDistance();
      },
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Yardım',
      subtitle: 'Sıkça sorulan sorular ve yardım merkezi',
      icon: HelpCircle,
      onPress: handleHelp,
    },
    {
      id: 'contact',
      title: 'İletişim',
      subtitle: 'Bizimle iletişime geçin',
      icon: Mail,
      onPress: handleContact,
    },
    {
      id: 'feedback',
      title: 'Geri Bildirim',
      subtitle: 'Görüş ve önerilerinizi paylaşın',
      icon: MessageSquarePlus,
      onPress: handleFeedback,
    },
    {
      id: 'about',
      title: 'Hakkında',
      subtitle: 'Uygulama bilgileri',
      icon: Info,
      onPress: handleAbout,
    },
  ];

  const renderSettingItem = (item: SettingItem, showDivider: boolean) => {
    const Icon = item.icon;
    console.log('🔵 [Settings] renderSettingItem for:', item.id, 'onPress:', !!item.onPress);

    return (
      <React.Fragment key={item.id}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('🔵 [Settings] TouchableOpacity onPress for:', item.id);
            handleSettingPress(item.onPress);
          }}
          disabled={isUpdating}
        >
          <View style={[styles.iconContainer, { 
            backgroundColor: colors.primary + '20',
            opacity: isUpdating ? 0.5 : 1,
          }]}>
            <Icon size={20} color={colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { 
              color: colors.text,
              opacity: isUpdating ? 0.5 : 1,
            }]}>
              {item.title}
            </Text>
            <Text style={[styles.settingSubtitle, { 
              color: colors.textSecondary,
              opacity: isUpdating ? 0.5 : 1,
            }]}>
              {item.subtitle}
            </Text>
          </View>
          {isUpdating && (
            <LoadingSpinner size="small" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
        {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
      </React.Fragment>
    );
  };

  const renderToggleItem = (item: ToggleItem, showDivider: boolean) => {
    return (
      <React.Fragment key={item.id}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { 
              color: colors.text,
              opacity: isUpdating ? 0.5 : 1,
            }]}>
              {item.title}
            </Text>
            <Text style={[styles.settingSubtitle, { 
              color: colors.textSecondary,
              opacity: isUpdating ? 0.5 : 1,
            }]}>
              {item.subtitle}
            </Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            disabled={isUpdating}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={item.value ? colors.primary : colors.textSecondary}
          />
        </View>
        {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
      </React.Fragment>
    );
  };

  const renderSummaryEmailSelector = () => {
    const options = [
      { label: 'Günlük', value: 'daily' },
      { label: 'Haftalık', value: 'weekly' },
      { label: 'Kapalı', value: 'never' }
    ];

    return (
      <View style={styles.summaryEmailContainer}>
        <View style={styles.summaryEmailHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Mail size={20} color={colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Özet E-postalar</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              Aktivite özetleri
            </Text>
          </View>
        </View>
        <View style={styles.summaryEmailOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.summaryEmailOption,
                summaryEmails === option.value && {
                  backgroundColor: colors.primary + '20',
                  borderColor: colors.primary,
                }
              ]}
              onPress={() => {
                setSummaryEmails(option.value as 'daily' | 'weekly' | 'never');
                handleNotificationToggle('summary_emails', option.value as 'daily' | 'weekly' | 'never');
              }}
            >
              <Text
                style={[
                  styles.summaryEmailOptionText,
                  { color: summaryEmails === option.value ? colors.primary : colors.text }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const handleRefresh = async () => {
    if (!user?.id || isUpdating) return;
    
    setIsRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ayarlar
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.themeButton}
          activeOpacity={0.7}
        >
          {isDark ? (
            <Sun size={24} color={colors.text} />
          ) : (
            <Moon size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <ErrorBoundary fallback={<ErrorDisplay onRetry={() => loadProfile()} />}>
        <ScrollView 
          style={styles.scrollView}
          scrollEnabled={!isUpdating}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          <EmailInfo />
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hesap</Text>
            {accountSettings.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderSettingItem(item, index < accountSettings.length - 1)}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sohbet</Text>
            {chatSettings.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderSettingItem(item, index < chatSettings.length - 1)}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Uygulama</Text>
            {appSettings.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderSettingItem(item, index < appSettings.length - 1)}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Görünüm Tercihleri</Text>
            {userPreferencesSettings.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderToggleItem(item, index < userPreferencesSettings.length - 1)}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Destek</Text>
            {supportSettings.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderSettingItem(item, index < supportSettings.length - 1)}
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modals */}
        {renderLanguageModal()}
        {renderCurrencyModal()}
        {renderLocationModal()}
        {renderCategoryModal()}
      </ErrorBoundary>
    </SafeAreaView>
  );
};

export default SettingsScreen; 