import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Globe, 
  DollarSign, 
  MapPin, 
  Bell, 
  Shield, 
  User, 
  Settings,
  ChevronRight,
  Mail,
  Smartphone,
  Monitor,
  Palette,
  Volume2,
  Eye,
  Lock,
  Trash2,
  MessageCircle,
  HelpCircle,
  Info,
  MessageSquarePlus,
  UserX,
  Award,
  Database,
  BarChart3,
  Activity,
  LogOut
} from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAuthStore } from '../../stores';
import EmailInfo from '../../components/SettingsComponents/EmailInfo';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading: loadingAuth } = useAuthStore();
  const { preferences, platformPreferences } = useUserPreferences();
  const { triggerHaptic } = useHapticFeedback();
  
  // Loading state for hydration
  const [isLoaded, setIsLoaded] = useState(false);
  
  React.useEffect(() => {
    // Wait for auth to load and preferences to be available
    if (!loadingAuth && preferences) {
      setIsLoaded(true);
    }
  }, [loadingAuth, preferences]);

  const handleNavigation = (path) => {
    try {
      triggerHaptic();
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleLogout = () => {
    triggerHaptic();
    // Logout logic here
    console.log('Logout clicked');
  };

  const accountSettings = [
    { id: 'profile', title: 'Profil', subtitle: 'Kişisel bilgilerinizi düzenleyin', icon: User, path: '/ayarlar/profil' },
    { id: 'trust-score', title: 'Güven Puanı', subtitle: 'Güvenilirlik puanınızı görün ve artırın', icon: Award, path: '/ayarlar/guven-puani' },
    { id: 'security', title: 'Güvenlik', subtitle: 'Şifre değiştirme ve 2FA ayarları', icon: Shield, path: '/ayarlar/guvenlik' },
    { id: 'notifications', title: 'Bildirimler', subtitle: 'Bildirim tercihlerinizi yönetin', icon: Bell, path: '/ayarlar/bildirimler' },
    { id: 'privacy', title: 'Gizlilik', subtitle: 'Gizlilik ayarlarınızı yönetin', icon: Eye, path: '/ayarlar/gizlilik' },
    { id: 'blocked-users', title: 'Engellenen Kullanıcılar', subtitle: 'Engellediğiniz kullanıcıları yönetin', icon: UserX, path: '/ayarlar/engellenen-kullanicilar' },
  ];

  const chatSettings = [
    { id: 'chat-settings', title: 'Sohbet Ayarları', subtitle: 'Mesajlaşma tercihlerinizi düzenleyin', icon: MessageCircle, path: '/ayarlar/sohbet-ayarlari' },
  ];

  const appSettings = [
    {
      id: 'theme',
      title: 'Tema',
      subtitle: 'Açık/Koyu tema',
      icon: Palette,
      path: '/ayarlar/tema'
    },
    {
      id: 'currency',
      title: 'Para Birimi',
      subtitle: platformPreferences?.currency || 'TRY',
      icon: DollarSign,
      path: '/ayarlar/para-birimi'
    },
    {
      id: 'location',
      title: 'Varsayılan Konum',
      subtitle: 'İstanbul',
      icon: MapPin,
      path: '/ayarlar/konum'
    },
    {
      id: 'category',
      title: 'Varsayılan Kategori',
      subtitle: 'Seçilmedi',
      icon: Settings,
      path: '/ayarlar/kategori'
    }
  ];

  const userPreferencesSettings = [
    {
      id: 'content-type',
      title: 'İçerik Düzeni',
      subtitle: preferences.contentTypePreference === 'compact' ? 'Kompakt' : 
                preferences.contentTypePreference === 'list' ? 'Liste' : 'Grid',
      value: preferences.contentTypePreference === 'compact',
      onToggle: () => console.log('Content type toggle')
    },
    {
      id: 'category-badges',
      title: 'Kategori Rozetleri',
      subtitle: 'İlan kartlarında kategori etiketlerini göster',
      value: preferences.showCategoryBadges || false,
      onToggle: () => console.log('Category badges toggle')
    },
    {
      id: 'urgency-badges',
      title: 'Acil Rozetleri',
      subtitle: 'İlan kartlarında acil etiketlerini göster',
      value: preferences.showUrgencyBadges || false,
      onToggle: () => console.log('Urgency badges toggle')
    },
    {
      id: 'user-ratings',
      title: 'Kullanıcı Puanları',
      subtitle: 'İlan kartlarında kullanıcı değerlendirmelerini göster',
      value: preferences.showUserRatings || false,
      onToggle: () => console.log('User ratings toggle')
    },
    {
      id: 'distance',
      title: 'Mesafe Bilgisi',
      subtitle: 'İlan kartlarında mesafe bilgisini göster',
      value: preferences.showDistance || false,
      onToggle: () => console.log('Distance toggle')
    }
  ];

  const supportSettings = [
    {
      id: 'help',
      title: 'Yardım',
      subtitle: 'Sıkça sorulan sorular ve yardım merkezi',
      icon: HelpCircle,
      path: '/ayarlar/yardim'
    },
    {
      id: 'contact',
      title: 'İletişim',
      subtitle: 'Bizimle iletişime geçin',
      icon: Mail,
      path: '/ayarlar/iletisim'
    },
    {
      id: 'feedback',
      title: 'Geri Bildirim',
      subtitle: 'Önerilerinizi paylaşın',
      icon: MessageSquarePlus,
      path: '/ayarlar/geri-bildirim'
    },
    {
      id: 'about',
      title: 'Hakkında',
      subtitle: 'Platform hakkında bilgiler',
      icon: Info,
      path: '/ayarlar/hakkinda'
    }
  ];

  const renderSettingItem = (item, showDivider = true) => {
    const Icon = item.icon;
    
    return (
      <motion.div
        key={item.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <button
          onClick={() => item.path && handleNavigation(item.path)}
          disabled={!item.path}
          className={`w-full p-4 bg-card rounded-lg border transition-all duration-200 ${
            item.path 
              ? 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
              : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.subtitle}
                </div>
              </div>
            </div>
            {item.path && (
              <ChevronRight size={16} className="text-gray-400" />
            )}
          </div>
        </button>
        {showDivider && <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />}
      </motion.div>
    );
  };

  const renderToggleItem = (item, showDivider = true) => {
    return (
      <motion.div
        key={item.id}
        whileHover={{ scale: 1.02 }}
        className="w-full p-4 bg-card rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium">{item.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {item.subtitle}
            </div>
          </div>
          <button
            onClick={item.onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              item.value 
                ? 'bg-primary' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                item.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {showDivider && <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />}
      </motion.div>
    );
  };

  // Show loading state during hydration and data loading
  if (!isLoaded || loadingAuth) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Info */}
      <div className="mb-6">
        <EmailInfo currentUser={currentUser} />
      </div>

      {/* Account Settings */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-4">
          Hesap
        </h2>
        <div className="space-y-1">
          {accountSettings.map((item, index) => 
            renderSettingItem(item, index < accountSettings.length - 1)
          )}
        </div>
      </div>

      {/* Chat Settings */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-4">
          Sohbet
        </h2>
        <div className="space-y-1">
          {chatSettings.map((item, index) => 
            renderSettingItem(item, index < chatSettings.length - 1)
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-4">
          Uygulama
        </h2>
        <div className="space-y-1">
          {appSettings.map((item, index) => 
            renderSettingItem(item, index < appSettings.length - 1)
          )}
        </div>
      </div>

      {/* User Preferences */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-4">
          Görünüm Tercihleri
        </h2>
        <div className="space-y-1">
          {userPreferencesSettings.map((item, index) => 
            renderToggleItem(item, index < userPreferencesSettings.length - 1)
          )}
        </div>
      </div>

      {/* Support Settings */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 px-4">
          Destek
        </h2>
        <div className="space-y-1">
          {supportSettings.map((item, index) => 
            renderSettingItem(item, index < supportSettings.length - 1)
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <LogOut size={20} />
            Çıkış Yap
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default memo(SettingsPage); 