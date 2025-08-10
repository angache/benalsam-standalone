import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { X, Plus, Tag, ChevronRight, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getCategoryFeatures, 
  CategoryFeaturesConfig, 
  CategoryFeature, 
  CategoryTag 
} from '../config/categoryFeatures';

import { useAuthStore } from '../stores';

interface CategoryFeaturesSelectorProps {
  categoryPath: string;
  selectedFeatures: string[];
  selectedTags: string[];
  onFeaturesChange: (features: string[]) => void;
  onTagsChange: (tags: string[]) => void;
  maxFeatures?: number;
  maxTags?: number;
}

export default function CategoryFeaturesSelector({
  categoryPath,
  selectedFeatures,
  selectedTags,
  onFeaturesChange,
  onTagsChange,
  maxFeatures = 10,
  maxTags = 8,
}: CategoryFeaturesSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [config, setConfig] = useState<CategoryFeaturesConfig | null>(null);
  const [customFeature, setCustomFeature] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [showCustomFeatureInput, setShowCustomFeatureInput] = useState(false);
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  
  // Modal states
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tempSelectedFeatures, setTempSelectedFeatures] = useState<string[]>([]);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    console.log('🔍 CategoryFeaturesSelector - categoryPath:', categoryPath);
    console.log('🔍 CategoryFeaturesSelector - selectedFeatures:', selectedFeatures);
    console.log('🔍 CategoryFeaturesSelector - selectedTags:', selectedTags);
    const categoryConfig = getCategoryFeatures(categoryPath);
    console.log('🔍 CategoryFeaturesSelector - categoryConfig:', categoryConfig);
    setConfig(categoryConfig);
  }, [categoryPath, selectedFeatures, selectedTags]);

  // Modal açılırken geçici seçimleri ayarla
  const openFeaturesModal = () => {
    setTempSelectedFeatures([...selectedFeatures]);
    setShowFeaturesModal(true);
  };

  const openTagsModal = () => {
    setTempSelectedTags([...selectedTags]);
    setShowTagsModal(true);
  };

  // Modal kapatılırken seçimleri uygula
  const closeFeaturesModal = () => {
    onFeaturesChange(tempSelectedFeatures);
    setShowFeaturesModal(false);
  };

  const closeTagsModal = () => {
    onTagsChange(tempSelectedTags);
    setShowTagsModal(false);
  };

  const handleFeatureToggle = (featureId: string) => {
    if (selectedFeatures.includes(featureId)) {
      onFeaturesChange(selectedFeatures.filter(id => id !== featureId));
    } else {
      if (selectedFeatures.length >= maxFeatures) {
        Alert.alert(
          'Maksimum Özellik Sayısı',
          `En fazla ${maxFeatures} özellik seçebilirsiniz.`
        );
        return;
      }
      onFeaturesChange([...selectedFeatures, featureId]);
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      if (selectedTags.length >= maxTags) {
        Alert.alert(
          'Maksimum Etiket Sayısı',
          `En fazla ${maxTags} etiket seçebilirsiniz.`
        );
        return;
      }
      onTagsChange([...selectedTags, tagId]);
    }
  };

  // Modal içindeki toggle fonksiyonları
  const handleModalFeatureToggle = (featureId: string) => {
    if (tempSelectedFeatures.includes(featureId)) {
      setTempSelectedFeatures(tempSelectedFeatures.filter(id => id !== featureId));
    } else {
      if (tempSelectedFeatures.length >= maxFeatures) {
        Alert.alert(
          'Maksimum Özellik Sayısı',
          `En fazla ${maxFeatures} özellik seçebilirsiniz.`
        );
        return;
      }
      setTempSelectedFeatures([...tempSelectedFeatures, featureId]);
    }
  };

  const handleModalTagToggle = (tagId: string) => {
    if (tempSelectedTags.includes(tagId)) {
      setTempSelectedTags(tempSelectedTags.filter(id => id !== tagId));
    } else {
      if (tempSelectedTags.length >= maxTags) {
        Alert.alert(
          'Maksimum Etiket Sayısı',
          `En fazla ${maxTags} etiket seçebilirsiniz.`
        );
        return;
      }
      setTempSelectedTags([...tempSelectedTags, tagId]);
    }
  };

  const addCustomFeature = async () => {
    if (customFeature.trim()) {
      if (selectedFeatures.length >= maxFeatures) {
        Alert.alert(
          'Maksimum Özellik Sayısı',
          `En fazla ${maxFeatures} özellik seçebilirsiniz.`
        );
        return;
      }
      
      try {
        // Geçici ID kullan (Firebase kaldırıldı)
        const tempFeatureId = `custom_${Date.now()}`;
        onFeaturesChange([...selectedFeatures, tempFeatureId]);
        console.log('✅ Custom feature added:', tempFeatureId);
      } catch (error) {
        console.error('❌ Error saving custom feature:', error);
        // Hata durumunda geçici ID kullan
        const tempFeatureId = `custom_${Date.now()}`;
        onFeaturesChange([...selectedFeatures, tempFeatureId]);
      }
      
      setCustomFeature('');
      setShowCustomFeatureInput(false);
    }
  };

  const addCustomTag = async () => {
    if (customTag.trim()) {
      if (selectedTags.length >= maxTags) {
        Alert.alert(
          'Maksimum Etiket Sayısı',
          `En fazla ${maxTags} etiket seçebilirsiniz.`
        );
        return;
      }
      
      try {
        // Geçici ID kullan (Firebase kaldırıldı)
        const tempTagId = `custom_${Date.now()}`;
        onTagsChange([...selectedTags, tempTagId]);
        console.log('✅ Custom tag added:', tempTagId);
      } catch (error) {
        console.error('❌ Error saving custom tag:', error);
        // Hata durumunda geçici ID kullan
        const tempTagId = `custom_${Date.now()}`;
        onTagsChange([...selectedTags, tempTagId]);
      }
      
      setCustomTag('');
      setShowCustomTagInput(false);
    }
  };

  const getFeatureName = (featureId: string): string => {
    if (featureId.startsWith('custom_')) {
      // Firebase'den özel özellik ismini almaya çalış
      const customFeature = config?.features.find((f: CategoryFeature) => f.id === featureId);
      return customFeature?.name || 'Özel Özellik';
    }
    return config?.features.find((f: CategoryFeature) => f.id === featureId)?.name || featureId;
  };

  const getTagName = (tagId: string): string => {
    if (tagId.startsWith('custom_')) {
      // Firebase'den özel etiket ismini almaya çalış
      const customTag = config?.tags.find((t: CategoryTag) => t.id === tagId);
      return customTag?.name || 'Özel Etiket';
    }
    return config?.tags.find((t: CategoryTag) => t.id === tagId)?.name || tagId;
  };

  if (!config) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          Bu kategori için özellik ve etiket tanımları bulunamadı.
        </Text>
      </View>
    );
  }

  // İlk 6 özellik ve etiket
  const initialFeatures = config.features.slice(0, 6);
  const initialTags = config.tags.slice(0, 6);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Özellikler Bölümü */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Özellikler ({selectedFeatures.length}/{maxFeatures})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Ürününüzün özelliklerini seçin
          </Text>
        </View>

        {/* Seçili Özellikler */}
        {selectedFeatures.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={[styles.selectedTitle, { color: colors.textSecondary }]}>
              Seçili Özellikler:
            </Text>
            <View style={styles.chipContainer}>
              {selectedFeatures.map((featureId) => (
                <View key={featureId} style={[styles.chip, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.chipText, { color: colors.white }]}>
                    {getFeatureName(featureId)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleFeatureToggle(featureId)}
                    style={styles.chipRemoveButton}
                  >
                    <X size={12} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* İlk 6 Özellik + Gör Butonu */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            {initialFeatures.map((feature: CategoryFeature) => (
              <TouchableOpacity
                key={feature.id}
                onPress={() => handleFeatureToggle(feature.id)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedFeatures.includes(feature.id) 
                      ? colors.primary 
                      : colors.border,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: selectedFeatures.includes(feature.id) 
                        ? colors.white 
                        : colors.text,
                    }
                  ]}
                >
                  {feature.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Gör Butonu */}
            {config.features.length > 6 && (
              <TouchableOpacity
                onPress={openFeaturesModal}
                style={[styles.viewMoreButton, { borderColor: colors.primary }]}
              >
                <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                  Gör ({config.features.length})
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            
            {/* Özel Özellik Ekleme */}
            {!showCustomFeatureInput ? (
              <TouchableOpacity
                onPress={() => setShowCustomFeatureInput(true)}
                style={[styles.addCustomButton, { borderColor: colors.primary }]}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={[styles.addCustomText, { color: colors.primary }]}>
                  Özel
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    }
                  ]}
                  value={customFeature}
                  onChangeText={setCustomFeature}
                  placeholder="Özel özellik ekle..."
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={addCustomFeature}
                />
                <TouchableOpacity
                  onPress={addCustomFeature}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowCustomFeatureInput(false);
                    setCustomFeature('');
                  }}
                  style={styles.cancelButton}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Etiketler Bölümü */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Etiketler ({selectedTags.length}/{maxTags})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            İlanınızı bulunabilir yapacak etiketler seçin
          </Text>
        </View>

        {/* Seçili Etiketler */}
        {selectedTags.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={[styles.selectedTitle, { color: colors.textSecondary }]}>
              Seçili Etiketler:
            </Text>
            <View style={styles.chipContainer}>
              {selectedTags.map((tagId) => (
                <View key={tagId} style={[styles.chip, { backgroundColor: colors.secondary }]}>
                  <Tag size={12} color={colors.white} style={styles.chipIcon} />
                  <Text style={[styles.chipText, { color: colors.white }]}>
                    {getTagName(tagId)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleTagToggle(tagId)}
                    style={styles.chipRemoveButton}
                  >
                    <X size={12} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* İlk 6 Etiket + Gör Butonu */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            {initialTags.map((tag: CategoryTag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => handleTagToggle(tag.id)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedTags.includes(tag.id) 
                      ? colors.secondary 
                      : colors.border,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Tag size={14} color={selectedTags.includes(tag.id) ? colors.white : colors.text} />
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: selectedTags.includes(tag.id) 
                        ? colors.white 
                        : colors.text,
                    }
                  ]}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Gör Butonu */}
            {config.tags.length > 6 && (
              <TouchableOpacity
                onPress={openTagsModal}
                style={[styles.viewMoreButton, { borderColor: colors.secondary }]}
              >
                <Text style={[styles.viewMoreText, { color: colors.secondary }]}>
                  Gör ({config.tags.length})
                </Text>
                <ChevronRight size={16} color={colors.secondary} />
              </TouchableOpacity>
            )}
            
            {/* Özel Etiket Ekleme */}
            {!showCustomTagInput ? (
              <TouchableOpacity
                onPress={() => setShowCustomTagInput(true)}
                style={[styles.addCustomButton, { borderColor: colors.secondary }]}
              >
                <Plus size={16} color={colors.secondary} />
                <Text style={[styles.addCustomText, { color: colors.secondary }]}>
                  Özel
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    }
                  ]}
                  value={customTag}
                  onChangeText={setCustomTag}
                  placeholder="Özel etiket ekle..."
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={addCustomTag}
                />
                <TouchableOpacity
                  onPress={addCustomTag}
                  style={[styles.addButton, { backgroundColor: colors.secondary }]}
                >
                  <Plus size={16} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowCustomTagInput(false);
                    setCustomTag('');
                  }}
                  style={styles.cancelButton}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Özellikler Modal */}
      <Modal
        visible={showFeaturesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Özellikler Seç ({tempSelectedFeatures.length}/{maxFeatures})
            </Text>
            <TouchableOpacity onPress={closeFeaturesModal} style={styles.modalCloseButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={config.features}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                  }
                ]}
                onPress={() => handleModalFeatureToggle(item.id)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    {
                      color: colors.text,
                    }
                  ]}
                >
                  {item.name}
                </Text>
                {tempSelectedFeatures.includes(item.id) && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
          
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={closeFeaturesModal}
            >
              <Text style={[styles.modalButtonText, { color: colors.white }]}>
                Tamam ({tempSelectedFeatures.length} seçili)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Etiketler Modal */}
      <Modal
        visible={showTagsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Etiketler Seç ({tempSelectedTags.length}/{maxTags})
            </Text>
            <TouchableOpacity onPress={closeTagsModal} style={styles.modalCloseButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={config.tags}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                  }
                ]}
                onPress={() => handleModalTagToggle(item.id)}
              >
                <Tag size={16} color={colors.text} />
                <Text
                  style={[
                    styles.modalItemText,
                    {
                      color: colors.text,
                    }
                  ]}
                >
                  {item.name}
                </Text>
                {tempSelectedTags.includes(item.id) && (
                  <Check size={20} color={colors.secondary} />
                )}
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
          
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.secondary }]}
              onPress={closeTagsModal}
            >
              <Text style={[styles.modalButtonText, { color: colors.white }]}>
                Tamam ({tempSelectedTags.length} seçili)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  noDataText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  selectedContainer: {
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipRemoveButton: {
    marginLeft: 4,
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addCustomText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    minWidth: 120,
  },
  addButton: {
    padding: 8,
    borderRadius: 16,
  },
  cancelButton: {
    padding: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 