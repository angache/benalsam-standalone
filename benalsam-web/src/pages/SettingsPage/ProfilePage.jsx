import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  Camera, 
  User,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Calendar,
  Phone,
  Edit3,
  Camera as CameraIcon,
  Loader2,
  AtSign,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  UserCheck,
  MapPin as MapPinIcon,
  X
} from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import OptimizedImage from '@/components/OptimizedImage';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';
import { useAuthStore } from '../../stores';
import { supabase } from '../../lib/supabaseClient';
import { uploadService } from '../../services/uploadService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
    province: '',
    district: '',
    neighborhood: '',
    phone_number: '',
    birth_date: '',
    gender: '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
      facebook: '',
      website: '',
      youtube: ''
    },
  });

  const [errors, setErrors] = useState({});

  // Mevcut profil bilgilerini yükle
  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) throw error;

        if (profile) {
          setFormData({
            username: profile.username || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            bio: profile.bio || '',
            province: profile.province || '',
            district: profile.district || '',
            neighborhood: profile.neighborhood || '',
            phone_number: profile.phone_number || '',
            birth_date: profile.birth_date || '',
            gender: profile.gender || '',
            social_links: profile.social_links || {
              instagram: '',
              twitter: '',
              linkedin: '',
              facebook: '',
              website: '',
              youtube: ''
            },
          });

          if (profile.avatar_url) {
            setAvatarUri(profile.avatar_url);
            setCurrentAvatarUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Hata",
          description: "Profil bilgileri yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    };

    loadProfileData();
  }, [currentUser?.id, toast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handlePickImage = () => {
    triggerHaptic();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleAvatarUpload(file);
      }
    };
    input.click();
  };

  const handleTakePhoto = () => {
    triggerHaptic();
    toast({
      title: "Kamera Özelliği",
      description: "Kamera özelliği yakında eklenecek. Şimdilik galeriden fotoğraf seçebilirsiniz.",
    });
  };

  const handleAvatarUpload = async (file) => {
    if (!currentUser?.id) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Upload Service'e yükle
      uploadService.setUserId(currentUser.id);
      
      // Check if Upload Service is available
      const isAvailable = await uploadService.isAvailable();
      let publicUrl;
      
      if (isAvailable) {
        // Use Upload Service
        const uploadedImage = await uploadService.uploadSingleImage(file, 'profile');
        publicUrl = uploadedImage.url;
      } else {
        // Fallback to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/profile.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
            cacheControl: '0',
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl: supabaseUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        publicUrl = supabaseUrl;
        
        // CDN propagation için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Profil bilgisini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // State'i güncelle
      setAvatarUri(publicUrl);
      setCurrentAvatarUrl(publicUrl);
      setHasUnsavedChanges(true);

      toast({
        title: "Başarılı!",
        description: "Profil fotoğrafınız başarıyla güncellendi.",
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Hata",
        description: "Profil fotoğrafı yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!currentUser?.id) return;

    try {
      // Profil bilgisini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // State'i güncelle
      setAvatarUri(null);
      setCurrentAvatarUrl(null);
      setHasUnsavedChanges(true);

      toast({
        title: "Başarılı!",
        description: "Profil fotoğrafınız kaldırıldı.",
      });

    } catch (error) {
      console.error('Avatar removal error:', error);
      toast({
        title: "Hata",
        description: "Profil fotoğrafı kaldırılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    triggerHaptic();
    setIsLoading(true);
    
    try {
      // Profil bilgilerini güncelle
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          province: formData.province,
          district: formData.district,
          neighborhood: formData.neighborhood,
          phone_number: formData.phone_number,
          birth_date: formData.birth_date,
          gender: formData.gender,
          social_links: formData.social_links,
          avatar_url: currentAvatarUrl,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setHasUnsavedChanges(false);
      
      toast({
        title: "Başarılı!",
        description: "Profil bilgileriniz başarıyla kaydedildi.",
      });
      
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      
      toast({
        title: "Hata",
        description: "Profil kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?')) {
        navigate('/ayarlar');
      }
    } else {
      navigate('/ayarlar');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="hover:bg-accent"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Profili Düzenle</h1>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Badge variant="secondary" className="text-primary border-primary/20 mt-1">
                Kaydedilmemiş değişiklikler
              </Badge>
            </motion.div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isLoading || !hasUnsavedChanges}
          className="hover:bg-accent"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save size={20} className={hasUnsavedChanges ? 'text-primary' : 'text-muted-foreground'} />
          )}
        </Button>
      </motion.div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {isUploadingAvatar ? (
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                  ) : avatarUri ? (
                    <div className="relative group">
                      <OptimizedImage 
                        src={avatarUri} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover"
                        loading="eager"
                        sizes="96px"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={removeAvatar}
                          className="text-white hover:text-red-400 transition-colors"
                        >
                          <X size={20} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <User size={40} className="text-primary" />
                  )}
                </div>
                
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <Button
                    size="icon"
                    onClick={handleTakePhoto}
                    disabled={isUploadingAvatar}
                    className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CameraIcon size={16} />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePickImage}
                    disabled={isUploadingAvatar}
                    className="w-8 h-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-1">Profil Fotoğrafı</h3>
                <p className="text-sm text-muted-foreground">
                  {isUploadingAvatar ? 'Fotoğraf yükleniyor...' : 'Profil fotoğrafınızı değiştirmek için tıklayın'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Basic Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-primary" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <AtSign className="w-4 h-4 mr-1" />
                  Kullanıcı Adı *
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Kullanıcı adınız"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Ad *
                </label>
                <Input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Adınız"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Soyad *
                </label>
                <Input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Soyadınız"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Telefon
                </label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+90 555 123 4567"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Doğum Tarihi
                </label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Cinsiyet
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center">
                <Edit3 className="w-4 h-4 mr-1" />
                Hakkımda
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                placeholder="Kendinizden bahsedin..."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2 text-primary" />
              Konum Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  İl
                </label>
                <Input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  placeholder="İl"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  İlçe
                </label>
                <Input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="İlçe"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Mahalle
                </label>
                <Input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  placeholder="Mahalle"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Globe className="w-5 h-5 mr-2 text-primary" />
              Sosyal Medya
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Instagram className="w-4 h-4 mr-1" />
                  Instagram
                </label>
                <Input
                  type="text"
                  value={formData.social_links.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  placeholder="@kullaniciadi"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </label>
                <Input
                  type="text"
                  value={formData.social_links.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  placeholder="@kullaniciadi"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Linkedin className="w-4 h-4 mr-1" />
                  LinkedIn
                </label>
                <Input
                  type="text"
                  value={formData.social_links.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="kullaniciadi"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Facebook className="w-4 h-4 mr-1" />
                  Facebook
                </label>
                <Input
                  type="text"
                  value={formData.social_links.facebook}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  placeholder="kullaniciadi"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  Website
                </label>
                <Input
                  type="url"
                  value={formData.social_links.website}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <Youtube className="w-4 h-4 mr-1" />
                  YouTube
                </label>
                <Input
                  type="text"
                  value={formData.social_links.youtube}
                  onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                  placeholder="@kanaladi"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage; 