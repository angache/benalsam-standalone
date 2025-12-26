'use client'

/**
 * Settings Client Component
 * 
 * Main settings page with all sections:
 * - Account Settings
 * - Chat Settings
 * - App Settings
 * - View Preferences
 * - Support
 */

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Shield,
  Bell,
  Eye,
  UserX,
  Award,
  MessageCircle,
  Palette,
  DollarSign,
  MapPin,
  Settings as SettingsIcon,
  HelpCircle,
  Mail,
  MessageSquarePlus,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import EmailInfo from './components/EmailInfo'

interface SettingItem {
  id: string
  title: string
  subtitle: string
  icon: typeof User
  path?: string
  onClick?: () => void
}

interface ToggleItem {
  id: string
  title: string
  subtitle: string
  value: boolean
  onToggle: (checked: boolean) => void
}

export default function SettingsClient() {
  const { user, session, signOut } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Çıkış yapıldı',
        description: 'Hesabınızdan başarıyla çıkış yaptınız',
      })
      router.push('/')
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu',
        variant: 'destructive',
      })
    }
  }

  // Account Settings
  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profil',
      subtitle: 'Kişisel bilgilerinizi düzenleyin',
      icon: User,
      path: '/ayarlar/profil',
    },
    {
      id: 'trust-score',
      title: 'Güven Puanı',
      subtitle: 'Güvenilirlik puanınızı görün ve artırın',
      icon: Award,
      path: '/ayarlar/guven-puani',
    },
    {
      id: 'security',
      title: 'Güvenlik',
      subtitle: 'Şifre değiştirme ve 2FA ayarları',
      icon: Shield,
      path: '/ayarlar/guvenlik',
    },
    {
      id: 'notifications',
      title: 'Bildirimler',
      subtitle: 'Bildirim tercihlerinizi yönetin',
      icon: Bell,
      path: '/ayarlar/bildirimler',
    },
    {
      id: 'privacy',
      title: 'Gizlilik',
      subtitle: 'Gizlilik ayarlarınızı yönetin',
      icon: Eye,
      path: '/ayarlar/gizlilik',
    },
    {
      id: 'blocked-users',
      title: 'Engellenen Kullanıcılar',
      subtitle: 'Engellediğiniz kullanıcıları yönetin',
      icon: UserX,
      path: '/ayarlar/engellenen-kullanicilar',
    },
  ]

  // Chat Settings
  const chatSettings: SettingItem[] = [
    {
      id: 'chat-settings',
      title: 'Sohbet Ayarları',
      subtitle: 'Mesajlaşma tercihlerinizi düzenleyin',
      icon: MessageCircle,
      path: '/ayarlar/sohbet-ayarlari',
    },
  ]

  // App Settings
  const appSettings: SettingItem[] = [
    {
      id: 'theme',
      title: 'Tema',
      subtitle: mounted ? (theme === 'dark' ? 'Koyu' : theme === 'light' ? 'Açık' : 'Otomatik') : 'Yükleniyor...',
      icon: Palette,
      onClick: () => {
        const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        setTheme(newTheme)
        toast({
          title: 'Tema değiştirildi',
          description: `Tema ${newTheme === 'dark' ? 'Koyu' : newTheme === 'light' ? 'Açık' : 'Otomatik'} olarak ayarlandı`,
        })
      },
    },
    {
      id: 'currency',
      title: 'Para Birimi',
      subtitle: 'TRY',
      icon: DollarSign,
      path: '/ayarlar/para-birimi',
    },
    {
      id: 'location',
      title: 'Varsayılan Konum',
      subtitle: 'İstanbul',
      icon: MapPin,
      path: '/ayarlar/konum',
    },
    {
      id: 'category',
      title: 'Varsayılan Kategori',
      subtitle: 'Seçilmedi',
      icon: SettingsIcon,
      path: '/ayarlar/kategori',
    },
  ]

  // View Preferences (Toggle Items)
  const [viewPreferences, setViewPreferences] = useState({
    categoryBadges: false,
    urgencyBadges: false,
    userRatings: false,
    distance: false,
  })

  const userPreferencesSettings: ToggleItem[] = [
    {
      id: 'category-badges',
      title: 'Kategori Rozetleri',
      subtitle: 'İlan kartlarında kategori etiketlerini göster',
      value: viewPreferences.categoryBadges,
      onToggle: (checked) => {
        setViewPreferences((prev) => ({ ...prev, categoryBadges: checked }))
        toast({
          title: checked ? 'Kategori rozetleri açıldı' : 'Kategori rozetleri kapatıldı',
        })
      },
    },
    {
      id: 'urgency-badges',
      title: 'Acil Rozetleri',
      subtitle: 'İlan kartlarında acil etiketlerini göster',
      value: viewPreferences.urgencyBadges,
      onToggle: (checked) => {
        setViewPreferences((prev) => ({ ...prev, urgencyBadges: checked }))
        toast({
          title: checked ? 'Acil rozetleri açıldı' : 'Acil rozetleri kapatıldı',
        })
      },
    },
    {
      id: 'user-ratings',
      title: 'Kullanıcı Puanları',
      subtitle: 'İlan kartlarında kullanıcı değerlendirmelerini göster',
      value: viewPreferences.userRatings,
      onToggle: (checked) => {
        setViewPreferences((prev) => ({ ...prev, userRatings: checked }))
        toast({
          title: checked ? 'Kullanıcı puanları açıldı' : 'Kullanıcı puanları kapatıldı',
        })
      },
    },
    {
      id: 'distance',
      title: 'Mesafe Bilgisi',
      subtitle: 'İlan kartlarında mesafe bilgisini göster',
      value: viewPreferences.distance,
      onToggle: (checked) => {
        setViewPreferences((prev) => ({ ...prev, distance: checked }))
        toast({
          title: checked ? 'Mesafe bilgisi açıldı' : 'Mesafe bilgisi kapatıldı',
        })
      },
    },
  ]

  // Support Settings
  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Yardım',
      subtitle: 'Sıkça sorulan sorular ve yardım merkezi',
      icon: HelpCircle,
      path: '/ayarlar/yardim',
    },
    {
      id: 'contact',
      title: 'İletişim',
      subtitle: 'Bizimle iletişime geçin',
      icon: Mail,
      path: '/ayarlar/iletisim',
    },
    {
      id: 'feedback',
      title: 'Geri Bildirim',
      subtitle: 'Önerilerinizi paylaşın',
      icon: MessageSquarePlus,
      path: '/ayarlar/geri-bildirim',
    },
    {
      id: 'about',
      title: 'Hakkında',
      subtitle: 'Platform hakkında bilgiler',
      icon: Info,
      path: '/ayarlar/hakkinda',
    },
  ]

  const renderSettingItem = (item: SettingItem, showDivider = true) => {
    const Icon = item.icon

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
              onClick={() => (item.path ? handleNavigation(item.path) : item.onClick?.())}
              className="w-full p-4 transition-all duration-200 hover:bg-accent/50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.subtitle}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </button>
          </CardContent>
        </Card>
        {showDivider && <Separator className="my-2" />}
      </motion.div>
    )
  }

  const renderToggleItem = (item: ToggleItem, showDivider = true) => {
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
                <div className="text-sm text-muted-foreground">{item.subtitle}</div>
              </div>
              <Switch checked={item.value} onCheckedChange={item.onToggle} className="ml-4" />
            </div>
          </CardContent>
        </Card>
        {showDivider && <Separator className="my-2" />}
      </motion.div>
    )
  }

  if (!user) {
    return null
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
        <EmailInfo user={user} />
      </motion.div>

      {/* Account Settings */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">Hesap</h2>
        <div className="space-y-1">
          {accountSettings.map((item, index) => renderSettingItem(item, index < accountSettings.length - 1))}
        </div>
      </motion.div>

      {/* Chat Settings */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">Sohbet</h2>
        <div className="space-y-1">
          {chatSettings.map((item, index) => renderSettingItem(item, index < chatSettings.length - 1))}
        </div>
      </motion.div>

      {/* App Settings */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">Uygulama</h2>
        <div className="space-y-1">
          {appSettings.map((item, index) => renderSettingItem(item, index < appSettings.length - 1))}
        </div>
      </motion.div>

      {/* User Preferences */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-foreground px-4">Görünüm Tercihleri</h2>
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
        <h2 className="text-lg font-semibold text-foreground px-4">Destek</h2>
        <div className="space-y-1">
          {supportSettings.map((item, index) => renderSettingItem(item, index < supportSettings.length - 1))}
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        className="pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Button variant="destructive" size="lg" onClick={handleLogout} className="w-full">
          <LogOut size={20} className="mr-2" />
          Çıkış Yap
        </Button>
      </motion.div>
    </motion.div>
  )
}

