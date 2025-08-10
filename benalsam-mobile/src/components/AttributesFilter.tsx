import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useThemeColors } from '../stores';
import { X, Search, Filter } from 'lucide-react-native';
import { getCategoryFeatures } from '../config/categoryFeatures';

interface AttributeValue {
  id: string;
  name: string;
  count?: number;
}

interface Attribute {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  values: AttributeValue[];
  required: boolean;
}

interface AttributesFilterProps {
  selectedCategory: string;
  selectedAttributes: Record<string, string[]>;
  onAttributesChange: (attributes: Record<string, string[]>) => void;
  showReset?: boolean;
  style?: any;
}

export const AttributesFilter: React.FC<AttributesFilterProps> = ({
  selectedCategory,
  selectedAttributes,
  onAttributesChange,
  showReset = true,
  style,
}) => {
  const colors = useThemeColors();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());

  // Load attributes for selected category
  useEffect(() => {
    if (selectedCategory) {
      const categoryFeatures = getCategoryFeatures(selectedCategory);
      if (categoryFeatures) {
        // Convert features to attributes format
        const convertedAttributes: Attribute[] = categoryFeatures.features.map((feature, index) => ({
          id: feature.id,
          name: feature.name,
          type: 'select',
          values: [
            { id: 'yes', name: 'Evet', count: 0 },
            { id: 'no', name: 'Hayır', count: 0 },
          ],
          required: false,
        }));
        setAttributes(convertedAttributes);
      } else {
        setAttributes([]);
      }
    } else {
      setAttributes([]);
    }
  }, [selectedCategory]);

  // Filter attributes based on search query
  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle attribute value selection
  const handleAttributeValueSelect = useCallback((attributeId: string, valueId: string) => {
    const currentValues = selectedAttributes[attributeId] || [];
    const newValues = currentValues.includes(valueId)
      ? currentValues.filter(v => v !== valueId)
      : [...currentValues, valueId];
    
    const newSelectedAttributes = {
      ...selectedAttributes,
      [attributeId]: newValues,
    };
    
    // Remove empty arrays
    if (newValues.length === 0) {
      delete newSelectedAttributes[attributeId];
    }
    
    onAttributesChange(newSelectedAttributes);
  }, [selectedAttributes, onAttributesChange]);

  // Toggle attribute expansion
  const toggleAttributeExpansion = useCallback((attributeId: string) => {
    const newExpanded = new Set(expandedAttributes);
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId);
    } else {
      newExpanded.add(attributeId);
    }
    setExpandedAttributes(newExpanded);
  }, [expandedAttributes]);

  // Reset all attributes
  const handleReset = useCallback(() => {
    onAttributesChange({});
    setExpandedAttributes(new Set());
    setSearchQuery('');
  }, [onAttributesChange]);

  // Check if attribute has selected values
  const hasSelectedValues = useCallback((attributeId: string) => {
    return selectedAttributes[attributeId] && selectedAttributes[attributeId].length > 0;
  }, [selectedAttributes]);

  // Get selected values count
  const getSelectedValuesCount = useCallback((attributeId: string) => {
    return selectedAttributes[attributeId]?.length || 0;
  }, [selectedAttributes]);

  // Get attribute value display name
  const getValueDisplayName = useCallback((valueId: string) => {
    switch (valueId) {
      case 'yes': return 'Evet';
      case 'no': return 'Hayır';
      default: return valueId;
    }
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Özellikler</Text>
        {showReset && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <X size={16} color={colors.primary} />
            <Text style={[styles.resetText, { color: colors.primary }]}>Sıfırla</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Özellik ara..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Attributes List */}
      <ScrollView style={styles.attributesList} showsVerticalScrollIndicator={false}>
        {filteredAttributes.map((attribute) => (
          <View
            key={attribute.id}
            style={[styles.attributeItem, { borderBottomColor: colors.border }]}
          >
            {/* Attribute Header */}
            <TouchableOpacity
              style={styles.attributeHeader}
              onPress={() => toggleAttributeExpansion(attribute.id)}
            >
              <View style={styles.attributeInfo}>
                <Filter size={16} color={colors.textSecondary} />
                <Text style={[styles.attributeName, { color: colors.text }]}>
                  {attribute.name}
                </Text>
                {hasSelectedValues(attribute.id) && (
                  <View style={[styles.selectedCount, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.selectedCountText, { color: colors.white }]}>
                      {getSelectedValuesCount(attribute.id)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                {expandedAttributes.has(attribute.id) ? '−' : '+'}
              </Text>
            </TouchableOpacity>

            {/* Attribute Values */}
            {expandedAttributes.has(attribute.id) && (
              <View style={styles.attributeValues}>
                {attribute.values.map((value) => (
                  <TouchableOpacity
                    key={value.id}
                    style={[
                      styles.valueChip,
                      {
                        backgroundColor: selectedAttributes[attribute.id]?.includes(value.id)
                          ? colors.primary + '20'
                          : colors.surface,
                        borderColor: selectedAttributes[attribute.id]?.includes(value.id)
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleAttributeValueSelect(attribute.id, value.id)}
                  >
                    <Text
                      style={[
                        styles.valueText,
                        {
                          color: selectedAttributes[attribute.id]?.includes(value.id)
                            ? colors.primary
                            : colors.text,
                          fontWeight: selectedAttributes[attribute.id]?.includes(value.id)
                            ? '600'
                            : '500',
                        },
                      ]}
                    >
                      {getValueDisplayName(value.id)}
                    </Text>
                    {value.count !== undefined && (
                      <Text style={[styles.valueCount, { color: colors.textSecondary }]}>
                        ({value.count})
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {filteredAttributes.length === 0 && (
          <View style={styles.emptyState}>
            <Filter size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Özellik bulunamadı' : 'Bu kategori için özellik bulunmuyor'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Selected Attributes Summary */}
      {Object.keys(selectedAttributes).length > 0 && (
        <View style={styles.selectedAttributesContainer}>
          <Text style={[styles.selectedTitle, { color: colors.textSecondary }]}>
            Seçili Özellikler ({Object.keys(selectedAttributes).length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(selectedAttributes).map(([attributeId, values]) => {
              const attribute = attributes.find(attr => attr.id === attributeId);
              if (!attribute) return null;

              return values.map((valueId, index) => (
                <View
                  key={`${attributeId}-${valueId}`}
                  style={[styles.selectedAttributeChip, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.selectedAttributeText, { color: colors.primary }]}>
                    {attribute.name}: {getValueDisplayName(valueId)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleAttributeValueSelect(attributeId, valueId)}
                  >
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ));
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 14,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  attributesList: {
    flex: 1,
  },
  attributeItem: {
    borderBottomWidth: 1,
  },
  attributeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  attributeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attributeName: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedCount: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  attributeValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 12,
    gap: 8,
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  valueText: {
    fontSize: 14,
  },
  valueCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  selectedAttributesContainer: {
    marginTop: 16,
  },
  selectedTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  selectedAttributeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedAttributeText: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: '500',
  },
}); 