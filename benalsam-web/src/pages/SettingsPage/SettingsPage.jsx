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
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-0">
            <button
              onClick={() => item.path && handleNavigation(item.path)}
              disabled={!item.path}
              className={`w-full p-4 transition-all duration-200 ${
                item.path 
                  ? 'hover:bg-accent/50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                {item.path && (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </div>
            </button>
          </CardContent>
        </Card>
        {showDivider && <Separator className="my-2" />}
      </motion.div>
    );
  };

  const renderToggleItem = (item, showDivider = true) => {
    return (
      <motion.div
        key={item.id}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="text-sm text-muted-foreground">
                  {item.subtitle}
                </div>
              </div>
              <Switch
                checked={item.value}
                onCheckedChange={item.onToggle}
                className="ml-4"
              />
            </div>
          </CardContent>
        </Card>
        {showDivider && <Separator className="my-2" />}
      </motion.div>
    );
  };

  // Show loading state during hydration and data loading
  if (!isLoaded || loadingAuth) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {/* Email Info Skeleton */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Skeletons */}
          {[...Array(5)].map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              <Skeleton className="h-6 w-24 ml-4" />
              <div className="space-y-1">
                {[...Array(3)].map((_, itemIndex) => (
                  <Card key={itemIndex} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <Skeleton className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Email Info */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <EmailInfo currentUser={currentUser} />
      </motion.div>

      {/* Account Settings */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">
          Hesap
        </h2>
        <div className="space-y-1">
          {accountSettings.map((item, index) => 
            renderSettingItem(item, index < accountSettings.length - 1)
          )}
        </div>
      </motion.div>

      {/* Chat Settings */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">
          Sohbet
        </h2>
        <div className="space-y-1">
          {chatSettings.map((item, index) => 
            renderSettingItem(item, index < chatSettings.length - 1)
          )}
        </div>
      </motion.div>

      {/* App Settings */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">
          Uygulama
        </h2>
        <div className="space-y-1">
          {appSettings.map((item, index) => 
            renderSettingItem(item, index < appSettings.length - 1)
          )}
        </div>
      </motion.div>

      {/* User Preferences */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">
          Görünüm Tercihleri
        </h2>
        <div className="space-y-1">
          {userPreferencesSettings.map((item, index) => 
            renderToggleItem(item, index < userPreferencesSettings.length - 1)
          )}
        </div>
      </motion.div>

      {/* Support Settings */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">
          Destek
        </h2>
        <div className="space-y-1">
          {supportSettings.map((item, index) => 
            renderSettingItem(item, index < supportSettings.length - 1)
          )}
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div 
        className="pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Button
          variant="destructive"
          size="lg"
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut size={20} className="mr-2" />
          Çıkış Yap
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default memo(SettingsPage); 