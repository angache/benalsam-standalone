import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { Header, Button, Card } from '../components';
import { ChevronLeft } from 'lucide-react-native';
import { searchUnsplashImages } from '../services/unsplashService';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useCreateListingStore } from '../stores';

const { width } = Dimensions.get('window');

const StockImageSearchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  
  // Use Zustand store instead of Context
  const createListingStore = useCreateListingStore();
  
  const initialQuery = route.params?.initialQuery || '';
  const sourceScreen = route.params?.sourceScreen || 'createListing'; // 'createListing' or 'editListing'
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const maxImages = 5;

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, []);

  // Hardware back button desteği
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Arama terimi girin', 'Lütfen aramak için bir şeyler yazın.');
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    setSearchResults([]);
    setSelectedImages([]);
    
    try {
      const results = await searchUnsplashImages(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        Alert.alert('Sonuç bulunamadı', 'Farklı bir arama terimi deneyin.');
      }
    } catch (error: any) {
      Alert.alert('Arama Hatası', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const toggleImageSelection = (image: any) => {
    setSelectedImages(prev => {
      if (prev.find(img => img.id === image.id)) {
        return prev.filter(img => img.id !== image.id);
      } else {
        if (prev.length >= maxImages) {
          Alert.alert('Görsel Limiti', `En fazla ${maxImages} görsel seçebilirsiniz.`);
          return prev;
        }
        return [...prev, image];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Görsel Seçin', 'Lütfen en az bir görsel seçin.');
      return;
    }

    const selectedWithIds = selectedImages.map(img => ({
      ...img,
      uniqueId: `${img.id || 'stock'}_${Date.now()}_${Math.random()}`,
      isStockImage: true
    }));

    if (sourceScreen === 'editListing') {
      // For edit listing, just go back with the selected images
      navigation.navigate('EditListing', {
        stockImages: selectedWithIds
      });
    } else {
      // For create listing, use the original navigation reset
      navigation.reset({
        index: 2,
        routes: [
          { name: 'CreateListingCategory' },
          { name: 'CreateListingDetails' },
          { 
            name: 'CreateListingImages',
            params: { stockImages: selectedWithIds }
          }
        ],
      });
    }
  };

  const renderImageItem = (image: any, index: number) => {
    const isSelected = selectedImages.some(img => img.id === image.id);
    
    return (
      <TouchableOpacity
        key={image.uniqueId || image.uri || image.id || index}
        style={styles.imageContainer}
        onPress={() => toggleImageSelection(image)}
      >
        <View style={[styles.imageWrapper, isSelected && { borderColor: colors.primary, borderWidth: 3 }]}>
          <Image
            source={{ uri: image.urls.small }}
            style={styles.image}
            resizeMode="cover"
          />
          {isSelected && (
            <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
              <Text style={[styles.checkIcon, { color: colors.white }]}>✓</Text>
            </View>
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.photographerName} numberOfLines={1}>
              {image.user.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.searchCard}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            İlanınız için ücretsiz stok görseller arayın. Arama yapmak için ilan başlığı ve kategorisi kullanıldı.
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Örn: Mavi bisiklet, modern koltuk..."
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={handleSearch}
            />
            <Button
              title={isLoading ? 'Aranıyor...' : 'Ara'}
              onPress={handleSearch}
              loading={isLoading}
              style={styles.searchButton}
            />
          </View>
        </Card>

        <View style={styles.resultsContainer}>
          {isLoading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Görseller aranıyor...
              </Text>
            </View>
          )}
          
          {!isLoading && searchResults.length > 0 && (
            <View style={styles.imagesGrid}>
              {searchResults.map((item, index) => renderImageItem(item, index))}
            </View>
          )}
          
          {!isLoading && searchResults.length === 0 && hasSearched && (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aramanız için sonuç bulunamadı.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Lütfen farklı anahtar kelimelerle tekrar deneyin.
              </Text>
            </View>
          )}
          
          {!isLoading && !hasSearched && (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                İlanınızla ilgili görseller bulmak için arama yapın.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Örn: "kırmızı spor araba", "ahşap yemek masası"
              </Text>
            </View>
          )}
        </View>

        {/* Açıklama metni - butonların üstünde */}
        <View style={{ paddingHorizontal: 4, marginTop: 20, marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
            {selectedImages.length > 0 
              ? `${selectedImages.length} görsel seçildi. Seçimlerinizi onaylayın veya iptal edin.`
              : 'Görselleri seçmek için üzerlerine dokunun. En fazla 5 görsel seçebilirsiniz.'
            }
          </Text>
        </View>
      </ScrollView>
      
      {/* Butonlar - Tabana sabitlenmiş */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
        <TouchableOpacity 
          style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', marginRight: 8, justifyContent: 'center' }} 
          onPress={() => navigation.goBack()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', marginLeft: 4 }}>İptal</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            padding: 14, 
            borderRadius: 8, 
            backgroundColor: selectedImages.length === 0 ? colors.border : colors.primary, 
            alignItems: 'center', 
            marginLeft: 8, 
            justifyContent: 'center',
            opacity: selectedImages.length === 0 ? 0.5 : 1
          }} 
          onPress={handleConfirmSelection}
          disabled={selectedImages.length === 0}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {selectedImages.length > 0 ? `${selectedImages.length} Görsel Seç` : 'Görsel Seç'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    padding: 16,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  searchButton: {
    minWidth: 80,
  },
  resultsContainer: {
    flex: 1,
    minHeight: 400,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    width: (width - 48) / 2,
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photographerName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  selectionCard: {
    padding: 16,
    marginTop: 20,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    minWidth: 80,
  },
  confirmButton: {
    minWidth: 120,
  },
});

export default StockImageSearchScreen; 