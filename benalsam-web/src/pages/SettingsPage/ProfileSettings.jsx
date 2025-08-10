
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { DatePicker } from "@/components/ui/date-picker.jsx";
import { Upload, Save, User, MapPin, CalendarDays, Users } from 'lucide-react';
import { turkishProvincesAndDistricts } from '@/config/locations';
import { useAuthStore } from '@/stores';

const generateBoringAvatarUrl = (name, userId) => {
  const cleanedName = name ? String(name).replace(/[^a-zA-Z0-9]/g, '') : '';
  const fallbackName = cleanedName || (userId ? String(userId).substring(0, 8) : 'user');
  return `https://source.boringavatars.com/beam/120/${fallbackName}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`;
};

const ProfileSettings = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    birthDate: null,
    gender: '',
    neighborhood: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.first_name || '',
        lastName: currentUser.last_name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        birthDate: currentUser.birth_date ? new Date(currentUser.birth_date) : null,
        gender: currentUser.gender || '',
        neighborhood: currentUser.neighborhood || '',
      });
      setSelectedProvince(currentUser.province || '');
      if (currentUser.province) {
        const provinceData = turkishProvincesAndDistricts.find(p => p.name === currentUser.province);
        setDistricts(provinceData?.districts || []);
      }
      setSelectedDistrict(currentUser.district || '');
      setAvatarPreview(currentUser.avatar_url ? `${currentUser.avatar_url}?t=${new Date().getTime()}` : generateBoringAvatarUrl(currentUser.name, currentUser.id));
      setIsLoading(false);
    }
  }, [currentUser]);
  
  const handleProvinceChange = (provinceName) => {
    if (provinceName === 'none') {
      setSelectedProvince('');
      setSelectedDistrict('');
      setDistricts([]);
      return;
    }
    setSelectedProvince(provinceName);
    const provinceData = turkishProvincesAndDistricts.find(p => p.name === provinceName);
    const newDistricts = provinceData?.districts || [];
    setDistricts(newDistricts);
    
    if (selectedDistrict && !newDistricts.includes(selectedDistrict)) {
        setSelectedDistrict('');
    }
  };

  const handleDistrictChange = (districtName) => {
    if (districtName === 'none') {
      setSelectedDistrict('');
      return;
    }
    setSelectedDistrict(districtName);
  };

  const handleGenderChange = (value) => {
    if (value === 'none') {
      setFormData(prev => ({ ...prev, gender: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Dosya Boyutu Büyük", description: "Avatar 2MB'den küçük olmalıdır.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    let avatarUrl = currentUser.avatar_url;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast({ title: "Avatar Yükleme Hatası", description: uploadError.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 100) {
          setUploadProgress(currentProgress);
        } else {
          clearInterval(progressInterval);
        }
      }, 100);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
      clearInterval(progressInterval); 
      setUploadProgress(100);
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const updates = {
      id: currentUser.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      name: fullName || currentUser.name, 
      username: formData.username || null,
      bio: formData.bio,
      province: selectedProvince || null,
      district: selectedDistrict || null,
      neighborhood: formData.neighborhood || null,
      avatar_url: avatarUrl,
      birth_date: formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : null,
      gender: formData.gender || null,
      updated_at: new Date(),
    };

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single();

    setIsUploading(false);
    if (error) {
      toast({ title: "Profil Güncelleme Hatası", description: error.message, variant: "destructive" });
    } else if (updatedProfile) {
      const newAvatarUrl = updatedProfile.avatar_url ? `${updatedProfile.avatar_url}?t=${new Date().getTime()}` : generateBoringAvatarUrl(updatedProfile.name, updatedProfile.id);
      setCurrentUser(prev => ({ ...prev, ...updatedProfile, avatar_url: newAvatarUrl }));
      setAvatarFile(null);
      setAvatarPreview(newAvatarUrl);
      toast({ title: "Profil Güncellendi!", description: "Profil bilgileriniz başarıyla kaydedildi." });
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={avatarPreview} alt={currentUser?.name} key={avatarPreview} />
            <AvatarFallback className="text-3xl bg-muted">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User />}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="avatarUpload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="w-8 h-8 text-white" />
            <input type="file" id="avatarUpload" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
        <div>
          <h3 className="text-xl font-semibold">{currentUser?.name || "Kullanıcı Adı"}</h3>
          <p className="text-sm text-muted-foreground">Profil fotoğrafınızı ve kişisel bilgilerinizi güncelleyin.</p>
        </div>
      </div>
      {isUploading && avatarFile && (
        <div className="w-full bg-muted rounded-full h-2.5 mt-2">
          <div className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">Ad</label>
          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Adınız" icon={<User className="w-4 h-4 text-muted-foreground" />} />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">Soyad</label>
          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Soyadınız" icon={<User className="w-4 h-4 text-muted-foreground" />} />
        </div>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">Kullanıcı Adı (Takma Ad)</label>
        <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="benzersiz_kullanici_adi" icon={<User className="w-4 h-4 text-muted-foreground" />} />
        <p className="text-xs text-muted-foreground mt-1">Bu ad profil URL'nizde görünecektir.</p>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">Kısa Biyografi / Hakkında</label>
        <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Kendinizden kısaca bahsedin..." className="min-h-[100px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label htmlFor="province" className="block text-sm font-medium mb-1">Şehir (İl)</label>
          <Select value={selectedProvince || ''} onValueChange={handleProvinceChange}>
            <SelectTrigger id="province" className="w-full" icon={<MapPin className="w-4 h-4 text-muted-foreground" />}>
              <SelectValue placeholder="İl Seçin" />
            </SelectTrigger>
            <SelectContent className="dropdown-content">
              <SelectItem value="none">Seçimi Kaldır</SelectItem>
              {turkishProvincesAndDistricts.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="district" className="block text-sm font-medium mb-1">İlçe</label>
          <Select value={selectedDistrict || ''} onValueChange={handleDistrictChange} disabled={!selectedProvince || districts.length === 0}>
            <SelectTrigger id="district" className="w-full" icon={<MapPin className="w-4 h-4 text-muted-foreground" />}>
              <SelectValue placeholder="İlçe Seçin" />
            </SelectTrigger>
            <SelectContent className="dropdown-content">
              <SelectItem value="none">Seçimi Kaldır</SelectItem>
              {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium mb-1">Mahalle</label>
          <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} placeholder="Mahalle adını girin" icon={<MapPin className="w-4 h-4 text-muted-foreground" />} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium mb-1">Doğum Tarihi (İsteğe Bağlı)</label>
          <DatePicker date={formData.birthDate} setDate={(date) => setFormData(prev => ({ ...prev, birthDate: date }))} placeholder="Doğum tarihinizi seçin" />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1">Cinsiyet (İsteğe Bağlı)</label>
          <Select value={formData.gender || ''} onValueChange={handleGenderChange}>
            <SelectTrigger id="gender" className="w-full" icon={<Users className="w-4 h-4 text-muted-foreground" />}>
              <SelectValue placeholder="Cinsiyetinizi seçin" />
            </SelectTrigger>
            <SelectContent className="dropdown-content">
              <SelectItem value="none">Seçimi Kaldır</SelectItem>
              <SelectItem value="male">Erkek</SelectItem>
              <SelectItem value="female">Kadın</SelectItem>
              <SelectItem value="other">Diğer</SelectItem>
              <SelectItem value="prefer_not_to_say">Belirtmek İstemiyorum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isUploading} className="btn-primary">
          <Save className="w-4 h-4 mr-2" /> {isUploading ? `Kaydediliyor... (${uploadProgress}%)` : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </form>
  );
};

export default ProfileSettings;
