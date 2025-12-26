'use client'

/**
 * Profile Settings Client Component
 * 
 * Form to edit user profile information
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fetchUserProfile, updateUserProfile } from '@/services/profileService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import { Loader2, User, Mail, Phone, MapPin, Globe, FileText, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  full_name?: string
  phone?: string
  location?: string
  bio?: string
  website?: string
  avatar_url?: string
}

export default function ProfileSettingsClient({ userId }: { userId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    avatar_url: '',
  })

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await fetchUserProfile(userId)
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          website: profileData.website || '',
          avatar_url: profileData.avatar_url || '',
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: 'Hata',
        description: 'Profil bilgileri yüklenirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Geçersiz dosya',
        description: 'Lütfen bir resim dosyası seçin',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Dosya çok büyük',
        description: 'Maksimum dosya boyutu 5MB olmalıdır',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploading(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Update profile with new avatar URL
      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }))

      toast({
        title: 'Avatar yüklendi',
        description: 'Profil fotoğrafınız başarıyla güncellendi',
      })
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Avatar yüklenirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: 'Hata',
        description: 'Oturum açmanız gerekiyor',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      const updatedProfile = await updateUserProfile(userId, {
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        website: profile.website,
        avatar_url: profile.avatar_url,
      })

      if (updatedProfile) {
        toast({
          title: 'Başarılı',
          description: 'Profil bilgileriniz güncellendi',
        })
        // Refresh the page to show updated data
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Profil güncellenirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Fotoğrafı</CardTitle>
          <CardDescription>Profil fotoğrafınızı güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'Kullanıcı'} />
              <AvatarFallback className="text-2xl">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Fotoğraf Yükle
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                JPG, PNG veya GIF. Maksimum 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Kişisel Bilgiler</CardTitle>
          <CardDescription>Adınız, telefon ve konum bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              <User className="inline h-4 w-4 mr-2" />
              Ad Soyad
            </Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-2" />
              E-posta
            </Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground">
              E-posta adresiniz değiştirilemez
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="inline h-4 w-4 mr-2" />
              Telefon
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+90 555 123 45 67"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline h-4 w-4 mr-2" />
              Konum
            </Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="İstanbul, Türkiye"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Ek Bilgiler</CardTitle>
          <CardDescription>Hakkınızda ve web siteniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">
              <FileText className="inline h-4 w-4 mr-2" />
              Hakkımda
            </Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground">
              {profile.bio.length}/500 karakter
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              <Globe className="inline h-4 w-4 mr-2" />
              Web Sitesi
            </Label>
            <Input
              id="website"
              type="url"
              value={profile.website}
              onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            'Değişiklikleri Kaydet'
          )}
        </Button>
      </div>
    </form>
  )
}

