import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Edit3, MapPin, Camera, CheckCircle, Star, Clock, ChevronDown, FileText, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '../stores';
import { useCreateListingStore } from '../stores';
import { useAuthStore } from '../stores';
import { Button } from '../components';
import { createListing } from '../services/listingService';
import analyticsService from '../services/analyticsService';

const { width } = Dimensions.get('window');

const CreateListingConfirmScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { data, setStepData, reset } = useCreateListingStore();
  const { user, loading } = useAuthStore();
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [selectedContactPreference, setSelectedContactPreference] = useState('site');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [autoRepublish, setAutoRepublish] = useState(false);
  
  const durationOptions = [
    { label: '7 Gün', value: 7 },
    { label: '15 Gün', value: 15 },
    { label: '30 Gün', value: 30 },
    { label: '60 Gün', value: 60 }
  ];

  const contactOptions = [
    { label: 'Sadece Site Üzerinden Mesaj', value: 'site' },
    { label: 'Telefon ve Site Mesajı', value: 'phone_site' },
    { label: 'Tüm İletişim Yolları', value: 'all' }
  ];

  const handlePublish = async () => {
    if (!termsAccepted || isPublishing) return;

    try {
      setIsPublishing(true);
      
      // Debug: Store verilerini kontrol et
      console.log('📋 CreateListingConfirm - Store data:', data);
      console.log('📋 CreateListingConfirm - data.category:', data.category);
      console.log('📋 CreateListingConfirm - data.details?.category:', data.details?.category);
      
      // Validation
      const validationErrors: string[] = [];
      
      if (!data.details?.title?.trim()) {
        validationErrors.push('Başlık zorunludur');
      }
      
      if (!data.details?.description?.trim()) {
        validationErrors.push('Açıklama zorunludur');
      }
      
      if (!data.details?.budget || data.details.budget <= 0) {
        validationErrors.push('Geçerli bir bütçe giriniz');
      }
      
      // Category validation - hem data.category hem de data.details.category'yi kontrol et
      const category = data.category || data.details?.category;
      const categoryString = Array.isArray(category) ? category.join(' > ') : category;
      if (!categoryString?.trim()) {
        validationErrors.push('Kategori seçimi zorunludur');
      }
      
      if (!data.location?.province || !data.location?.district) {
        validationErrors.push('Konum seçimi zorunludur');
      }
      
      if (!data.images?.images?.length) {
        validationErrors.push('En az bir fotoğraf eklemelisiniz');
      }
      
      if (!termsAccepted) {
        validationErrors.push('İlan kurallarını kabul etmelisiniz');
      }

      if (validationErrors.length > 0) {
        Alert.alert('Eksik Bilgiler', validationErrors.join('\n'));
        return;
      }

      if (!categoryString || !user?.id) {
        Alert.alert('Hata', 'Kategori seçimi ve kullanıcı girişi zorunludur');
        return;
      }

      // Resimleri string array'e dönüştür
      const imageUrls = data.images?.images.map(img => img.uri || img.url || '') || [];

      // Listing data oluştur
      const listingData = {
        title: data.details.title || '',
        description: data.details.description || '',
        budget: data.details.budget || 0,
        category: categoryString,
        location: `${data.location.province} / ${data.location.district}${data.location.neighborhood ? ' / ' + data.location.neighborhood : ''}`,
        images: imageUrls,
        mainImageIndex: data.images?.mainImageIndex || 0,
        duration: data.details?.duration || 30,
        contactPreference: (data.details?.contactPreference || 'site_only') as 'email' | 'phone' | 'both',
        autoRepublish: autoRepublish,
        urgency: 'low' as const,
        acceptTerms: true,
        user_id: user.id,
        is_featured: data.details?.premiumFeatures?.highlight || false,
        is_urgent_premium: data.details?.premiumFeatures?.urgent || false,
        is_showcase: data.details?.premiumFeatures?.showcase || false,
        condition: Array.isArray(data.details?.condition)
          ? data.details.condition
          : [data.details?.condition || 'İkinci El'],
        attributes: data.details?.attributes || {},
      };

      const result = await createListing(listingData);

      if (!result.data || !result.data.id) {
        throw new Error('İlan yayınlanırken bir hata oluştu - ' + (result.error?.message || 'Bilinmeyen hata'));
      }

      // Track form submit event
      analyticsService.trackEvent('FORM_SUBMIT', {
        form_name: 'create_listing',
        form_id: 'listing_creation',
        listing_id: result.data?.id || '',
        listing_title: listingData.title,
        listing_category: listingData.category,
        listing_price: listingData.budget,
        listing_location: listingData.location,
        form_duration: Date.now() - Date.now(), // Simplified duration
        form_completion_rate: 100
      });

      Alert.alert(
        'Başarılı!',
        'İlanınız başarıyla oluşturuldu ve onay bekliyor.',
        [
          {
            text: 'İlanımı Görüntüle',
            onPress: () => {
              // Önce context'i tamamen temizle
              reset(); 
              
              // Ana tab navigator'a git, sonra listing detail'e git
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Home', params: { navigateToListing: result.data.id } } }],
              });
            }
          },
          {
            text: 'Ana Sayfa',
            onPress: () => {
              // Önce context'i tamamen temizle
              reset();
              
              // Ana tab navigator'a git ve stack'i reset et
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Publish error:', error);
      
      let errorMessage = 'İlan yayınlanırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error instanceof Error) {
        // Kullanıcı dostu hata mesajları
        if (error.message.includes('Kullanıcı oturumu')) {
          errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'Bu ilan daha önce oluşturulmuş. Lütfen farklı bir başlık deneyin.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'Bu işlem için yetkiniz bulunmuyor.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
        }
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEdit = (step: string) => {
    navigation.navigate(step);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR').format(price) + ' ₺';
  };

  const getMainImage = () => {
    if (!data.images?.images?.length) return null;
    const mainIndex = data.images.mainImageIndex || 0;
    return data.images.images[mainIndex];
  };

  const handleTermsAccept = () => {
    setTermsAccepted(!termsAccepted);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.completedStep, { backgroundColor: colors.primary }]}>
              <CheckCircle size={12} color={colors.background} />
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, styles.completedStep, { backgroundColor: colors.primary }]}>
              <CheckCircle size={12} color={colors.background} />
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, styles.completedStep, { backgroundColor: colors.primary }]}>
              <CheckCircle size={12} color={colors.background} />
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, styles.activeStep, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumber, { color: colors.background }]}>5</Text>
            </View>
          </View>
          <View style={styles.stepLabels}>
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Kategori</Text>
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Detaylar</Text>
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Fotoğraf</Text>
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Konum</Text>
            <Text style={[styles.stepLabel, styles.activeStepLabel, { color: colors.primary }]}>Önizleme</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={[styles.title, { color: colors.text }]}>İlan Önizleme</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            İlanınızı son kez kontrol edin ve yayınlayın.
          </Text>

          {/* Category Card */}
          <View style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.categoryCardHeader}>
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>📁</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryCardTitle, { color: colors.text }]}>Seçilen Kategori</Text>
                <Text style={[styles.categoryPath, { color: colors.primary }]}>
                  {data.category || data.details?.category || 'Kategori Seçilmedi'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.categoryEditButton}
                onPress={() => handleEdit('Category')}
              >
                <Edit3 size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Listing Preview Card - Horizontal Layout */}
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.horizontalLayout}>
              {/* Left Side - Image */}
              <View style={styles.leftSection}>
                <View style={styles.imageContainer}>
                  {getMainImage() ? (
                    <Image 
                      source={{ uri: getMainImage()?.uri }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.noImageContainer, { backgroundColor: colors.border + '30' }]}>
                      <Camera size={24} color={colors.textSecondary} />
                      <Text style={[styles.noImageText, { color: colors.textSecondary }]}>
                        Fotoğraf Yok
                      </Text>
                    </View>
                  )}
                  
                  {/* Image Count Badge */}
                  {data.images?.images?.length ? (
                    <View style={[styles.imageBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                      <Text style={styles.imageBadgeText}>
                        1/{data.images.images.length}
                      </Text>
                    </View>
                  ) : null}

                  {/* Edit Image Button */}
                  <TouchableOpacity
                    style={[styles.editImageButton, { backgroundColor: colors.background }]}
                    onPress={() => handleEdit('Images')}
                  >
                    <Edit3 size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Side - Content */}
              <View style={styles.rightSection}>
                {/* Title and Edit */}
                <View style={styles.titleRow}>
                  <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
                    {data.details?.title || 'Başlık Eklenmedi'}
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit('Details')}
                  >
                    <Edit3 size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Price */}
                <Text style={[styles.price, { color: colors.primary }]}>
                  {data.details?.budget ? formatPrice(data.details.budget) : 'Fiyat Belirtilmedi'}
                </Text>

                {/* Location */}
                <View style={styles.locationRow}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {data.location?.province && data.location?.district 
                      ? `${data.location.district}, ${data.location.province}`
                      : 'Konum Belirtilmedi'
                    }
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit('Location')}
                  >
                    <Edit3 size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Urgency */}
                {data.details?.urgency && (
                  <View style={styles.urgencyRow}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={[styles.urgencyText, { color: colors.textSecondary }]}>
                      Aciliyet: {data.details.urgency}
                    </Text>
                  </View>
                )}

                {/* Condition */}
                {data.details?.condition && (
                  <Text style={[styles.conditionText, { color: colors.textSecondary }]}>Durum: {data.details.condition}</Text>
                )}

                {/* Description Preview */}
                {data.details?.description && (
                  <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                    {data.details.description}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Premium Features Section */}
          <View style={[styles.premiumSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.premiumHeader}>
              <Star size={16} color="#FFD700" />
              <Text style={[styles.premiumTitle, { color: colors.text }]}>Premium Özellikler</Text>
            </View>
            <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }]}>
              İlanınızın daha çok görülmesi için premium özellikler ekleyebilirsiniz.
            </Text>
            
            <View style={styles.premiumOptions}>
              <TouchableOpacity style={[styles.premiumOption, { borderColor: colors.border }]}>
                <View style={styles.premiumOptionContent}>
                  <Text style={[styles.premiumOptionTitle, { color: colors.text }]}>Öne Çıkar</Text>
                  <Text style={[styles.premiumOptionDesc, { color: colors.textSecondary }]}>
                    İlanınız 3 gün boyunca öne çıkarılır
                  </Text>
                </View>
                <Text style={[styles.premiumOptionPrice, { color: colors.primary }]}>₺15</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.premiumOption, { borderColor: colors.border }]}>
                <View style={styles.premiumOptionContent}>
                  <Text style={[styles.premiumOptionTitle, { color: colors.text }]}>Acil İlan</Text>
                  <Text style={[styles.premiumOptionDesc, { color: colors.textSecondary }]}>
                    İlanınız acil etiketiyle görünür
                  </Text>
                </View>
                <Text style={[styles.premiumOptionPrice, { color: colors.primary }]}>₺10</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.premiumOption, { borderColor: colors.border }]}>
                <View style={styles.premiumOptionContent}>
                  <Text style={[styles.premiumOptionTitle, { color: colors.text }]}>Vitrin</Text>
                  <Text style={[styles.premiumOptionDesc, { color: colors.textSecondary }]}>
                    Ana sayfada vitrin alanında gösterilir
                  </Text>
                </View>
                <Text style={[styles.premiumOptionPrice, { color: colors.primary }]}>₺25</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Publication Settings */}
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingsHeader}>
              <Clock size={16} color={colors.primary} />
              <Text style={[styles.settingsTitle, { color: colors.text }]}>Yayın Ayarları</Text>
            </View>
            
            {/* Duration */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Yayın Süresi</Text>
              <TouchableOpacity 
                style={[styles.settingValue, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDurationPicker(!showDurationPicker)}
              >
                <Text style={[styles.settingValueText, { color: colors.text }]}>
                  {durationOptions.find(option => option.value === selectedDuration)?.label || '30 Gün'}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {/* Duration Picker */}
              {showDurationPicker && (
                <View style={[styles.durationPicker, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.durationOption,
                        selectedDuration === option.value && { backgroundColor: colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setSelectedDuration(option.value);
                        setShowDurationPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        { color: selectedDuration === option.value ? colors.primary : colors.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Contact Preference */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>İletişim Tercihi</Text>
              <TouchableOpacity 
                style={[styles.settingValue, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowContactPicker(!showContactPicker)}
              >
                <Text style={[styles.settingValueText, { color: colors.text }]}>
                  {contactOptions.find(option => option.value === selectedContactPreference)?.label || 'Sadece Site Üzerinden Mesaj'}
                </Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {/* Contact Picker */}
              {showContactPicker && (
                <View style={[styles.contactPicker, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {contactOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.contactOption,
                        selectedContactPreference === option.value && { backgroundColor: colors.primary + '15' }
                      ]}
                      onPress={() => {
                        setSelectedContactPreference(option.value);
                        setShowContactPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.contactOptionText,
                        { color: selectedContactPreference === option.value ? colors.primary : colors.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Auto Republish */}
            <View style={styles.settingItem}>
              <View style={styles.toggleRow}>
                <View style={styles.refreshIcon}>
                  <RefreshCw size={16} color={colors.primary} />
                </View>
                <Text style={[styles.toggleText, { color: colors.text }]}>
                  Süre bitince ilanı otomatik olarak yeniden yayınla
                </Text>
                <TouchableOpacity 
                  style={[styles.toggle, { backgroundColor: autoRepublish ? colors.primary : colors.border }]}
                  onPress={() => setAutoRepublish(!autoRepublish)}
                >
                  <View style={[
                    styles.toggleHandle, 
                    { 
                      backgroundColor: colors.background,
                      alignSelf: autoRepublish ? 'flex-end' : 'flex-start'
                    }
                  ]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={[styles.termsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.termsHeader}>
              <FileText size={16} color={colors.primary} />
              <Text style={[styles.termsTitle, { color: colors.text }]}>Kurallar ve Onay</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.termsCheckbox}
              onPress={handleTermsAccept}
            >
              <View style={[
                styles.checkbox, 
                { 
                  backgroundColor: termsAccepted ? colors.primary : 'transparent', 
                  borderColor: termsAccepted ? colors.primary : colors.border 
                }
              ]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.termsCheckboxText, { color: colors.text }]}>
                İlan verme kurallarını okudum ve kabul ediyorum.
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.termsLink}>
              <Text style={[styles.termsLinkText, { color: colors.primary }]}>
                Kuralları Görüntüle
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Butonlar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity 
          style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', marginRight: 8, flexDirection: 'row', justifyContent: 'center' }} 
          onPress={() => navigation.goBack()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', marginLeft: 4 }}>Geri</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            padding: 14, 
            borderRadius: 8, 
            backgroundColor: (!termsAccepted || isPublishing) ? colors.border : colors.primary, 
            alignItems: 'center', 
            marginLeft: 8, 
            flexDirection: 'row', 
            justifyContent: 'center',
            opacity: (!termsAccepted || isPublishing) ? 0.5 : 1
          }} 
          onPress={handlePublish}
          disabled={!termsAccepted || isPublishing}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {isPublishing ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStep: {
    // Completed step styling
  },
  activeStep: {
    // Active step styling
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
  },
  activeStepLabel: {
    fontWeight: '600',
  },
  mainContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  horizontalLayout: {
    flexDirection: 'row',
    minHeight: 180,
  },
  leftSection: {
    width: '40%',
  },
  rightSection: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    marginTop: 4,
    fontSize: 12,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  imageBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  editImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyText: {
    fontSize: 12,
    marginLeft: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  premiumSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  premiumOptions: {
    gap: 8,
  },
  premiumOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  premiumOptionContent: {
    flex: 1,
  },
  premiumOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  premiumOptionDesc: {
    fontSize: 12,
  },
  premiumOptionPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingsSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingValueText: {
    fontSize: 14,
  },
  durationPicker: {
    position: 'absolute',
    top: 40,
    right: 0,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 1000,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  durationOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactPicker: {
    position: 'absolute',
    top: 40,
    right: 0,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 1000,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  contactOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  contactOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryPath: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryEditButton: {
    padding: 8,
    borderRadius: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIcon: {
    marginRight: 8,
  },
  toggleText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  termsSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsCheckboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    alignSelf: 'flex-start',
  },
  termsLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  publishButton: {
    flex: 1,
  },
  conditionText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default CreateListingConfirmScreen; 