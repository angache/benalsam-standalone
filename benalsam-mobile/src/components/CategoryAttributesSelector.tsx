import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useThemeColors } from '../stores/themeStore';
import { findCategoryAttributes, CategoryAttribute } from '../config/categories-with-attributes';



interface CategoryAttributesSelectorProps {
  categoryPath: string;
  selectedAttributes: Record<string, string[]>;
  onAttributesChange: (attributes: Record<string, string[]>) => void;
  maxSelectionsPerAttribute?: number;
}

export default function CategoryAttributesSelector({
  categoryPath,
  selectedAttributes,
  onAttributesChange,
  maxSelectionsPerAttribute = 5,
}: CategoryAttributesSelectorProps) {
  const colors = useThemeColors();
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);

  useEffect(() => {
    loadCategoryAttributes();
  }, [categoryPath]);

  const loadCategoryAttributes = async () => {
    try {
      console.log('🔍 CategoryAttributesSelector - Loading attributes for path:', categoryPath);
      // Kategori attribute'larını yükle
      const attributes = findCategoryAttributes(categoryPath);
      console.log('📋 Loaded category attributes for path:', categoryPath, attributes);
      
      if (attributes && attributes.length > 0) {
        console.log('✅ Found attributes:', attributes.length, 'attributes');
        setCategoryAttributes(attributes);
      } else {
        console.log('❌ No attributes found for category path:', categoryPath);
        setCategoryAttributes([]);
      }
    } catch (error) {
      console.error('❌ Error loading category attributes:', error);
      setCategoryAttributes([]);
    }
  };



  const handleOptionToggle = (attributeKey: string, option: string) => {
    const currentSelected = selectedAttributes[attributeKey] || [];
    
    if (currentSelected.includes(option)) {
      // Seçimi kaldır
      const newSelected = currentSelected.filter(opt => opt !== option);
      onAttributesChange({
        ...selectedAttributes,
        [attributeKey]: newSelected
      });
    } else {
      // Seçimi ekle
      if (currentSelected.length >= maxSelectionsPerAttribute) {
        Alert.alert(
          'Maksimum Seçim',
          `Bu özellik için en fazla ${maxSelectionsPerAttribute} seçenek seçebilirsiniz.`
        );
        return;
      }
      const newSelected = [...currentSelected, option];
      onAttributesChange({
        ...selectedAttributes,
        [attributeKey]: newSelected
      });
    }
  };

  const getSelectedCount = (attributeKey: string): number => {
    return selectedAttributes[attributeKey]?.length || 0;
  };

  const getSelectedText = (attributeKey: string): string => {
    const selected = selectedAttributes[attributeKey] || [];
    if (selected.length === 0) return 'Seçiniz';
    if (selected.length === 1) return selected[0];
    return `${selected.length} seçenek`;
  };

  console.log('🔍 CategoryAttributesSelector - Rendering with', categoryAttributes.length, 'attributes');
  
  if (categoryAttributes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          Bu kategori için özellik tanımları bulunamadı.
        </Text>
        <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
          Kategori: {categoryPath}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ürün Özellikleri
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Aradığınız ürünün özelliklerini seçin (çoklu seçim)
          </Text>
        </View>

        {/* Attribute Listesi */}
        <View style={styles.attributesContainer}>
          {categoryAttributes.map((attribute) => (
            <View key={attribute.key} style={styles.attributeSection}>
              <View style={styles.attributeHeader}>
                <Text style={[styles.attributeLabel, { color: colors.text }]}>
                  {attribute.label}
                </Text>
                {attribute.required && (
                  <Text style={[styles.requiredBadge, { color: colors.error }]}>
                    *
                  </Text>
                )}
                {getSelectedCount(attribute.key) > 0 && (
                  <View style={[styles.selectionBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.selectionBadgeText, { color: colors.white }]}>
                      {getSelectedCount(attribute.key)}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Chip Seçenekleri */}
              <View style={styles.chipContainer}>
                {attribute.options?.map((option) => {
                  const isSelected = selectedAttributes[attribute.key]?.includes(option) || false;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }
                      ]}
                      onPress={() => handleOptionToggle(attribute.key, option)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? colors.white : colors.text,
                            fontWeight: isSelected ? '600' : '500',
                          }
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Seçili Özellikler Özeti */}
        {/* KALDIRILDI: AI oluşturucu ekranda özet gösterilmeyecek */}
        {/* {Object.keys(selectedAttributes).some(key => selectedAttributes[key]?.length > 0) && (
          <View style={styles.selectedSummary}>
            <Text style={[styles.selectedSummaryTitle, { color: colors.textSecondary }]}>Seçili Özellikler:</Text>
            <View style={styles.selectedSummaryContent}>
              {Object.entries(selectedAttributes).map(([key, values]) => {
                if (values.length === 0) return null;
                const attribute = categoryAttributes.find(attr => attr.key === key);
                return (
                  <View key={key} style={styles.selectedSummaryItem}>
                    <Text style={[styles.selectedSummaryLabel, { color: colors.text }]}>
                      {attribute?.label}:
                    </Text>
                    <Text style={[styles.selectedSummaryValues, { color: colors.primary }]}> {values.join(', ')} </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )} */}
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  attributesContainer: {
    gap: 16,
  },
  attributeSection: {
    marginBottom: 20,
  },
  attributeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attributeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  requiredBadge: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  attributeValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributeValueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedSummary: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  selectedSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedSummaryContent: {
    gap: 8,
  },
  selectedSummaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectedSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 80,
  },
  selectedSummaryValues: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // Chip styles
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },

}); 