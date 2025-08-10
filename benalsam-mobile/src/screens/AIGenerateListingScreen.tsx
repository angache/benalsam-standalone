import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { Button, CategorySuggestionCard, CategoryAttributesSelector } from '../components';
import { ArrowLeft, Sparkles, Edit3, CheckCircle, ChevronDown } from 'lucide-react-native';
import { generateListingWithAI } from '../services/aiServiceManager';
import { useCreateListingStore } from '../stores';
import { CategoryMatch, CategorySuggestion } from '../services/categoryMatcher';
import CategorySelectionModal from '../components/CategorySelectionModal';


interface AIListingResponse {
  title: string;
  description: string;
  category: string;
  suggestedPrice: number;
  condition: string | string[];
  features: string[];
  tags: string[];
  categorySuggestions?: CategorySuggestion;
}

const AIGenerateListingScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { setStepData } = useCreateListingStore();
  
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedListing, setGeneratedListing] = useState<AIListingResponse | null>(null);
  const [editedListing, setEditedListing] = useState<AIListingResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [isUsingMockService, setIsUsingMockService] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryMatch | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const generateListing = async () => {
    if (!userInput.trim()) {
      Alert.alert('Uyarı', 'Lütfen ürününüzü açıklayın');
      return;
    }

    setIsGenerating(true);
    setDebugInfo(''); // Debug bilgilerini temizle
    setIsUsingMockService(false); // Mock service durumunu sıfırla
    setSelectedCategory(null); // Seçili kategoriyi sıfırla
    
    try {
      console.log('🚀 Starting AI generation...');
      setDebugInfo('AI servisi çağrılıyor...\n');
      
      // Geçici olarak userId ve isPremium değerlerini kullan
      const userId = 'temp-user-' + Date.now(); // Geçici kullanıcı ID
      const isPremium = false; // Ücretsiz kullanıcı
      
      const aiResponse = await generateListingWithAI(userInput.trim(), userId, isPremium);
      
      console.log('✅ AI generation completed:', aiResponse);
      setDebugInfo(prev => prev + `✅ ${aiResponse.serviceUsed} yanıtı alındı!\n` + JSON.stringify(aiResponse.result, null, 2));
      
      // Mock service kullanılıp kullanılmadığını kontrol et
      if (aiResponse.isMockService) {
        setIsUsingMockService(true);
        setDebugInfo(prev => prev + `\n💰 Mock servis kullanıldı (${aiResponse.serviceUsed})\n`);
      }
      
      setGeneratedListing(aiResponse.result);
      setEditedListing(aiResponse.result);
      
      // Kategori önerilerini gösterme - kullanıcı kendi seçsin
      if (aiResponse.result.categorySuggestions) {
        console.log('🎯 AI category suggestions available but not auto-selecting');
        // Kategori önerilerini gösterme, kullanıcı kendi seçsin
      }
    } catch (error) {
      console.error('❌ AI generation error:', error);
      setDebugInfo(prev => prev + '❌ Hata: ' + (error as Error).message + '\n');
      Alert.alert('Hata', 'İlan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGeneratedListing = async () => {
    if (!editedListing) return;

    // Seçili kategoriyi kullan, yoksa AI'dan gelen kategoriyi kullan
    const finalCategory = selectedCategory?.categoryPath || editedListing.category;
    console.log('🎯 Final category being saved:', finalCategory);
    console.log('🎯 Selected attributes being saved:', selectedAttributes);

    // CreateListingStore'a veriyi kaydet
    setStepData('details', {
      title: editedListing.title,
      description: editedListing.description,
      budget: editedListing.suggestedPrice, // Bütçe olarak kaydet
      condition: Array.isArray(editedListing.condition) ? editedListing.condition : [editedListing.condition],
      category: finalCategory, // Seçili kategoriyi ekle
      features: editedListing.features, // AI'dan gelen özellikleri kaydet
      tags: editedListing.tags, // AI'dan gelen etiketleri kaydet
      attributes: selectedAttributes, // Seçilen attribute'leri kaydet
    });

    // Kategori zaten seçilmiş olduğu için doğrudan detaylar sayfasına yönlendir
    navigation.navigate('CreateListingDetails');
  };

  const handleEditField = (field: keyof AIListingResponse, value: string | number) => {
    if (!editedListing) return;
    
    setEditedListing(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleCategorySelect = (category: CategoryMatch) => {
    console.log('🎯 Category selected:', category);
    setSelectedCategory(category);
    // Kategori değiştiğinde attribute'leri sıfırla
    setSelectedAttributes({});
  };

  const renderCategorySection = () => {
    if (!editedListing) return null;

    const currentCategory = selectedCategory?.categoryPath || editedListing.category;

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Kategori</Text>
        
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.categorySelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.categoryText, { color: colors.text }]} numberOfLines={1}>
              {currentCategory || 'Kategori Seçin'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.categoryHint, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
          Lütfen ürününüz için en uygun kategoriyi seçin
        </Text>
      </View>
    );
  };

  const renderGeneratedContent = () => {
    if (!generatedListing || !editedListing) return null;

    return (
      <View style={styles.generatedContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <CheckCircle size={16} color={colors.success} /> Oluşturulan Alım İlanı
          </Text>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>İlan Başlığı</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editedListing.title}
              onChangeText={(text) => handleEditField('title', text)}
              placeholder="Alım ilanı başlığı"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>İhtiyaç Açıklaması</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editedListing.description}
              onChangeText={(text) => handleEditField('description', text)}
              placeholder="İhtiyacınızın detaylı açıklaması"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Kategori Bölümü */}
          {renderCategorySection()}

          {/* Kategori Attribute'leri */}
          {/* {selectedCategory && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Kategori Özellikleri</Text>
              <CategoryAttributesSelector
                categoryPath={selectedCategory.categoryPath}
                selectedAttributes={selectedAttributes}
                onAttributesChange={setSelectedAttributes}
              />
            </View>
          )} */}

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bütçe Aralığı</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editedListing.suggestedPrice > 0 ? editedListing.suggestedPrice.toLocaleString('tr-TR') + ' ₺' : ''}
              onChangeText={(text) => {
                // Sadece rakamları al
                const numericValue = text.replace(/[^\d]/g, '');
                const price = numericValue ? parseInt(numericValue, 10) : 0;
                handleEditField('suggestedPrice', price);
              }}
              placeholder="Bütçenizi giriniz (örn: 15000)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>



          {editedListing.features.length > 0 && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Özellikler</Text>
              <View style={styles.featuresContainer}>
                {editedListing.features.map((feature, index) => (
                  <View key={index} style={[styles.featureTag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.featureText, { color: colors.primary }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {editedListing.tags.length > 0 && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Etiketler</Text>
              <View style={styles.tagsContainer}>
                {editedListing.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>


      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI İlan Oluşturucu</Text>
        <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={styles.debugButton}>
          <Text style={[styles.debugButtonText, { color: colors.primary }]}>
            {showDebug ? 'Debug Kapat' : 'Debug'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: generatedListing && editedListing ? 100 : 20 }}
      >
        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.aiHeader}>
            <Sparkles size={24} color={colors.primary} />
            <Text style={[styles.aiTitle, { color: colors.text }]}>
              AI ile İlan Oluştur
            </Text>
          </View>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            İhtiyacınız olan ürünü açıklayın, AI sizin için profesyonel bir alım ilanı oluştursun.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Örnek: iPhone 13 Pro Max 256GB arıyorum, bütçem 15-20 bin TL arası, temiz ve sağlam olması önemli..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <Button
            title={isGenerating ? "Oluşturuluyor..." : "AI ile Alım İlanı Oluştur"}
            onPress={generateListing}
            disabled={isGenerating || !userInput.trim()}
            style={{ 
              backgroundColor: isGenerating ? colors.surface : colors.primary,
              opacity: isGenerating || !userInput.trim() ? 0.5 : 1
            }}
            textStyle={{ color: isGenerating ? colors.textSecondary : colors.white }}
            icon={isGenerating ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Sparkles size={20} color={colors.white} />}
          />
        </View>

        {/* Generated Content */}
        {renderGeneratedContent()}

        {/* Mock Service Warning */}
        {isUsingMockService && (
          <View style={[styles.mockServiceWarning, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Text style={[styles.mockServiceWarningText, { color: colors.warning }]}>
              ⚠️ Demo Modu: API bakiye yetersiz olduğu için demo veriler kullanılıyor. Gerçek AI özelliği için API bakiyenizi kontrol edin.
            </Text>
          </View>
        )}

        {/* Debug Section */}
        {showDebug && (
          <View style={styles.debugSection}>
            <Text style={[styles.debugTitle, { color: colors.text }]}>
              🔍 Debug Bilgileri
            </Text>
            <ScrollView 
              style={[styles.debugContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              showsVerticalScrollIndicator={true}
            >
              <Text style={[styles.debugText, { color: colors.text }]}>
                {debugInfo || 'Henüz debug bilgisi yok...'}
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={[styles.clearDebugButton, { backgroundColor: colors.error }]}
              onPress={() => setDebugInfo('')}
            >
              <Text style={[styles.clearDebugButtonText, { color: colors.white }]}>
                Debug Temizle
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Button */}
      {generatedListing && editedListing && (
        <View style={[styles.fixedBottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title="Bu Alım İlanını Kullan"
            onPress={handleUseGeneratedListing}
            style={{ backgroundColor: colors.primary }}
            textStyle={{ color: colors.white }}
          />
        </View>
      )}

      {/* Category Selection Modal */}
      <CategorySelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategorySelect={(selectedPath: string[]) => {
          // Seçilen kategoriyi güncelle
          const newSelectedCategory = {
            categoryPath: selectedPath.join(' > '),
            confidence: 1.0,
            mainCategory: selectedPath[0],
            subCategory: selectedPath.length > 1 ? selectedPath[1] : undefined,
            subSubCategory: selectedPath.length > 2 ? selectedPath[2] : undefined
          };
          console.log('🎯 Category selected from modal:', newSelectedCategory);
          setSelectedCategory(newSelectedCategory);
          setSelectedAttributes({}); // Attribute'leri sıfırla
          setShowCategoryModal(false);
        }}
        currentCategory={selectedCategory?.categoryPath || editedListing?.category}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  generatedContainer: {
    marginTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  changeCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeCategoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  categorySuggestionsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 16,
  },
  debugButton: {
    padding: 8,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  debugSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  debugContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  clearDebugButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  clearDebugButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mockServiceWarning: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcc00', // Default warning color
  },
  mockServiceWarningText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

});

export default AIGenerateListingScreen; 