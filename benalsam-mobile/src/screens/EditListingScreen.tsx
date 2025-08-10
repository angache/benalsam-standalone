import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity,
  TextInput,
  Image,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  Tag, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Star,
  Camera,
  Image as ImageIcon,
  Search
} from 'lucide-react-native';
import { useThemeColors } from '../stores';
import { fetchSingleListing } from '../services/listingService/fetchers';
import { updateListing } from '../services/listingService/mutations';
import { useAuthStore } from '../stores';
import { 
  Header, 
  Button, 
  LoadingSpinner, 
  Card
} from '../components';
import { categoriesConfig } from '../config/categories-with-attributes';

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Düşük', color: '#10b981', description: 'Acele etmiyorum' },
  { value: 'medium', label: 'Normal', color: '#f59e0b', description: 'Yakın zamanda' },
  { value: 'high', label: 'Yüksek', color: '#ef4444', description: 'Acil ihtiyacım var' },
];

const MAX_IMAGES = 10;

type ImageItem = {
  uri: string;
  name: string;
  isUploaded?: boolean;
  isStockImage?: boolean;
  uniqueId?: string;
  file?: { uri: string; name: string; type: string };
};

const EditListingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const listingId = route.params?.listingId;

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    budget: '',
    location: '',
    urgency: 'medium',
    category: '',
    images: [],
    mainImageIndex: 0,
  });
  const [originalData, setOriginalData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      if (!user?.id || !listingId) return;
      
      setLoading(true);
      try {
        const listing = await fetchSingleListing(listingId, user.id);
        
        if (listing) {
          // Convert listing images from database format to form format
          const images: ImageItem[] = [];
          let mainImageIndex = 0;

          // Add main image if exists
          if (listing.main_image_url) {
            images.push({
              uri: listing.main_image_url,
              name: 'main_image.jpg',
              isUploaded: true,
            });
          }

          // Add additional images if exist
          if (listing.additional_image_urls && Array.isArray(listing.additional_image_urls)) {
            listing.additional_image_urls.forEach((url: string, index: number) => {
              images.push({
                uri: url,
                name: `additional_image_${index + 1}.jpg`,
                isUploaded: true,
              });
            });
          }

          const data = {
            title: listing.title || '',
            description: listing.description || '',
            budget: listing.budget?.toString() || '',
            location: listing.location || '',
            urgency: listing.urgency || 'medium',
            category: listing.category || '',
            images: images,
            mainImageIndex: mainImageIndex,
          };
          setFormData(data);
          setOriginalData(data);
        } else {
          Alert.alert('Hata', 'İlan bulunamadı.', [
            { text: 'Tamam', onPress: () => navigation.goBack() }
          ]);
        }
      } catch (error) {
        console.error('Error loading listing:', error);
        Alert.alert('Hata', 'İlan yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (user && listingId) {
      loadListing();
    }
  }, [user, listingId]);

  // Check for unsaved changes
  useEffect(() => {
    // Skip change detection if data is not loaded yet
    if (!formData || !originalData) return;

    // More reliable change detection
    const hasBasicChanges = (
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      formData.budget !== originalData.budget ||
      formData.location !== originalData.location ||
      formData.urgency !== originalData.urgency ||
      formData.category !== originalData.category ||
      formData.mainImageIndex !== originalData.mainImageIndex
    );

    // Check images array changes - with null safety
    const formImages = formData.images || [];
    const originalImages = originalData.images || [];
    
    const hasImageChanges = (
      formImages.length !== originalImages.length ||
      formImages.some((img: ImageItem, index: number) => 
        !originalImages[index] || img.uri !== originalImages[index].uri
      )
    );

    const hasChanges = hasBasicChanges || hasImageChanges;
    
    console.log('🔍 Change detection:', {
      hasBasicChanges,
      hasImageChanges,
      hasChanges,
      formData: {
        title: formData.title,
        imagesLength: formImages.length,
        mainImageIndex: formData.mainImageIndex
      },
      originalData: {
        title: originalData.title,
        imagesLength: originalImages.length,
        mainImageIndex: originalData.mainImageIndex
      }
    });
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  // Handle back navigation with unsaved changes warning
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
        if (!hasUnsavedChanges) {
          return;
        }

        e.preventDefault();

        Alert.alert(
          'Kaydedilmemiş Değişiklikler',
          'Değişiklikleriniz kaybolacak. Çıkmak istediğinizden emin misiniz?',
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Çık',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action),
            },
          ]
        );
      });

      return unsubscribe;
    }, [navigation, hasUnsavedChanges])
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  // Image management functions
  const pickImage = async () => {
    const currentImages = formData.images || [];
    if (currentImages.length >= MAX_IMAGES) {
      Alert.alert('Limit Aşıldı', `En fazla ${MAX_IMAGES} fotoğraf ekleyebilirsiniz.`);
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
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      const newImage: ImageItem = {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        isUploaded: false,
        file: {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg'
        }
      };

      const newImages = [...currentImages, newImage];
      handleInputChange('images', newImages);
      
      // İlk görseli ana görsel yap
      if (newImages.length === 1) {
        handleInputChange('mainImageIndex', 0);
      }
    }
  };

  const removeImage = (index: number) => {
    const currentImages = formData.images || [];
    const newImages = currentImages.filter((_: any, i: number) => i !== index);
    let newMainImageIndex = formData.mainImageIndex || 0;

    if (index === formData.mainImageIndex) {
      newMainImageIndex = newImages.length > 0 ? 0 : -1;
    } else if (index < formData.mainImageIndex) {
      newMainImageIndex -= 1;
    }

    handleInputChange('images', newImages);
    handleInputChange('mainImageIndex', newMainImageIndex);
  };

  const setMainImage = (index: number) => {
    handleInputChange('mainImageIndex', index);
  };

  const handleStockImage = () => {
    // İlan başlığı ve kategorisini default query olarak kullan
    const title = formData.title || '';
    const category = formData.category || '';
    const initialQuery = title || category || '';
    
    navigation.navigate('StockImageSearch', {
      initialQuery: initialQuery,
      sourceScreen: 'editListing'
    });
  };

  // Stock image handling
  useFocusEffect(
    useCallback(() => {
      if (route.params?.stockImages) {
        const currentImages = formData.images || [];
        const availableSlots = MAX_IMAGES - currentImages.length;
        if (availableSlots <= 0) return;

        const existingUris = new Set(currentImages.map((img: ImageItem) => img.uri));
        const stockImages = route.params.stockImages as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newStockImages = stockImages
          .slice(0, availableSlots)
          .map((img: any) => {
            const imageUri = img.urls?.small || img.url || img.uri;
            return {
              uri: imageUri,
              name: img.id || `stock_${Date.now()}`,
              uniqueId: `stock_${img.id || Date.now()}_${Math.random()}`,
              isUploaded: true,
              isStockImage: true,
              file: {
                uri: imageUri,
                name: `stock_${img.id || Date.now()}.jpg`,
                type: 'image/jpeg',
              },
            };
          })
          .filter((img: ImageItem) => !existingUris.has(img.uri));

        if (newStockImages.length > 0) {
          const newImgs = [...currentImages, ...newStockImages];
          handleInputChange('images', newImgs);
          
          // İlk görsel ise ana görsel yap
          if (currentImages.length === 0 && newImgs.length > 0) {
            handleInputChange('mainImageIndex', 0);
          }
        }
        
        navigation.setParams({ stockImages: undefined });
      }
    }, [route.params, formData.images, navigation])
  );

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Başlık gereklidir';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Başlık en az 10 karakter olmalıdır';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Açıklama gereklidir';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Açıklama en az 20 karakter olmalıdır';
    }

    if (!formData.budget || isNaN(Number(formData.budget))) {
      newErrors.budget = 'Geçerli bir bütçe giriniz';
    } else if (Number(formData.budget) <= 0) {
      newErrors.budget = 'Bütçe 0\'dan büyük olmalıdır';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori seçimi gereklidir';
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Konum gereklidir';
    }

    const currentImages = formData.images || [];
    if (currentImages.length === 0) {
      newErrors.images = 'En az bir görsel eklemelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru şekilde doldurun.');
      return;
    }

    if (!user?.id || !listingId) {
      Alert.alert('Hata', 'Kullanıcı veya ilan bilgisi bulunamadı.');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: parseFloat(formData.budget),
        location: formData.location,
        urgency: formData.urgency,
      };

      let mainImageUrl = formData.images[formData.mainImageIndex]?.uri;
      let additionalImageUrls = formData.images.filter(img => img.isUploaded).map(img => img.uri);

      const hasImageChanges = formData.images.some(img => !img.isUploaded) || formData.mainImageIndex !== originalData.mainImageIndex;

      if (hasImageChanges) {
        const imageResults = await processImages(formData.images, formData.mainImageIndex);
        if (!imageResults) {
          throw new Error('Image processing failed');
        }
        mainImageUrl = imageResults.mainImageUrl;
        additionalImageUrls = imageResults.additionalImageUrls;
      }

      const updated = await updateListing(listingId, {
        ...updateData,
        main_image_url: mainImageUrl,
        additional_image_urls: additionalImageUrls,
      }, user.id);

      if (updated.data) {
        navigation.goBack();
      } else {
        throw new Error('No data returned from update');
      }
    } catch (error) {
      Alert.alert('Hata', 'İlan güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const selectCategory = () => {
    const categoryNames = categoriesConfig.map(cat => cat.name);
    
    Alert.alert(
      'Kategori Seçin',
      'Bir kategori seçiniz:',
      [
        ...categoryNames.map(name => ({
          text: name,
          onPress: () => handleInputChange('category', name)
        })),
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const selectUrgency = () => {
    Alert.alert(
      'Aciliyet Seçin',
      'Aciliyet seviyenizi seçiniz:',
      [
        ...URGENCY_OPTIONS.map(option => ({
          text: `${option.label} - ${option.description}`,
          onPress: () => handleInputChange('urgency', option.value)
        })),
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const getSelectedUrgency = () => {
    return URGENCY_OPTIONS.find(option => option.value === formData.urgency) || URGENCY_OPTIONS[1];
  };

  const renderImageItem = ({ item, index }: { item: ImageItem; index: number }) => {
    const isMainImage = index === formData.mainImageIndex;
    
    return (
      <View style={[styles.imageContainer, { borderColor: isMainImage ? colors.primary : colors.border }]}>
        <Image source={{ uri: item.uri }} style={styles.image} />
        
        {/* Remove button */}
        <TouchableOpacity
          style={[styles.imageButton, styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => removeImage(index)}
        >
          <X size={12} color={colors.background} />
        </TouchableOpacity>

        {/* Main image button */}
        <TouchableOpacity
          style={[
            styles.imageButton, 
            styles.mainButton, 
            { backgroundColor: isMainImage ? colors.primary : colors.surface }
          ]}
          onPress={() => setMainImage(index)}
        >
          <Star 
            size={12} 
            color={isMainImage ? colors.background : colors.text} 
            fill={isMainImage ? colors.background : 'transparent'}
          />
        </TouchableOpacity>

        {/* Main label */}
        {isMainImage && (
          <View style={[styles.mainImageBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.mainImageBadgeText, { color: colors.background }]}>Ana</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            İlan yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Giriş yapmanız gerekiyor.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedUrgency = getSelectedUrgency();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>İlan Düzenle</Text>
        <TouchableOpacity
          style={[
            styles.saveHeaderButton, 
            { backgroundColor: hasUnsavedChanges ? colors.primary : colors.surface }
          ]}
          onPress={handleSave}
          disabled={saving || !hasUnsavedChanges}
        >
          {saving ? (
            <LoadingSpinner />
          ) : (
            <Save size={20} color={hasUnsavedChanges ? colors.background : colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Fields */}
        <Card style={[styles.formCard, { backgroundColor: colors.surface }] as any}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>İlan Başlığı *</Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  backgroundColor: colors.background, 
                  color: colors.text, 
                  borderColor: errors.title ? colors.error : colors.border 
                }
              ]}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="İhtiyacınız olan ürün/hizmeti kısaca açıklayın"
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
            {errors.title && <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Açıklama *</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.textArea, 
                { 
                  backgroundColor: colors.background, 
                  color: colors.text, 
                  borderColor: errors.description ? colors.error : colors.border 
                }
              ]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="İhtiyacınızı detaylı bir şekilde açıklayın"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {errors.description && <Text style={[styles.errorText, { color: colors.error }]}>{errors.description}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Bütçe (₺) *</Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  backgroundColor: colors.background, 
                  color: colors.text, 
                  borderColor: errors.budget ? colors.error : colors.border 
                }
              ]}
              value={formData.budget}
              onChangeText={(value) => handleInputChange('budget', value)}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            {errors.budget && <Text style={[styles.errorText, { color: colors.error }]}>{errors.budget}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Konum *</Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  backgroundColor: colors.background, 
                  color: colors.text, 
                  borderColor: errors.location ? colors.error : colors.border 
                }
              ]}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="İl/İlçe"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.location && <Text style={[styles.errorText, { color: colors.error }]}>{errors.location}</Text>}
          </View>
        </Card>

        {/* Category & Urgency Selection */}
        <Card style={[styles.formCard, { backgroundColor: colors.surface }] as any}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kategori & Aciliyet</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Kategori *</Text>
            <TouchableOpacity
              style={[
                styles.selectorButton, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: errors.category ? colors.error : colors.border 
                }
              ]}
              onPress={selectCategory}
            >
              <View style={styles.selectorLeft}>
                <Tag size={20} color={colors.primary} />
                <Text style={[
                  styles.selectorValue, 
                  { color: formData.category ? colors.text : colors.textSecondary }
                ]}>
                  {formData.category || 'Kategori seçin'}
                </Text>
              </View>
            </TouchableOpacity>
            {errors.category && <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Aciliyet</Text>
            <TouchableOpacity
              style={[
                styles.selectorButton, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border 
                }
              ]}
              onPress={selectUrgency}
            >
              <View style={styles.selectorLeft}>
                <Clock size={20} color={selectedUrgency.color} />
                <Text style={[styles.selectorValue, { color: selectedUrgency.color }]}>
                  {selectedUrgency.label} - {selectedUrgency.description}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Images Section */}
        <Card style={[styles.formCard, { backgroundColor: colors.surface }] as any}>
          <View style={styles.imagesSectionHeader}>
            <View style={styles.imagesTitleContainer}>
              <ImageIcon size={20} color={colors.text} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8, marginBottom: 0 }]}>
                İlan Görselleri *
              </Text>
            </View>
            <Text style={[styles.imagesCounter, { color: colors.textSecondary }]}>
              {(formData.images || []).length} / {MAX_IMAGES}
            </Text>
          </View>

          {(formData.images || []).length > 0 ? (
            <FlatList
              data={formData.images || []}
              renderItem={renderImageItem}
              numColumns={3}
              keyExtractor={(item, index) => `${item.uri}_${index}`}
              contentContainerStyle={styles.imageGrid}
              scrollEnabled={false}
            />
          ) : (
            <View style={[styles.emptyImageContainer, { borderColor: colors.border }]}>
              <Camera size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyImageText, { color: colors.textSecondary }]}>
                Henüz görsel eklenmedi
              </Text>
            </View>
          )}

          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.addImageButton,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                  opacity: (formData.images || []).length >= MAX_IMAGES ? 0.5 : 1,
                  flex: 1,
                  marginRight: 8
                }
              ]}
              onPress={pickImage}
              disabled={(formData.images || []).length >= MAX_IMAGES}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={[styles.addImageText, { color: colors.primary }]}>
                Galeri
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addImageButton,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.secondary,
                  opacity: (formData.images || []).length >= MAX_IMAGES ? 0.5 : 1,
                  flex: 1,
                  marginLeft: 8
                }
              ]}
              onPress={handleStockImage}
              disabled={(formData.images || []).length >= MAX_IMAGES}
            >
              <Search size={20} color={colors.secondary} />
              <Text style={[styles.addImageText, { color: colors.secondary }]}>
                Stok Görsel
              </Text>
            </TouchableOpacity>
          </View>

          {errors.images && <Text style={[styles.errorText, { color: colors.error }]}>{errors.images}</Text>}
          
          <Text style={[styles.imageHelpText, { color: colors.textSecondary }]}>
            Ana görseli ★ ile işaretleyebilirsiniz. Ana görsel ilanınızın ön yüzünde görünür.
          </Text>
        </Card>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: hasUnsavedChanges ? colors.primary : colors.surface,
                opacity: hasUnsavedChanges ? 1 : 0.6,
              }
            ]}
            onPress={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? (
              <LoadingSpinner />
            ) : (
              <>
                <Save size={20} color={hasUnsavedChanges ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.saveButtonText,
                  { color: hasUnsavedChanges ? colors.background : colors.textSecondary }
                ]}>
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {hasUnsavedChanges && (
            <View style={styles.unsavedContainer}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.unsavedText, { color: colors.textSecondary }]}>
                Kaydedilmemiş değişiklikleriniz var
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: { padding: 8 },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 16, 
    flex: 1 
  },
  saveHeaderButton: { 
    padding: 12, 
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  formCard: { 
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  inputContainer: { marginBottom: 16 },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  textInput: { 
    padding: 12, 
    borderWidth: 1, 
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: { 
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: { 
    fontSize: 12, 
    marginTop: 4 
  },
  selectorButton: { 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 16 
  },
  selectorLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12,
  },
  selectorValue: { 
    fontSize: 16 
  },
  
  // Images Section
  imagesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagesCounter: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageGrid: {
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    top: 4,
    right: 4,
  },
  mainButton: {
    top: 4,
    left: 4,
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainImageBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyImageContainer: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyImageText: {
    fontSize: 14,
    marginTop: 8,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageHelpText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  
  // Button Section
  buttonContainer: { 
    marginTop: 24 
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unsavedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  unsavedText: { 
    fontSize: 12, 
    fontWeight: '500' 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
});

export default EditListingScreen; 