import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { useUpdateProfile, useMyProfile } from '../hooks/queries/useAuth';
import { Button, LoadingSpinner, Select, LocationSelector } from '../components';
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
  Edit3
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaskedTextInput } from 'react-native-mask-text';
import { uploadImages } from '../services/imageService';
import ErrorBoundary from '../components/ErrorBoundary';
import { useApp } from '../contexts/AppContext';

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { selectedLocation, setSelectedLocation } = useApp();
  const updateProfileMutation = useUpdateProfile();
  const { data: profile, isLoading: isLoadingProfile, error: profileError, refetch } = useMyProfile();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

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

  const [errors, setErrors] = useState<{
    username?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    birth_date?: string;
  }>({});

  // Debug logları ekle
  useEffect(() => {
    console.log('Profile data:', profile);
  }, [profile]);

  // Profil verisi geldiğinde form verilerini güncelle
  useEffect(() => {
    console.log('Setting form data from profile:', profile);
    if (profile) {
      // Eğer first_name ve last_name null ise name'i parçala
      let firstName = profile.first_name;
      let lastName = profile.last_name;
      
      if ((!firstName || !lastName) && profile.name) {
        const nameParts = profile.name.trim().split(' ').filter((part: string) => part.length > 0);
        
        if (nameParts.length > 0) {
          // İsim parçalarının sayısına göre ayırma stratejisi
          if (nameParts.length === 1) {
            // Tek kelime varsa first_name olarak al
            firstName = nameParts[0];
            lastName = '';
          } else if (nameParts.length === 2) {
            // İki kelime varsa ilki first_name, ikincisi last_name
            firstName = nameParts[0];
            lastName = nameParts[1];
          } else {
            // İkiden fazla kelime varsa:
            // - Son kelime her zaman soyad
            // - Önceki kelimeler ad
            lastName = nameParts[nameParts.length - 1];
            firstName = nameParts.slice(0, -1).join(' ');
          }
        }
      }

      const newFormData = {
        username: profile.username || '',
        first_name: firstName || '',
        last_name: lastName || '',
        bio: profile.bio || '',
        province: profile.province || '',
        district: profile.district || '',
        neighborhood: profile.neighborhood || '',
        phone_number: profile.phone_number || null,
        birth_date: profile.birth_date || null,
        gender: profile.gender || '',
        social_links: profile.social_links || {
          instagram: '',
          twitter: '',
          linkedin: '',
          facebook: '',
          website: '',
          youtube: ''
        },
      };
      console.log('New form data:', newFormData);
      setFormData(newFormData);
      
      // Avatar URI'sini ayarla
      if (profile.avatar_url) {
        setAvatarUri(profile.avatar_url);
      }
    }
  }, [profile]);

  // Form verilerinin değişimini izle
  useEffect(() => {
    console.log('Current form data:', formData);
    // Sadece profil yüklendikten sonra değişiklikleri kontrol et
    if (profile) {
      // Social links değişikliklerini kontrol et
      const currentSocialLinks = profile.social_links || {
        instagram: '',
        twitter: '',
        linkedin: '',
        facebook: '',
        website: '',
        youtube: ''
      };
      
      const socialLinksChanged = JSON.stringify(formData.social_links) !== JSON.stringify(currentSocialLinks);
      
      const hasChanges = Boolean(
        formData.username !== profile.username ||
        formData.first_name !== profile.first_name ||
        formData.last_name !== profile.last_name ||
        formData.bio !== (profile.bio || '') ||
        formData.province !== (profile.province || '') ||
        formData.district !== (profile.district || '') ||
        formData.neighborhood !== (profile.neighborhood || '') ||
        formData.phone_number !== (profile.phone_number || '') ||
        formData.birth_date !== (profile.birth_date || '') ||
        (formData.gender || '') !== (profile.gender || '') ||
        (avatarUri && avatarUri !== profile.avatar_url) ||
        socialLinksChanged
      );
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, profile, avatarUri]);

  // İl ve ilçe seçimi yapıldığında form verilerini güncelle
  useEffect(() => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        province: selectedLocation.province,
        district: selectedLocation.district,
      }));
      
      // Location seçimi tamamlandıktan sonra context'i temizle
      setSelectedLocation(null);
    }
  }, [selectedLocation, setSelectedLocation]);

  // Swipe gesture'ını kontrol et
  usePreventRemove(
    hasUnsavedChanges,
    useCallback(() => {
      Alert.alert(
        'Kaydedilmemiş Değişiklikler',
        'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Çık', 
            style: 'destructive',
            onPress: () => {
              // hasUnsavedChanges'i false yap ve navigation'ı yönlendir
              setHasUnsavedChanges(false);
              setTimeout(() => {
                navigation.goBack();
              }, 100);
            }
          }
        ]
      );
    }, [navigation])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleSelectLocation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLocationSelector(true);
  };

  const handleLocationSelect = (province: string, district: string) => {
    console.log('📍 Location selected:', province, district);
    
    // İl veya ilçe değiştiğinde mahalle bilgisini sıfırla
    const provinceChanged = formData.province !== province;
    const districtChanged = formData.district !== district;
    
    if (provinceChanged || districtChanged) {
      setFormData(prev => ({ ...prev, neighborhood: '' }));
      console.log('📍 Neighborhood reset due to location change');
    }
    
    setFormData(prev => ({
      ...prev,
      province: province,
      district: district
    }));
    
    setShowLocationSelector(false);
  };

  const handlePickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // İzinleri kontrol et
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          'Fotoğraf seçmek için galeri izni gereklidir.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      // Fotoğraf seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleTakePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // İzinleri kontrol et
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          'Fotoğraf çekmek için kamera izni gereklidir.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      // Fotoğraf çek
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Camera error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const validateForm = () => {
    const newErrors: {
      username?: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      birth_date?: string;
    } = {};

    // Kullanıcı adı kontrolü
    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı zorunludur';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
    }

    // Ad kontrolü
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Ad zorunludur';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'Ad en az 2 karakter olmalıdır';
    }

    // Soyad kontrolü
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Soyad zorunludur';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Soyad en az 2 karakter olmalıdır';
    }

    // Telefon numarası kontrolü
    if (formData.phone_number && formData.phone_number.replace(/\D/g, '').length !== 11) {
      newErrors.phone_number = 'Geçerli bir telefon numarası giriniz';
    }

    // Doğum tarihi kontrolü
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (isNaN(birthDate.getTime())) {
        newErrors.birth_date = 'Geçerli bir tarih giriniz';
      } else if (age < 18) {
        newErrors.birth_date = '18 yaşından büyük olmalısınız';
      } else if (age > 100) {
        newErrors.birth_date = 'Geçerli bir doğum tarihi giriniz';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let avatarUrl = profile?.avatar_url; // Mevcut avatar URL'ini koru

      // Eğer yeni avatar seçildiyse upload et
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        try {
          // Avatar dosyasını hazırla
          const avatarFile = {
            uri: avatarUri,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          };

          // Avatar'ı upload et
          const uploadedUrls = await uploadImages([avatarFile], user?.id || '', 'avatars');
          avatarUrl = uploadedUrls[0]; // İlk URL'yi al
          
          console.log('Avatar uploaded successfully:', avatarUrl);
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          Alert.alert('Hata', 'Avatar yüklenirken bir hata oluştu. Profil bilgileri güncellendi ancak avatar değişmedi.');
        }
      }

      // Ad ve soyadı birleştirerek name alanını oluştur
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`;

      const updateData = {
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        name: fullName, // Birleştirilmiş ad soyad
        bio: formData.bio.trim(),
        province: formData.province,
        district: formData.district,
        neighborhood: formData.neighborhood,
        phone_number: formData.phone_number ? formData.phone_number.trim() : null,
        birth_date: formData.birth_date || null,
        gender: formData.gender,
        avatar_url: avatarUrl, // Yeni avatar URL'ini ekle
        social_links: formData.social_links,
      };

      await updateProfileMutation.mutateAsync(updateData);

      setHasUnsavedChanges(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Profil güncellenirken bir hata oluştu';
      
      if (error?.message?.includes('duplicate key') && error?.message?.includes('username')) {
        errorMessage = 'Bu kullanıcı adı zaten kullanılıyor';
      } else if (error?.message?.includes('No user logged in')) {
        errorMessage = 'Oturum hatası. Lütfen tekrar giriş yapın.';
      } else if (error?.message?.includes('validation')) {
        errorMessage = 'Girdiğiniz bilgiler geçersiz. Lütfen kontrol edin.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'İnternet bağlantınızı kontrol edin.';
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Hata',
        errorMessage,
        [
          { 
            text: 'Tamam',
            onPress: () => {
              if (error?.message?.includes('No user logged in')) {
                navigation.navigate('Login' as never);
              }
            }
          }
        ]
      );
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, birth_date: formattedDate }));
    }
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Kaydedilmemiş Değişiklikler',
        'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Çık', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Profil yüklenirken loading göster
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Profil bilgileri yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Profil yüklenirken hata olduysa hata göster
  if (profileError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            Profil bilgileri yüklenirken bir hata oluştu.
          </Text>
          <Button
            title="Tekrar Dene"
            onPress={() => refetch()}
            style={{ backgroundColor: colors.primary }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Profil verisi yoksa hata göster
  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            Profil bilgileri bulunamadı.
          </Text>
          <Button
            title="Geri Dön"
            onPress={() => navigation.goBack()}
            style={{ backgroundColor: colors.primary }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profili Düzenle
          </Text>
          {hasUnsavedChanges && (
            <Text style={[styles.unsavedIndicator, { color: colors.primary }]}>
              Kaydedilmemiş değişiklikler
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={updateProfileMutation.isPending || !hasUnsavedChanges}
          style={[
            styles.saveButton, 
            { 
              opacity: (updateProfileMutation.isPending || !hasUnsavedChanges) ? 0.5 : 1 
            }
          ]}
          activeOpacity={0.7}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Save size={24} color={hasUnsavedChanges ? colors.primary : colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
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
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <User size={40} color={colors.primary} />
              </View>
            )}
            
            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={[styles.avatarActionButton, { backgroundColor: colors.primary }]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Camera size={16} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.avatarActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Upload size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
            Profil fotoğrafınızı değiştirmek için dokunun
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Kullanıcı Adı *</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: errors.username ? colors.error : colors.border
              }
            ]}
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            placeholder="Kullanıcı adınız"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.username ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.username}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Ad *</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: errors.first_name ? colors.error : colors.border
              }
            ]}
            value={formData.first_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
            placeholder="Adınız"
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
          />
          {errors.first_name ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.first_name}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Soyad *</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: errors.last_name ? colors.error : colors.border
              }
            ]}
            value={formData.last_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
            placeholder="Soyadınız"
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
          />
          {errors.last_name ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.last_name}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Telefon Numarası</Text>
          <MaskedTextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: errors.phone_number ? colors.error : colors.border
              }
            ]}
            value={formData.phone_number}
            onChangeText={(text: string, rawText: string) => setFormData(prev => ({ ...prev, phone_number: rawText }))}
            mask="0599 999 99 99"
            placeholder="05XX XXX XX XX"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
          {errors.phone_number ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone_number}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Doğum Tarihi</Text>
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              { 
                backgroundColor: colors.surface,
                borderColor: errors.birth_date ? colors.error : colors.border,
                justifyContent: 'center'
              }
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.datePickerText, { color: formData.birth_date ? colors.text : colors.textSecondary }]}>
              {formData.birth_date || 'Doğum tarihinizi seçin'}
            </Text>
          </TouchableOpacity>
          {errors.birth_date ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.birth_date}</Text>
            </View>
          ) : null}
          {showDatePicker && (
            <DateTimePicker
              value={formData.birth_date ? new Date(formData.birth_date) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Cinsiyet</Text>
          <Select
            value={formData.gender}
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, gender: value }))}
            options={[
              { label: 'Seçiniz', value: '' },
              { label: 'Kadın', value: 'female' },
              { label: 'Erkek', value: 'male' },
              { label: 'Diğer', value: 'other' },
              { label: 'Belirtmek İstemiyorum', value: 'prefer_not_to_say' }
            ]}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
            textStyle={{ color: colors.text }}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Hakkımda</Text>
          <TextInput
            style={[
              styles.textArea,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Kendinizden bahsedin..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
            {formData.bio.length}/500
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Konum</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              { 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }
            ]}
            onPress={handleSelectLocation}
          >
            <MapPin size={20} color={colors.textSecondary} style={styles.locationIcon} />
            <Text style={[styles.locationText, { color: colors.text }]}>
              {formData.province && formData.district 
                ? `${formData.province}, ${formData.district}`
                : 'İl ve ilçe seçin'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Mahalle (İsteğe bağlı)</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            value={formData.neighborhood}
            onChangeText={(text) => setFormData(prev => ({ ...prev, neighborhood: text }))}
            placeholder="Mahalle adını girin"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Social Links Section */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Sosyal Medya Linkleri</Text>
          
          <View style={styles.socialLinksContainer}>
            <View style={styles.socialLinkItem}>
              <Text style={[styles.socialLinkLabel, { color: colors.textSecondary }]}>Instagram</Text>
              <TextInput
                style={[
                  styles.socialLinkInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.social_links.instagram}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, instagram: text }
                }))}
                placeholder="instagram.com/kullaniciadi"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.socialLinkItem}>
              <Text style={[styles.socialLinkLabel, { color: colors.textSecondary }]}>Twitter/X</Text>
              <TextInput
                style={[
                  styles.socialLinkInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.social_links.twitter}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, twitter: text }
                }))}
                placeholder="twitter.com/kullaniciadi"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.socialLinkItem}>
              <Text style={[styles.socialLinkLabel, { color: colors.textSecondary }]}>LinkedIn</Text>
              <TextInput
                style={[
                  styles.socialLinkInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.social_links.linkedin}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, linkedin: text }
                }))}
                placeholder="linkedin.com/in/kullaniciadi"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.socialLinkItem}>
              <Text style={[styles.socialLinkLabel, { color: colors.textSecondary }]}>Facebook</Text>
              <TextInput
                style={[
                  styles.socialLinkInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.social_links.facebook}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, facebook: text }
                }))}
                placeholder="facebook.com/kullaniciadi"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.socialLinkItem}>
              <Text style={[styles.socialLinkLabel, { color: colors.textSecondary }]}>Website</Text>
              <TextInput
                style={[
                  styles.socialLinkInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.social_links.website}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, website: text }
                }))}
                placeholder="https://example.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.socialLinkItem}>
              <Text style={[styles.socialLinkLabel, { color: colors.textSecondary }]}>YouTube</Text>
              <TextInput
                style={[
                  styles.socialLinkInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={formData.social_links.youtube}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  social_links: { ...prev.social_links, youtube: text }
                }))}
                placeholder="youtube.com/@kanal"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={updateProfileMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          onPress={handleSave}
          disabled={updateProfileMutation.isPending || !hasUnsavedChanges}
          style={{ 
            backgroundColor: hasUnsavedChanges ? colors.primary : colors.surface,
            opacity: (updateProfileMutation.isPending || !hasUnsavedChanges) ? 0.5 : 1
          }}
          textStyle={{ 
            color: hasUnsavedChanges ? colors.white : colors.textSecondary 
          }}
        />
      </View>

      {/* Location Selector Modal */}
      <LocationSelector
        visible={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelect={handleLocationSelect}
        title="Konum Seçin"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  unsavedIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  avatarActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
  },
  errorIcon: {
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  locationButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
  },
  datePickerButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
  },
  socialLinksContainer: {
    gap: 12,
  },
  socialLinkItem: {
    marginBottom: 8,
  },
  socialLinkLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  socialLinkInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});

export default EditProfileScreen; 