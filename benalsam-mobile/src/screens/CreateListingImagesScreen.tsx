import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList, Dimensions, Alert, Image } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react-native';
import { useThemeColors } from '../stores';
import { useCreateListingContext } from '../contexts/CreateListingContext';
import * as ImagePicker from 'expo-image-picker';
import { useCreateListingStore } from '../stores';

const { width } = Dimensions.get('window');
const imageSize = (width - 64) / 4; // 4 columns with margins

type ListingImage = {
  uri: string;
  name: string;
  uniqueId?: string;
  isUploaded?: boolean;
  url?: string;
  urls?: { small?: string; regular?: string };
  isStockImage?: boolean;
  file?: { uri: string; name: string; type: string };
};

const CreateListingImagesScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { data, setStepData } = useCreateListingStore();
  
  // Store data loaded
  
  const maxImages = 10;
  const [images, setImages] = useState<ListingImage[]>(data.images?.images || []);
  const [mainImageIndex, setMainImageIndex] = useState(data.images?.mainImageIndex || 0);

  const steps = [
    { label: 'Kategori' },
    { label: 'Detaylar' },
    { label: 'Fotoğraflar' },
    { label: 'Konum' },
    { label: 'Önizleme' }
  ];

  const updateImages = (imgs: ListingImage[], mainIdx: number) => {
    setImages(imgs);
    setMainImageIndex(mainIdx);
    setStepData('images', { images: imgs, mainImageIndex: mainIdx });
  };

  const handleRemoveImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    let newMainIdx = mainImageIndex;
    if (idx === mainImageIndex) {
      newMainIdx = 0;
    } else if (idx < mainImageIndex) {
      newMainIdx = mainImageIndex - 1;
    }
    updateImages(newImages, newMainIdx);
  };

  const handleSetMainImage = (idx: number) => {
    updateImages(images, idx);
  };

  const handleNext = () => {
    if (images.length === 0) {
      Alert.alert('Uyarı', 'En az bir fotoğraf eklemelisiniz.');
      return;
    }
    navigation.navigate('CreateListingLocation');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStockImage = () => {
    // İlan başlığı ve kategorisini default query olarak kullan
    const title = data.details?.title || '';
    const category = data.category || '';
    const initialQuery = title || category || '';
    
    navigation.navigate('StockImageSearch', {
      initialQuery: initialQuery
    });
  };

  // Stock image handling
  useFocusEffect(
    useCallback(() => {
      if (route.params?.stockImages) {
        const availableSlots = maxImages - images.length;
        if (availableSlots <= 0) return;

        const existingUris = new Set(images.map(img => img.uri));
        const newStockImages = route.params.stockImages
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
          .filter((img: ListingImage) => !existingUris.has(img.uri));

        if (newStockImages.length > 0) {
          const newImgs = [...images, ...newStockImages];
          updateImages(newImgs, mainImageIndex);
        }
        
        navigation.setParams({ stockImages: undefined });
      }
    }, [route.params, images, mainImageIndex])
  );

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Aşıldı', `En fazla ${maxImages} fotoğraf ekleyebilirsiniz.`);
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
      
      const newImage: ListingImage = {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        isUploaded: false,
        file: {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg'
        }
      };

      const newImages = [...images, newImage];
      updateImages(newImages, newImages.length === 1 ? 0 : mainImageIndex);
    }
  };

  const renderImageItem = ({ item, index }: { item: ListingImage; index: number }) => {
    return (
      <View style={{
        width: imageSize,
        height: imageSize,
        margin: 4,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Image 
          source={{ uri: item.uri }} 
          style={{ width: '100%', height: '100%' }} 
        />
        
        {/* Remove button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPress={() => handleRemoveImage(index)}
        >
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text }}>✕</Text>
        </TouchableOpacity>

        {/* Main image button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: mainImageIndex === index ? colors.primary : colors.surface,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPress={() => handleSetMainImage(index)}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: mainImageIndex === index ? '#fff' : colors.text
          }}>
            {mainImageIndex === index ? '★' : '☆'}
          </Text>
        </TouchableOpacity>

        {/* Main label */}
        {mainImageIndex === index && (
          <View style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: colors.primary
          }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>Ana</Text>
          </View>
        )}
      </View>
    );
  };

  const categoryPath = Array.isArray(data.category) ? data.category : [data.category].filter(Boolean);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Progress Steps */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          {steps.map((step, idx) => (
            <View key={step.label} style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: idx === 2 ? colors.primary : colors.surface,
                borderWidth: 2,
                borderColor: idx === 2 ? colors.primary : colors.border
              }}>
                <Text style={{
                  color: idx === 2 ? '#fff' : colors.textSecondary,
                  fontWeight: 'bold'
                }}>
                  {idx + 1}
                </Text>
              </View>
              <Text style={{
                color: idx === 2 ? colors.primary : colors.textSecondary,
                fontSize: 12,
                marginTop: 4
              }}>
                {step.label}
              </Text>
              {idx < steps.length - 1 && (
                <View style={{
                  position: 'absolute',
                  right: -16,
                  top: 16,
                  width: 32,
                  height: 2,
                  backgroundColor: colors.border
                }} />
              )}
            </View>
          ))}
        </View>

        {/* Category Path */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          flexWrap: 'wrap'
        }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Seçilen Kategori: 
          </Text>
          {categoryPath.map((p, idx) => (
            <Text key={p} style={{
              color: colors.primary,
              fontWeight: 'bold',
              fontSize: 14
            }}>
              {idx > 0 ? ' > ' : ''}{p}
            </Text>
          ))}
        </View>

        {/* Images Section */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 18,
          marginBottom: 18
        }}>
          <Text style={{
            color: colors.text,
            fontWeight: 'bold',
            fontSize: 18,
            marginBottom: 8
          }}>
            Görsel Ekleyin
          </Text>
          
          <Text style={{
            color: colors.textSecondary,
            fontSize: 14,
            marginBottom: 14
          }}>
            İlanınızın daha fazla dikkat çekmesi için görseller ekleyin.
          </Text>

          <FlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => item.uniqueId || item.uri || index.toString()}
            numColumns={4}
            scrollEnabled={false}
            ListFooterComponent={
              images.length < maxImages ? (
                <TouchableOpacity
                  style={{
                    width: imageSize,
                    height: imageSize,
                    margin: 4,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: colors.border
                  }}
                  onPress={pickImage}
                >
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginBottom: 4,
                    color: colors.primary
                  }}>
                    +
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    textAlign: 'center',
                    color: colors.textSecondary
                  }}>
                    Görsel Ekle
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            marginBottom: 8
          }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {images.length} / {maxImages} görsel. Ana görsel: 
            </Text>
            <Star size={16} color={colors.primary} />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center'
            }}
            onPress={handleStockImage}
          >
            <Text style={{
              color: colors.primary,
              fontWeight: 'bold',
              fontSize: 15
            }}>
              Stok Görsel Bul
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 8,
            backgroundColor: colors.surface,
            alignItems: 'center',
            marginRight: 8,
            flexDirection: 'row',
            justifyContent: 'center'
          }}
          onPress={handleBack}
        >
          <ChevronLeft size={16} color={colors.textSecondary} />
          <Text style={{
            color: colors.textSecondary,
            fontWeight: 'bold',
            marginLeft: 4
          }}>
            Geri
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 8,
            backgroundColor: colors.primary,
            alignItems: 'center',
            marginLeft: 8,
            flexDirection: 'row',
            justifyContent: 'center'
          }}
          onPress={handleNext}
        >
          <Text style={{
            color: '#fff',
            fontWeight: 'bold',
            marginRight: 4
          }}>
            İleri
          </Text>
          <ChevronRight size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateListingImagesScreen; 