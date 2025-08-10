import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { supabase  } from '../services/supabaseClient';
import { createOffer } from '../services/offerService';
import { fetchUserInventory } from '../services/inventoryService';
import { getUserActivePlan, checkOfferLimit, incrementUserUsage } from '../services/premiumService';
import { Button, Card, Badge, Avatar } from '../components';
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  MessageCircle, 
  Sparkles, 
  Crown,
  ChevronDown,
  AlertCircle,
  Send,
  Paperclip,
  X
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

const { width: screenWidth } = Dimensions.get('window');

const MakeOfferScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const listingId = route.params?.listingId;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [listing, setListing] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);

  // Form state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [useAISuggestion, setUseAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);

  useEffect(() => {
    // Start animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!user || !listingId) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch listing
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('id, title, description, budget, user_id, status, category, main_image_url')
          .eq('id', listingId)
          .single();

        if (listingError || !listingData) {
          Alert.alert('İlan Bulunamadı', 'Teklif yapılacak ilan bulunamadı.');
          navigation.goBack();
          return;
        }
        
        if (listingData.user_id === user.id) {
          Alert.alert('Kendi İlanınız', 'Kendi ilanınıza teklif yapamazsınız.');
          navigation.goBack();
          return;
        }

        if (listingData.status === 'in_transaction' || listingData.status === 'sold') {
          Alert.alert('Teklif Yapılamaz', 'Bu ilan için bir teklif kabul edilmiş veya ilan satılmış.');
          navigation.navigate('ListingDetail', { listingId });
          return;
        }
        
        setListing(listingData);
        
        // Fetch user plan
        const plan = await getUserActivePlan(user.id);
        setUserPlan(plan);
        
        // Fetch inventory
        setIsFetchingInventory(true);
        const inventory = await fetchUserInventory(user.id);
        setInventoryItems(inventory || []);
        setIsFetchingInventory(false);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Hata', 'Veriler yüklenirken bir sorun oluştu.');
        navigation.goBack();
      }
    };

    fetchData();
  }, [user, listingId, navigation]);

  const handleGenerateAISuggestion = async () => {
    if (!listing || !user) return;
    
    const selectedItem = inventoryItems.find(item => item.id === selectedItemId);
    const hasItem = selectedItem ? ` ve envanterimden ${selectedItem.name}` : '';
    const priceText = offeredPrice ? ` ${offeredPrice}₺ nakit` : '';
    
    const suggestion = `Merhaba! "${listing.title}" ilanınızla ilgileniyorum. ` +
      `${listing.category} kategorisinde aradığınız ürünü ben de ihtiyaç duyuyorum. ` +
      `${priceText}${hasItem} teklif etmek istiyorum. ` +
      `Detayları konuşabilir, uygun bir zamanda görüşebilir miyiz? ` +
      `Tecrübeli bir kullanıcıyım ve güvenilir işlem yapabiliriz.`;
    
    setAiSuggestion(suggestion);
    setMessage(suggestion);
    setUseAISuggestion(true);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'text/plain'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.filter((file: any) => file.size && file.size <= 5 * 1024 * 1024); // 5MB limit
        if (newFiles.length !== result.assets.length) {
          Alert.alert('Uyarı', 'Bazı dosyalar 5MB limitini aştığı için eklenmedi.');
        }
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    // En az bir teklif türü gerekli (nakit veya ürün)
    if (!offeredPrice && !selectedItemId) {
      newErrors.general = 'Lütfen bir nakit teklifi yapın veya envanterinizden bir ürün seçin.';
    }

    // Nakit teklifi varsa geçerli bir sayı olmalı
    if (offeredPrice && (isNaN(parseFloat(offeredPrice)) || parseFloat(offeredPrice) < 0)) {
      newErrors.offeredPrice = 'Geçerli bir teklif fiyatı girin (0 veya daha büyük).';
    }

    // Mesaj zorunlu
    if (!message.trim()) {
      newErrors.message = 'Lütfen bir teklif mesajı yazın.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateForm() || !user?.id) return;

    const canMakeOffer = await checkOfferLimit(user.id);
    if (!canMakeOffer) {
      Alert.alert(
        'Teklif Limiti', 
        'Aylık teklif limitinize ulaştınız. Premium üyeliğe geçerek daha fazla teklif yapabilirsiniz.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Premium', onPress: () => navigation.navigate('Premium') }
        ]
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Nakit teklifi yoksa 0 olarak ayarla
      const amount = offeredPrice ? parseFloat(offeredPrice) : 0;
      
      // Teklifi oluştur
      await createOffer({
        listing_id: listing.id,
        offering_user_id: user.id,
        offered_item_id: selectedItemId || undefined,
        offered_price: amount,
        message: message.trim()
      });

      // Başarılı
      await incrementUserUsage(user.id, 'offer');
      Alert.alert(
        '🎉 Başarılı!', 
        'Teklifiniz başarıyla gönderildi! Karşı taraf en kısa sürede size dönüş yapacaktır.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating offer:', error);
      Alert.alert(
        'Hata',
        error instanceof Error 
          ? error.message 
          : 'Teklif gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading || isFetchingInventory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Teklif Yap: {listing?.title?.substring(0, 15) || 'Yükleniyor'}...</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {loading ? 'İlan yükleniyor...' : 'Envanter yükleniyor...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Teklif Yap</Text>
        </View>
        <View style={styles.center}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>İlan bulunamadı.</Text>
          <Button 
            title="Geri Dön" 
            onPress={handleBack}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const selectedInventoryItem = inventoryItems.find(item => item.id === selectedItemId);
  const isPremiumUser = userPlan?.plan_slug !== 'basic';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Teklif Yap: {listing.title.length > 15 ? listing.title.substring(0, 15) + '...' : listing.title}
        </Text>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Plan Info Card */}
          {userPlan && (
            <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <Crown size={20} color="#FFD700" />
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {userPlan.plan_name}
                  </Text>
                </View>
                <Text style={[styles.planLimit, { color: colors.textSecondary }]}>
                  {userPlan.limits?.offers_per_month === -1 
                    ? 'Sınırsız teklif' 
                    : `${userPlan.limits?.offers_per_month || 10} teklif/ay`
                  }
                </Text>
              </View>
            </View>
          )}

          {/* Form Sections */}
          <View style={styles.formContainer}>
            {/* Inventory Item Selection */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Package size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Teklif Edilecek Envanter Ürünü
                </Text>
                <Text style={[styles.optionalText, { color: colors.textSecondary }]}>(Opsiyonel)</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowInventoryDropdown(!showInventoryDropdown)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.dropdownText, 
                  { color: selectedInventoryItem ? colors.text : colors.textSecondary }
                ]}>
                  {selectedInventoryItem ? selectedInventoryItem.name : 'Envanterinizden bir ürün seçin...'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {showInventoryDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedItemId('');
                      setShowInventoryDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>
                      Sadece nakit teklifi
                    </Text>
                  </TouchableOpacity>
                  {inventoryItems.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedItemId(item.id);
                        setShowInventoryDropdown(false);
                      }}
                    >
                      <Avatar 
                        size="sm" 
                        source={item.main_image_url || item.image_url}
                        name={item.name || 'Ürün'}
                      />
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Price Input */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <DollarSign size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ek Nakit Teklifi (₺)
                </Text>
                <Text style={[styles.optionalText, { color: colors.textSecondary }]}>(Opsiyonel)</Text>
              </View>
              
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: errors.offeredPrice ? colors.error : colors.border
                  }
                ]}
                value={offeredPrice}
                onChangeText={setOfferedPrice}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              
              {errors.offeredPrice && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={[styles.errorMessage, { color: colors.error }]}>
                    {errors.offeredPrice}
                  </Text>
                </View>
              )}
            </View>

            {/* Message Input */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <MessageCircle size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Teklif Mesajınız *
                </Text>
              </View>
              
              {isPremiumUser && (
                <TouchableOpacity
                  style={[styles.aiButton, { backgroundColor: colors.primary }]}
                  onPress={handleGenerateAISuggestion}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color="#FFFFFF" />
                  <Text style={styles.aiButtonText}>AI Öneri</Text>
                </TouchableOpacity>
              )}
              
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: colors.surface, 
                    color: colors.text,
                    borderColor: errors.message ? colors.error : colors.border
                  }
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder="Teklifiniz hakkında ek detaylar, takas koşulları, buluşma noktası vb. bilgileri paylaşın..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              
              {errors.message && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={[styles.errorMessage, { color: colors.error }]}>
                    {errors.message}
                  </Text>
                </View>
              )}
            </View>

            {/* File Upload */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Paperclip size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Dosya Ekleri
                </Text>
                <Text style={[styles.optionalText, { color: colors.textSecondary }]}>(Opsiyonel)</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.fileUploadButton, { backgroundColor: colors.primary }]}
                onPress={handleFileUpload}
                activeOpacity={0.8}
              >
                <Text style={styles.fileUploadText}>Choose Files</Text>
              </TouchableOpacity>
              
              {selectedFiles.length === 0 ? (
                <Text style={[styles.noFileText, { color: colors.textSecondary }]}>
                  No file chosen
                </Text>
              ) : (
                <View style={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={[styles.fileItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <TouchableOpacity onPress={() => removeFile(index)}>
                        <X size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              <Text style={[styles.fileInfo, { color: colors.textSecondary }]}>
                JPG, PNG, PDF, TXT dosyaları desteklenir. Maksimum 5MB.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>İptal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.warning }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Send size={16} color="#000000" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Gönderiliyor...' : 'Teklif Gönder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Loading States
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Error State
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 16,
  },
  
  // Plan Card
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  planLimit: {
    fontSize: 14,
  },
  
  // Form
  formContainer: {
    gap: 24,
  },
  formSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  optionalText: {
    fontSize: 14,
  },
  
  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    flex: 1,
  },
  
  // Input
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  
  // Message
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 120,
  },
  
  // File Upload
  fileUploadButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fileUploadText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noFileText: {
    fontSize: 14,
    marginTop: 8,
  },
  fileList: {
    gap: 8,
    marginTop: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  fileName: {
    fontSize: 14,
    flex: 1,
  },
  fileInfo: {
    fontSize: 12,
    marginTop: 8,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorMessage: {
    fontSize: 12,
  },
  
  // Actions
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MakeOfferScreen; 