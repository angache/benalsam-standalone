'use client'

/**
 * Security Settings Client Component
 * 
 * Password change and 2FA management
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Loader2, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { fetchUserProfile } from '@/services/profileService'

export default function SecuritySettingsClient({ userId }: { userId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<string>('')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Parse user agent for better display
    if (typeof window !== 'undefined' && navigator?.userAgent) {
      const ua = navigator.userAgent
      let deviceName = 'Bilinmeyen Tarayıcı'
      
      if (ua.includes('Chrome') && !ua.includes('Edg')) {
        deviceName = 'Chrome (Masaüstü)'
      } else if (ua.includes('Firefox')) {
        deviceName = 'Firefox (Masaüstü)'
      } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        deviceName = 'Safari (Masaüstü)'
      } else if (ua.includes('Edg')) {
        deviceName = 'Edge (Masaüstü)'
      } else if (ua.includes('Mobile')) {
        deviceName = 'Mobil Tarayıcı'
      }
      
      setDeviceInfo(deviceName)
    }
  }, [])

  // Load 2FA status
  useEffect(() => {
    load2FAStatus()
  }, [userId])

  const load2FAStatus = async () => {
    try {
      setLoading(true)
      const profile = await fetchUserProfile(userId)
      
      // Check both possible locations for 2FA status
      // Database field: is_2fa_enabled (boolean) - PRIMARY
      // JSON field: security_settings.two_factor_enabled (legacy fallback)
      const isEnabled = 
        profile?.is_2fa_enabled === true || 
        profile?.security_settings?.two_factor_enabled === true
      
      console.log('🔍 [2FA] Loading 2FA status:', {
        userId,
        is_2fa_enabled: profile?.is_2fa_enabled,
        security_settings: profile?.security_settings,
        finalStatus: isEnabled
      })
      
      setTwoFactorEnabled(isEnabled)
    } catch (error) {
      console.error('Error loading 2FA status:', error)
      toast({
        title: 'Hata',
        description: '2FA durumu yüklenirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Eksik bilgi',
        description: 'Lütfen tüm alanları doldurun',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Şifreler eşleşmiyor',
        description: 'Yeni şifre ve onay şifresi aynı olmalıdır',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Şifre çok kısa',
        description: 'Şifre en az 8 karakter olmalıdır',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Başarılı',
        description: 'Şifreniz başarıyla güncellendi',
      })

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Şifre değiştirilirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    try {
      setSaving(true)

      // TODO: Implement 2FA enable/disable logic
      // This would typically involve:
      // 1. Generating a secret
      // 2. Showing QR code
      // 3. Verifying the code
      // 4. Enabling 2FA in the database

      if (enabled) {
        router.push('/auth/2fa/setup')
      } else {
        // Disable 2FA
        toast({
          title: '2FA devre dışı',
          description: 'İki faktörlü doğrulama devre dışı bırakıldı',
        })
        setTwoFactorEnabled(false)
      }
    } catch (error: any) {
      console.error('Error toggling 2FA:', error)
      toast({
        title: 'Hata',
        description: error.message || '2FA ayarı değiştirilirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Şifre Değiştir
          </CardTitle>
          <CardDescription>Hesap güvenliğiniz için düzenli olarak şifrenizi değiştirin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Mevcut şifrenizi girin"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Yeni şifrenizi girin (min. 8 karakter)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Yeni şifrenizi tekrar girin"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                'Şifreyi Güncelle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            İki Faktörlü Doğrulama (2FA)
          </CardTitle>
          <CardDescription>
            Hesabınızı ekstra bir güvenlik katmanı ile koruyun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">2FA Durumu</p>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? 'İki faktörlü doğrulama aktif'
                  : 'İki faktörlü doğrulama devre dışı'}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handle2FAToggle}
              disabled={saving || loading}
            />
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                İki faktörlü doğrulama aktif. Giriş yaparken telefonunuzdaki doğrulama kodunu
                girmeniz gerekecek.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Aktif Oturumlar</CardTitle>
          <CardDescription>Hesabınıza giriş yapılan cihazları görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Bu Cihaz</p>
                <p className="text-sm text-muted-foreground">
                  {mounted && deviceInfo ? deviceInfo : 'Yükleniyor...'}
                </p>
              </div>
              <Badge variant="default">Aktif</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Diğer oturumları görüntülemek için lütfen daha sonra tekrar kontrol edin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

