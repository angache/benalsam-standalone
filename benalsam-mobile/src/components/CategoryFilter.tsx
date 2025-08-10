import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useThemeColors } from '../stores';
import { ChevronRight, X, Tag } from 'lucide-react-native';
import { categoriesConfig } from '../config/categories-with-attributes';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  showReset?: boolean;
  multiSelect?: boolean;
  style?: any;
}

interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  path: string;
  level: number;
  hasChildren: boolean;
  parentPath?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoriesChange,
  showReset = true,
  multiSelect = false,
  style,
}) => {
  const colors = useThemeColors();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // Flatten categories into a list with hierarchy info
  const flattenCategories = useCallback((categories: any[], parentPath: string[] = []): CategoryItem[] => {
    let result: CategoryItem[] = [];
    
    categories.forEach((category, index) => {
      const currentPath = [...parentPath, category.name];
      const pathString = currentPath.join(' > ');
      
      result.push({
        id: category.id || `category-${index}`,
        name: category.name,
        icon: category.icon,
        path: pathString,
        level: parentPath.length,
        hasChildren: !!(category.subcategories && category.subcategories.length > 0),
        parentPath: parentPath.length > 0 ? parentPath.join(' > ') : undefined,
      });
      
      if (category.subcategories && category.subcategories.length > 0) {
        result = result.concat(flattenCategories(category.subcategories, currentPath));
      }
    });
    
    return result;
  }, []);

  const allCategories = flattenCategories(categoriesConfig);

  // Filter categories based on current path
  const getVisibleCategories = useCallback(() => {
    if (currentPath.length === 0) {
      return allCategories.filter(cat => cat.level === 0);
    }
    
    const currentPathString = currentPath.join(' > ');
    return allCategories.filter(cat => 
      cat.parentPath === currentPathString || 
      (cat.level === currentPath.length && cat.path.startsWith(currentPathString))
    );
  }, [allCategories, currentPath]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: CategoryItem) => {
    if (category.hasChildren) {
      // Expand/collapse category
      const newExpanded = new Set(expandedCategories);
      if (newExpanded.has(category.path)) {
        newExpanded.delete(category.path);
      } else {
        newExpanded.add(category.path);
      }
      setExpandedCategories(newExpanded);
      
      // Navigate to subcategory level
      setCurrentPath(category.path.split(' > '));
    } else {
      // Select/deselect category
      if (multiSelect) {
        const newSelection = selectedCategories.includes(category.path)
          ? selectedCategories.filter(cat => cat !== category.path)
          : [...selectedCategories, category.path];
        onCategoriesChange(newSelection);
      } else {
        onCategoriesChange([category.path]);
      }
    }
  }, [selectedCategories, onCategoriesChange, multiSelect, expandedCategories]);

  // Navigate back
  const goBack = useCallback(() => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  }, [currentPath]);

  // Reset selection
  const handleReset = useCallback(() => {
    onCategoriesChange([]);
    setExpandedCategories(new Set());
    setCurrentPath([]);
  }, [onCategoriesChange]);

  // Get category icon
  const getCategoryIcon = useCallback((category: CategoryItem) => {
    if (category.icon) {
      return category.icon;
    }
    
    // Default icons based on category name
    const name = category.name.toLowerCase();
    if (name.includes('elektronik') || name.includes('telefon')) return '📱';
    if (name.includes('moda') || name.includes('giyim')) return '👕';
    if (name.includes('ev') || name.includes('mobilya')) return '🏠';
    if (name.includes('araç') || name.includes('otomobil')) return '🚗';
    if (name.includes('spor')) return '⚽';
    if (name.includes('kitap')) return '📚';
    if (name.includes('oyun')) return '🎮';
    if (name.includes('müzik')) return '🎵';
    
    return '🏷️';
  }, []);

  // Check if category is selected
  const isCategorySelected = useCallback((category: CategoryItem) => {
    return selectedCategories.includes(category.path);
  }, [selectedCategories]);

  // Get breadcrumb text
  const getBreadcrumbText = useCallback(() => {
    if (currentPath.length === 0) return 'Ana Kategoriler';
    return currentPath.join(' > ');
  }, [currentPath]);

  const visibleCategories = getVisibleCategories();

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Kategori</Text>
        {showReset && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <X size={16} color={colors.primary} />
            <Text style={[styles.resetText, { color: colors.primary }]}>Sıfırla</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Breadcrumb */}
      {currentPath.length > 0 && (
        <TouchableOpacity style={styles.breadcrumb} onPress={goBack}>
          <Text style={[styles.breadcrumbText, { color: colors.primary }]}>
            ← {getBreadcrumbText()}
          </Text>
        </TouchableOpacity>
      )}

      {/* Category List */}
      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {visibleCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              {
                borderBottomColor: colors.border,
                backgroundColor: isCategorySelected(category) 
                  ? colors.primary + '20' 
                  : 'transparent',
              },
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <View style={styles.categoryContent}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
              <View style={styles.categoryInfo}>
                <Text style={[
                  styles.categoryName,
                  { 
                    color: isCategorySelected(category) ? colors.primary : colors.text,
                    fontWeight: isCategorySelected(category) ? '600' : '500',
                  },
                ]}>
                  {category.name}
                </Text>
                {category.hasChildren && (
                  <Text style={[styles.categorySubtext, { color: colors.textSecondary }]}>
                    Alt kategoriler
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.categoryActions}>
              {isCategorySelected(category) && !category.hasChildren && (
                <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
              )}
              {category.hasChildren && (
                <ChevronRight size={16} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
        
        {visibleCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Tag size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Kategori bulunamadı
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <View style={styles.selectedCategoriesContainer}>
          <Text style={[styles.selectedTitle, { color: colors.textSecondary }]}>
            Seçili Kategoriler ({selectedCategories.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCategories.map((categoryPath, index) => (
              <View
                key={index}
                style={[styles.selectedCategoryChip, { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.selectedCategoryText, { color: colors.primary }]}>
                  {categoryPath.split(' > ').pop()}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newSelection = selectedCategories.filter((_, i) => i !== index);
                    onCategoriesChange(newSelection);
                  }}
                >
                  <X size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
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
  breadcrumb: {
    marginBottom: 16,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    marginBottom: 2,
  },
  categorySubtext: {
    fontSize: 12,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  selectedCategoriesContainer: {
    marginTop: 16,
  },
  selectedTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  selectedCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedCategoryText: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: '500',
  },
}); 