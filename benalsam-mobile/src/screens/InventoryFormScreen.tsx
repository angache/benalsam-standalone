import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { Button, Card } from '../components';
import { Camera } from 'lucide-react-native';
import { SearchableCategorySelector } from '../components/SearchableCategorySelector';
import { addInventoryItem, updateInventoryItem, getInventoryItemById } from '../services/inventoryService';
// Statik kategori sistemi deprecated - artık dinamik sistem kullanılıyor

const MAX_IMAGES_INVENTORY = 3;

interface ImageItem {
  uri: string;
  name: string;
  isUploaded: boolean;
  url?: string;
}

interface FormData {
  id?: string;
  name: string;
  description: string;
  images: ImageItem[];
  mainImageIndex: number;
}

interface FormErrors {
  name?: string;
  category?: string;
  images?: string;
  [key: string]: string | undefined;
}

const InventoryFormScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const itemId = route.params?.itemId;

  const isEditMode = !!itemId;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    images: [],
    mainImageIndex: -1,
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  useEffect(() => {
    if (isEditMode && user) {
      loadItemData();
    }
  }, [isEditMode, user, itemId]);

  const loadItemData = async () => {
    if (!itemId || !user) return;

    try {
      setLoading(true);
      const item = await getInventoryItemById(itemId);
      
      if (!item || item.user_id !== user.id) {
        Alert.alert('Hata', 'Ürün bulunamadı veya size ait değil.');
        navigation.goBack();
        return;
      }

      const initialImages: ImageItem[] = [];
      if (item.main_image_url) {
        initialImages.push({ 
          uri: item.main_image_url, 
          name: 'main_image.jpg', 
          isUploaded: true, 
          url: item.main_image_url 
        });
      }
      (item.additional_image_urls || []).forEach((url: string, index: number) => {
        initialImages.push({ 
          uri: url, 
          name: `additional_image_${index}.jpg`, 
          isUploaded: true, 
          url: url 
        });
      });

      const categoryPath = item.category?.split(' > ') || [];
      setSelectedMainCategory(categoryPath[0] || '');
      setSelectedSubCategory(categoryPath[1] || '');
      setSelectedSubSubCategory(categoryPath[2] || '');

      setFormData({
        id: item.id,
        name: item.name,
        description: item.description || '',
        images: initialImages,
        mainImageIndex: initialImages.length > 0 ? initialImages.findIndex(img => img.url === item.main_image_url) : -1,
      });
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert('Hata', 'Ürün bilgileri yüklenirken bir hata oluştu.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const pickImage = async () => {
    if (formData.images.length >= MAX_IMAGES_INVENTORY) {
      Alert.alert('Görsel Limiti', `En fazla ${MAX_IMAGES_INVENTORY} görsel yükleyebilirsiniz.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişim izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImage: ImageItem = {
        uri: result.assets[0].uri,
        name: `image_${Date.now()}.jpg`,
        isUploaded: false,
      };

      const newImages = [...formData.images, newImage];
      setFormData(prev => ({
        ...prev,
        images: newImages,
        mainImageIndex: prev.mainImageIndex === -1 ? 0 : prev.mainImageIndex,
      }));
    }
  };

  const takePhoto = async () => {
    if (formData.images.length >= MAX_IMAGES_INVENTORY) {
      Alert.alert('Görsel Limiti', `En fazla ${MAX_IMAGES_INVENTORY} görsel yükleyebilirsiniz.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImage: ImageItem = {
        uri: result.assets[0].uri,
        name: `photo_${Date.now()}.jpg`,
        isUploaded: false,
      };
      const newImages = [...formData.images, newImage];
      setFormData(prev => ({
        ...prev,
        images: newImages,
        mainImageIndex: prev.mainImageIndex === -1 ? 0 : prev.mainImageIndex,
      }));
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    let newMainImageIndex = formData.mainImageIndex;

    if (index === formData.mainImageIndex) {
      newMainImageIndex = newImages.length > 0 ? 0 : -1;
    } else if (index < formData.mainImageIndex) {
      newMainImageIndex -= 1;
    }

    setFormData(prev => ({
      ...prev,
      images: newImages,
      mainImageIndex: newMainImageIndex,
    }));
  };

  const setMainImage = (index: number) => {
    setFormData(prev => ({ ...prev, mainImageIndex: index }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ürün adı gerekli';
    }

    // Basit kategori validasyonu - dinamik sistem için
    if (!selectedMainCategory) {
      newErrors.category = 'Ana kategori seçimi gerekli';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'En az bir görsel yüklemelisiniz';
    } else if (formData.mainImageIndex === -1 && formData.images.length > 0) {
      setFormData(prev => ({ ...prev, mainImageIndex: 0 }));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('🔍 [InventoryForm] Submit attempt...');
    console.log('🔍 [InventoryForm] User from store:', user);
    console.log('🔍 [InventoryForm] Is submitting:', isSubmitting);
    console.log('🔍 [InventoryForm] Form valid:', validateForm());
    
    if (isSubmitting || !validateForm() || !user) {
      console.log('❌ [InventoryForm] Submit blocked - reasons:');
      console.log('  - Is submitting:', isSubmitting);
      console.log('  - Form valid:', validateForm());
      console.log('  - User exists:', !!user);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Kategori path'ini oluştur
      const categoryPath = [selectedMainCategory, selectedSubCategory, selectedSubSubCategory]
        .filter(Boolean)
        .join(' > ');
      
      const submitData = {
        ...formData,
        category: categoryPath,
      };

      let result;
      if (isEditMode) {
        result = await updateInventoryItem(submitData, user.id, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        result = await addInventoryItem(submitData, user.id, (progress) => {
          setUploadProgress(progress);
        });
      }

      if (result) {
        Alert.alert(
          'Başarılı',
          isEditMode ? 'Ürün başarıyla güncellendi!' : 'Ürün başarıyla eklendi!',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Session expired error'ını kontrol et
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        Alert.alert(
          'Oturum Süresi Doldu',
          'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Giriş Yap',
              onPress: () => {
                // AuthStore'u temizle
                useAuthStore.getState().reset();
                // Login sayfasına yönlendir
                navigation.navigate('Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleEditItem = (item: any) => {
    navigation.navigate('InventoryForm', { itemId: item.id });
  };

  const handleCategorySelect = (mainCategory: string, subCategory?: string, subSubCategory?: string) => {
    setSelectedMainCategory(mainCategory);
    setSelectedSubCategory(subCategory || '');
    setSelectedSubSubCategory(subSubCategory || '');
    setShowCategorySelector(false);
    
    // Clear category error if exists
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const renderCategorySelector = () => {
    const getCategoryDisplayText = () => {
      if (!selectedMainCategory) return 'Kategori seçin';
      let displayText = selectedMainCategory;
      if (selectedSubCategory) displayText += ` > ${selectedSubCategory}`;
      if (selectedSubSubCategory) displayText += ` > ${selectedSubSubCategory}`;
      return displayText;
    };

    return (
      <View style={styles.categorySection}>
        <Text style={[styles.label, { color: colors.text }]}>Kategori Seçimi *</Text>
        
        <TouchableOpacity
          style={[
            styles.categorySelector,
            { 
              backgroundColor: selectedMainCategory ? colors.primary + '10' : colors.surface,
              borderColor: errors.category ? colors.error : selectedMainCategory ? colors.primary : colors.border,
              borderWidth: selectedMainCategory ? 2 : 1,
            }
          ]}
          onPress={() => setShowCategorySelector(true)}
        >
          <Text style={[
            styles.categorySelectorText,
            { 
              color: selectedMainCategory ? colors.primary : colors.textSecondary,
              fontWeight: selectedMainCategory ? '600' : '400'
            }
          ]}>
            {getCategoryDisplayText()}
          </Text>
          <LinearGradient
            colors={selectedMainCategory ? ['#3B82F6', '#8B5CF6'] : [colors.textSecondary, colors.textSecondary]}
            style={styles.categorySelectorArrowContainer}
          >
            <Text style={[styles.categorySelectorArrow, { color: selectedMainCategory ? colors.white : colors.textSecondary }]}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {errors.category && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>
        )}
      </View>
    );
  };

  const renderImageUploader = () => (
    <View style={styles.imageSection}>
      <Text style={[styles.label, { color: colors.text }]}>
        Ürün Görselleri (En az 1, En fazla {MAX_IMAGES_INVENTORY}) *
      </Text>
      
      <View style={styles.imageGrid}>
        {formData.images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            
            <View style={styles.imageOverlay}>
              <TouchableOpacity
                style={[styles.imageButton, { backgroundColor: colors.error }]}
                onPress={() => removeImage(index)}
              >
                <Text style={[styles.imageButtonText, { color: colors.background }]}>✕</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.imageButton,
                  { backgroundColor: formData.mainImageIndex === index ? colors.primary : colors.surface }
                ]}
                onPress={() => setMainImage(index)}
              >
                <Text style={[
                  styles.imageButtonText,
                  { color: formData.mainImageIndex === index ? colors.background : colors.text }
                ]}>
                  {formData.mainImageIndex === index ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>

            {formData.mainImageIndex === index && (
              <View style={[styles.mainImageBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.mainImageBadgeText, { color: colors.background }]}>Ana</Text>
              </View>
            )}
          </View>
        ))}

        {formData.images.length < MAX_IMAGES_INVENTORY && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addImageButton, { borderColor: colors.border }]}
              onPress={pickImage}
              disabled={isSubmitting}
            >
              <Text style={[styles.addImageText, { color: colors.primary }]}>+</Text>
              <Text style={[styles.addImageLabel, { color: colors.textSecondary }]}>Galeriden Seç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addImageButton, { borderColor: colors.border }]}
              onPress={takePhoto}
              disabled={isSubmitting}
            >
              <Camera size={24} color={colors.primary} style={{ marginBottom: 4 }} />
              <Text style={[styles.addImageLabel, { color: colors.textSecondary }]}>Kamera ile Çek</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {errors.images && (
        <Text style={[styles.errorText, { color: colors.error }]}>{errors.images}</Text>
      )}

      <Text style={[styles.imageHelpText, { color: colors.textSecondary }]}>
        {formData.images.length} / {MAX_IMAGES_INVENTORY} görsel yüklendi. Ana görseli ★ ile işaretleyebilirsiniz.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {isEditMode ? 'Ürün bilgileri yükleniyor...' : 'Form hazırlanıyor...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <Card style={styles.formCard}>
          {/* Ürün Adı */}
          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Ürün Adı *</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: errors.name ? colors.error : colors.border
                }
              ]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Örn: Eski Laptop"
              placeholderTextColor={colors.textSecondary}
              editable={!isSubmitting}
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>
            )}
          </View>

          {/* Kategori Seçimi */}
          {renderCategorySelector()}

          {/* Açıklama */}
          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Açıklama</Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Ürün hakkında kısa bilgi"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          {/* Görsel Yükleme */}
          {renderImageUploader()}

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${uploadProgress}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Görseller yükleniyor: {uploadProgress}%
              </Text>
            </View>
          )}

          {/* Form Actions */}
          <View style={styles.actions}>
            <Button
              title="İptal"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
            <Button
              title={isSubmitting ? 'Kaydediliyor...' : (isEditMode ? 'Kaydet' : 'Ekle')}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </Card>
      </ScrollView>
      
      <SearchableCategorySelector
        visible={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
        selectedMainCategory={selectedMainCategory}
        selectedSubCategory={selectedSubCategory}
        selectedSubSubCategory={selectedSubSubCategory}
        title="Kategori Seçin"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  formCard: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  imageButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainImageBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainImageBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addImageLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  imageHelpText: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 48,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categorySelectorText: {
    fontSize: 16,
    flex: 1,
  },
  categorySelectorArrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  categorySelectorArrowContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InventoryFormScreen; 