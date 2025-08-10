import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  UserX, 
  MessageCircle,
  Globe,
  DollarSign,
  MapPin,
  Grid,
  Palette,
  HelpCircle,
  Mail,
  MessageSquare,
  Info,
  ChevronRight,
  Settings
} from 'lucide-react';

const SettingsLayout2 = ({ children }) => {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      id: 'account',
      title: 'Hesap',
      items: [
        { path: '/ayarlar2/profil', icon: User, label: 'Profil', description: 'Kişisel bilgilerinizi düzenleyin' },
        { path: '/ayarlar2/guven-puani', icon: Shield, label: 'Güven Puanı', description: 'Güvenilirlik puanınızı görün' },
        { path: '/ayarlar2/guvenlik', icon: Shield, label: 'Güvenlik', description: 'Şifre ve 2FA ayarları' },
        { path: '/ayarlar2/bildirimler', icon: Bell, label: 'Bildirimler', description: 'Bildirim tercihlerinizi yönetin' },
        { path: '/ayarlar2/gizlilik', icon: Eye, label: 'Gizlilik', description: 'Gizlilik ayarlarınızı yönetin' },
        { path: '/ayarlar2/engellenen-kullanicilar', icon: UserX, label: 'Engellenen Kullanıcılar', description: 'Engellediğiniz kullanıcıları yönetin' },
      ]
    },
    {
      id: 'platform',
      title: 'Platform',
      items: [
        { path: '/ayarlar2/dil', icon: Globe, label: 'Dil', description: 'Dil tercihinizi seçin' },
        { path: '/ayarlar2/para-birimi', icon: DollarSign, label: 'Para Birimi', description: 'Para birimi tercihinizi seçin' },
        { path: '/ayarlar2/konum', icon: MapPin, label: 'Konum', description: 'Varsayılan konumunuzu ayarlayın' },
        { path: '/ayarlar2/kategori', icon: Grid, label: 'Kategori', description: 'Varsayılan kategori seçin' },
        { path: '/ayarlar2/tema', icon: Palette, label: 'Tema', description: 'Açık/Koyu tema seçimi' },
        { path: '/ayarlar2/sohbet-ayarlari', icon: MessageCircle, label: 'Sohbet Ayarları', description: 'Mesajlaşma tercihlerinizi düzenleyin' },
      ]
    },
    {
      id: 'support',
      title: 'Destek',
      items: [
        { path: '/ayarlar2/yardim', icon: HelpCircle, label: 'Yardım', description: 'Sıkça sorulan sorular' },
        { path: '/ayarlar2/iletisim', icon: Mail, label: 'İletişim', description: 'Bizimle iletişime geçin' },
        { path: '/ayarlar2/geri-bildirim', icon: MessageSquare, label: 'Geri Bildirim', description: 'Önerilerinizi paylaşın' },
        { path: '/ayarlar2/hakkinda', icon: Info, label: 'Hakkında', description: 'Platform hakkında bilgiler' },
      ]
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Desktop için sidebar layout
  if (isDesktop) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
                <nav className="space-y-6">
                  {menuItems.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {section.title}
                      </h3>
                      <div className="space-y-2">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.path);
                          
                          return (
                            <Link key={item.path} to={item.path}>
                              <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                                  active
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${
                                    active 
                                      ? 'bg-white/20' 
                                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                                  }`}>
                                    <Icon size={18} className={active ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm ${
                                      active ? 'text-white' : 'text-gray-900 dark:text-white'
                                    }`}>
                                      {item.label}
                                    </div>
                                    <div className={`text-xs mt-0.5 ${
                                      active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {item.description}
                                    </div>
                                  </div>
                                  <ChevronRight size={16} className={`opacity-50 ${
                                    active ? 'text-white' : 'text-gray-400'
                                  }`} />
                                </div>
                                
                                {/* Active indicator */}
                                {active && (
                                  <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                )}
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 min-h-[600px]"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Mobile için tek sayfa layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto px-4 py-2"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {children}
      </div>
    </motion.div>
  );
};

export default SettingsLayout2; 