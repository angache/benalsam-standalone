import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCreateListingStore } from '../stores';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import CategoryAttributesSelector from '../components/CategoryAttributesSelector';
import { useThemeColors } from '../stores/themeStore';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { findCategoryAttributes } from '../config/categories-with-attributes';


// Durum seçenekleri
const CONDITION_OPTIONS = [
  { value: 'Sıfır', label: 'Sıfır (Hiç kullanılmamış)' },
  { value: 'Yeni', label: 'Yeni (Orijinal paketinde)' },
  { value: 'Az Kullanılmış', label: 'Az Kullanılmış (Çok iyi durumda)' },
  { value: 'İkinci El', label: 'İkinci El (İyi durumda)' },
  { value: 'Yenilenmiş', label: 'Yenilenmiş (Onarılmış/Refurbished)' },
  { value: 'Hasarlı', label: 'Hasarlı (Onarım gerekebilir)' },
  { value: 'Parça', label: 'Parça (Sadece parça olarak)' },
];

export default function CreateListingDetailsScreen() {
  const navigation = useNavigation();
  const { data: listingData, setStepData } = useCreateListingStore();
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['İkinci El']);
  const [priceInput, setPriceInput] = useState('');

  const [attributeValues, setAttributeValues] = useState<Record<string, string[]>>(listingData.details?.attributes || {});
  const colors = useThemeColors();

  const updateListingData = (updates: any) => {
    // Mevcut details varsa spread et, yoksa boş obje kullan
    const currentDetails = listingData.details || {};
    console.log('🔍 updateListingData - Current details:', currentDetails);
    console.log('🔍 updateListingData - Updates:', updates);
    const newDetails = { ...currentDetails, ...updates };
    console.log('🔍 updateListingData - New details:', newDetails);
    setStepData('details', newDetails);
  };



  const handleContinue = () => {
    // Kategori kontrolü - hem listingData.category hem de listingData.details.category'yi kontrol et
    const category = listingData.category || listingData.details?.category;
    if (!category) {
      Alert.alert('Hata', 'Lütfen önce kategori seçin');
      return;
    }
    
    if (!listingData.details?.title || !listingData.details?.description) {
      Alert.alert('Hata', 'Lütfen başlık ve açıklama alanlarını doldurun');
      return;
    }
    
    // Bütçe validasyonu - priceInput'tan değeri kontrol et
    const numericValue = priceInput.replace(/[^\d]/g, '');
    const budget = numericValue ? parseInt(numericValue, 10) : 0;
    
    if (!budget || budget <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir bütçe giriniz');
      return;
    }
    
    if (selectedConditions.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir durum seçin');
      return;
    }
    
    // Tüm verileri store'a kaydet
    console.log('💰 Saving budget to store:', budget);
    console.log('📋 Saving attributes to store:', attributeValues);
    updateListingData({ 
      budget,
      condition: selectedConditions,
      attributes: attributeValues
    });
    
    // Debug: Store'daki güncel veriyi kontrol et
    console.log('💰 Current store data after update:', listingData);
    
    // Hemen navigasyon yap - store güncellemesi senkron
    navigation.navigate('CreateListingImages' as never);
  };

  // Durum seçimi fonksiyonları
  const handleConditionSelect = (condition: string) => {
    setSelectedConditions(prev => {
      const newConditions = prev.includes(condition)
        ? prev.filter(c => c !== condition) // Seçiliyse kaldır
        : [...prev, condition]; // Seçili değilse ekle
      
      // Store'a kaydet
      updateListingData({ condition: newConditions });
      return newConditions;
    });
  };





  // Attribute kaydetme fonksiyonu
  const handleSaveAttributes = (values: Record<string, string[]>) => {
    setAttributeValues(values);
    updateListingData({ attributes: values });
  };

  // Kategori path'ini bul
  const categoryPath =
    Array.isArray(listingData.category) && listingData.category.length > 0
      ? listingData.category
      : typeof listingData.category === 'string' && listingData.category
        ? listingData.category.split(' > ')
        : typeof listingData.details?.category === 'string' && listingData.details.category
          ? listingData.details.category.split(' > ')
          : [];

  // Component mount olduğunda mevcut seçimleri yükle
  React.useEffect(() => {
    if (listingData.details?.condition) {
      const conditions = Array.isArray(listingData.details.condition) 
        ? listingData.details.condition 
        : [listingData.details.condition];
      setSelectedConditions(conditions);
    }
    
    if (listingData.details?.budget) {
      console.log('💰 Loading budget from store:', listingData.details.budget);
      setPriceInput(listingData.details.budget.toLocaleString('tr-TR'));
    }

    if (listingData.details?.attributes) {
      console.log('🎯 Loading attributes from store:', listingData.details.attributes);
      setAttributeValues(listingData.details.attributes);
    }
  }, [listingData.details?.condition, listingData.details?.budget, listingData.details?.attributes]);

  // Dropdown'u dışarı tıklayarak kapatma
  React.useEffect(() => {
    if (showConditionDropdown) {
      // Kısa bir gecikme ile dropdown'u kapat
      const timer = setTimeout(() => {
        // Bu kısım TouchableWithoutFeedback ile yapılacak
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showConditionDropdown]);



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    formCard: {
      marginBottom: 20,
    },
    input: {
      marginBottom: 12,
    },
    continueButton: {
      backgroundColor: colors.primary,
      marginTop: 20,
    },
    // Durum dropdown stilleri
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    conditionSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      minHeight: 48,
    },
    conditionText: {
      fontSize: 16,
      flex: 1,
    },
    dropdownMenu: {
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: 300,
    },
    dropdownItem: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    dropdownItemText: {
      fontSize: 14,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    checkboxText: {
      fontSize: 16,
    },
    clearButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderTopWidth: 1,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    selectedConditionsContainer: {
      marginBottom: 8,
      minHeight: 40,
      paddingHorizontal: 4,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#f5f5f5',
    },
    conditionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginHorizontal: 2,
      borderWidth: 1,
      borderColor: '#ccc',
      marginVertical: 2,
    },
    conditionChipText: {
      fontSize: 12,
      fontWeight: '600',
      marginRight: 4,
    },
    removeButton: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    removeButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    selectedAttributesContainer: {
      marginBottom: 8,
    },
    attributeGroup: {
      marginBottom: 12,
    },
    attributeGroupLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    attributeChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    attributeChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    attributeChipText: {
      fontSize: 12,
      fontWeight: '500',
    },
  });

  // Kategori seçilmemişse kategori seçim sayfasına yönlendir
  const category = listingData.category || listingData.details?.category;
  if (!category) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { textAlign: 'center', marginBottom: 20 }]}>
          Önce Kategori Seçin
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 30 }}>
          İlan detaylarını girebilmek için önce bir kategori seçmeniz gerekiyor.
        </Text>
        <Button
          title="Kategori Seç"
          onPress={() => navigation.navigate('CreateListingCategory' as never)}
          style={styles.continueButton}
        />
      </View>
    );
  }

  const steps = [
    { label: 'Kategori' },
    { label: 'Detaylar' },
    { label: 'Fotoğraflar' },
    { label: 'Konum' },
    { label: 'Önizleme' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ScrollView style={styles.scrollContent}>
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
                backgroundColor: idx === 1 ? colors.primary : colors.surface,
                borderWidth: 2,
                borderColor: idx === 1 ? colors.primary : colors.border
              }}>
                <Text style={{
                  color: idx === 1 ? '#fff' : colors.textSecondary,
                  fontWeight: 'bold'
                }}>
                  {idx + 1}
                </Text>
              </View>
              <Text style={{
                color: idx === 1 ? colors.primary : colors.textSecondary,
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
        {category && (
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
            {Array.isArray(category) ? category.map((p, idx) => (
              <Text key={p} style={{
                color: colors.primary,
                fontWeight: 'bold',
                fontSize: 14
              }}>
                {idx > 0 ? ' > ' : ''}{p}
              </Text>
            )) : (
              <Text style={{
                color: colors.primary,
                fontWeight: 'bold',
                fontSize: 14
              }}>
                {category}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.title}>İlan Detayları</Text>
        
        {/* Manual Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>📝 İlan Detayları</Text>
          
          <Input
            label="İlan Başlığı"
            placeholder="Ne arıyorsunuz?"
            value={listingData.details?.title}
            onChangeText={(text) => updateListingData({ title: text })}
            style={styles.input}
          />
          
          <Input
            label="Açıklama"
            placeholder="Detaylı açıklama yazın..."
            value={listingData.details?.description}
            onChangeText={(text) => updateListingData({ description: text })}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          
          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bütçe (₺)</Text>
            <TextInput
              placeholder="Bütçenizi giriniz"
              value={priceInput}
              onChangeText={(text) => {
                // Sadece rakamları al
                const numericValue = text.replace(/[^\d]/g, '');
                setPriceInput(numericValue ? parseInt(numericValue, 10).toLocaleString('tr-TR') : '');
                const price = numericValue ? parseInt(numericValue, 10) : 0;
                updateListingData({ budget: price });
              }}
              keyboardType="numeric"
              returnKeyType="done"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.surface
              }}
            />
          </View>
          
          {/* Durum Seçimi */}
          <View style={styles.input}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Durum</Text>
            <View style={[styles.selectedConditionsContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingVertical: 8, flexDirection: 'row', flexWrap: 'wrap' }]}> 
              {CONDITION_OPTIONS.map((option) => {
                const selected = selectedConditions.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.conditionChip, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border, marginVertical: 4 }]}
                    onPress={() => handleConditionSelect(option.value)}
                  >
                    <Text style={[styles.conditionChipText, { color: selected ? colors.background || '#fff' : colors.textSecondary }]}> 
                      {option.label.split(' (')[0]}
                    </Text>
                    {selected && (
                      <Text style={[styles.removeButtonText, { color: colors.background || '#fff', marginLeft: 4 }]}>×</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {/* Seçilen Özellikler Özeti */}
          {Object.keys(attributeValues).some(key => attributeValues[key]?.length > 0) && (
            <View style={styles.input}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Seçili Özellikler:</Text>
              {(() => {
                console.log('categoryPath:', categoryPath);
                const attributes = findCategoryAttributes(categoryPath.join(' > ')) || [];
                console.log('attributes:', attributes);
                console.log('attributeValues:', attributeValues);
                return null;
              })()}
              <View style={{
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginTop: 8
              }}>
                {(() => {
                  const attributes = findCategoryAttributes(categoryPath.join(' > ')) || [];
                  return Object.entries(attributeValues).map(([key, values]) => {
                    if (values.length === 0) return null;
                    const attr = attributes.find(a => a.key === key);
                    const label = attr ? attr.label : (key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'));
                    return (
                      <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: '600', minWidth: 90 }}>
                          {label}
                          <Text style={{ color: colors.text }}>: </Text>
                        </Text>
                        {values.map((value, idx) => (
                          <Text
                            key={idx}
                            style={{ color: colors.primary, fontWeight: '600', marginRight: 12, textDecorationLine: 'underline' }}
                          >
                            {value}
                          </Text>
                        ))}
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}

          {/* Kategori Bazlı Özellikler */}
          {categoryPath.length > 0 && (
            <>
              {console.log('🔍 CreateListingDetails - CategoryPath:', categoryPath.join(' > '))}
              {console.log('🔍 CreateListingDetails - CategoryPath Array:', categoryPath)}
              {console.log('🔍 CreateListingDetails - AttributeValues:', attributeValues)}
              <CategoryAttributesSelector
                categoryPath={categoryPath.join(' > ')}
                selectedAttributes={attributeValues}
                onAttributesChange={handleSaveAttributes}
                maxSelectionsPerAttribute={5}
              />
            </>
          )}
        </Card>
        </ScrollView>

        {/* Navigation Buttons - Fixed at bottom */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 12,
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
            onPress={() => navigation.goBack()}
          >
            <Text style={{
              color: colors.textSecondary,
              fontWeight: 'bold'
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
            onPress={handleContinue}
          >
            <Text style={{
              color: '#fff',
              fontWeight: 'bold'
            }}>
              Devam Et
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
} 