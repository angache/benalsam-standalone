import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { CategoryMatch, CategorySuggestion } from '../services/categoryMatcher';
import { useThemeColors } from '../stores';

interface CategorySuggestionCardProps {
  suggestion: CategorySuggestion;
  onSelectCategory: (category: CategoryMatch) => void;
  selectedCategory?: CategoryMatch;
}

export const CategorySuggestionCard: React.FC<CategorySuggestionCardProps> = ({
  suggestion,
  onSelectCategory,
  selectedCategory
}) => {
  const colors = useThemeColors();

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.warning;
    return colors.error;
  };

  const renderCategoryItem = (category: CategoryMatch, isPrimary: boolean = false) => {
    const isSelected = selectedCategory?.categoryPath === category.categoryPath;
    
    return (
      <TouchableOpacity
        key={category.categoryPath}
        onPress={() => onSelectCategory(category)}
        style={[
          styles.categoryItem,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
          }
        ]}
      >
        <View style={styles.categoryItemContent}>
          <View style={styles.categoryItemLeft}>
            <View style={styles.categoryItemHeader}>
              {isPrimary && (
                <Badge 
                  label="AI Önerisi" 
                  variant="primary" 
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={[
                styles.categoryItemText,
                { color: isSelected ? colors.primary : colors.text }
              ]}>
                {category.categoryPath}
              </Text>
            </View>
            
            <View style={styles.confidenceContainer}>
              <View style={[
                styles.confidenceDot,
                { backgroundColor: getConfidenceColor(category.confidence) }
              ]} />
              <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                Güven: {formatConfidence(category.confidence)}
              </Text>
            </View>
          </View>
          
          {isSelected && (
            <View style={styles.selectedIcon}>
              <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Kategori Önerisi
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          AI, ilanınız için en uygun kategoriyi seçti. İsterseniz değiştirebilirsiniz.
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ana öneri */}
        {renderCategoryItem(suggestion.primary, true)}
        
        {/* Alternatif öneriler */}
        {suggestion.alternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={[styles.alternativesTitle, { color: colors.textSecondary }]}>
              Alternatif Kategoriler:
            </Text>
            {suggestion.alternatives.map((category) => 
              renderCategoryItem(category, false)
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Seçilen kategori ilanınızın doğru kişilere ulaşmasını sağlar
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  scrollView: {
    maxHeight: 320,
  },
  alternativesSection: {
    marginTop: 12,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryItem: {
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryItemLeft: {
    flex: 1,
  },
  categoryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
  },
  selectedIcon: {
    marginLeft: 8,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 