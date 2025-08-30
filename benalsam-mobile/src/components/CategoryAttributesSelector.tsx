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

// Dinamik kategori sistemi
import { useCategoryAttributes } from '../hooks/queries/useCategories';

interface CategoryAttribute {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'multiselect';
  required: boolean;
  options?: string[];
}

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
  
  // Dinamik kategori attribute'larını yükle
  const { data: categoryAttributes = [], isLoading: attributesLoading, error: attributesError } = useCategoryAttributes(categoryPath);

  // Kategori yükleme log'ları
  useEffect(() => {
    if (attributesLoading) {
      console.log('🔄 [CategoryAttributesSelector] Kategori attribute\'ları yükleniyor...');
    } else if (attributesError) {
      console.error('❌ [CategoryAttributesSelector] Kategori attribute\'ları yükleme hatası:', attributesError);
    } else if (categoryAttributes) {
      console.log(`✅ [CategoryAttributesSelector] ${categoryAttributes.length} attribute yüklendi:`, categoryAttributes.map((attr: CategoryAttribute) => attr.label));
    }
  }, [categoryAttributes, attributesLoading, attributesError]);

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

  // Parse options helper function
  const parseOptions = (options: any): string[] => {
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch (error) {
        console.error('Error parsing options:', error);
        return [];
      }
    } else if (Array.isArray(options)) {
      return options;
    }
    return [];
  };

  if (attributesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  if (attributesError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.error }]}>
          Hata: {attributesError.message}
        </Text>
      </View>
    );
  }

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
            Kategori Özellikleri
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            İlanınızın özelliklerini seçin
          </Text>
        </View>

        {/* Attribute Listesi */}
        <View style={styles.attributesContainer}>
          {categoryAttributes.map((attribute: CategoryAttribute) => (
            <View key={attribute.key} style={styles.attributeSection}>
              <View style={styles.attributeHeader}>
                <View style={styles.attributeInfo}>
                  <Text style={[styles.attributeLabel, { color: colors.text }]}>
                    {attribute.label}
                  </Text>
                  {attribute.required && (
                    <Text style={[styles.requiredText, { color: colors.error }]}>
                      *
                    </Text>
                  )}
                </View>
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
                {parseOptions(attribute.options).map((option: string) => {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attributeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attributeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  requiredText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 