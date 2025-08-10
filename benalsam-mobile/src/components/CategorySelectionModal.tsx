import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '../stores/themeStore';
import { Home, ChevronRight, Search, X } from 'lucide-react-native';
import { categoriesConfig } from '../config/categories-with-attributes';

interface CategorySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelect: (categoryPath: string[]) => void;
  currentCategory?: string;
}

interface CategoryItem {
  name: string;
  icon?: any;
  path: string[];
  hasSubcategories: boolean;
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({
  visible,
  onClose,
  onCategorySelect,
  currentCategory
}) => {
  const colors = useThemeColors();
  const [path, setPath] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Şu anki seviyedeki kategoriler
  const getCurrentCategories = (): CategoryItem[] => {
    let categories: any[] = categoriesConfig as any[];
    
    // Path'e göre alt kategorilere in
    for (const pathItem of path) {
      const found = categories.find((cat: any) => cat.name === pathItem);
      if (found && found.subcategories) {
        categories = found.subcategories;
      } else {
        break;
      }
    }

    // Leaf kategorileri (attributes alanı olan) ve klasörleri ayır
    const leafCategories: CategoryItem[] = [];
    const folderCategories: CategoryItem[] = [];

    categories.forEach((cat: any) => {
      const hasSubcategories = !!(cat.subcategories && cat.subcategories.length > 0);
      const hasAttributes = !!(cat.attributes && cat.attributes.length > 0);
      
      const categoryItem = {
        name: cat.name,
        icon: cat.icon,
        path: [...path, cat.name],
        hasSubcategories: hasSubcategories
      };

      if (hasAttributes) {
        // Attributes varsa leaf kategori
        leafCategories.push(categoryItem);
      } else if (hasSubcategories) {
        // Alt kategoriler varsa klasör
        folderCategories.push(categoryItem);
      } else {
        // Ne attributes ne de subcategories varsa leaf kategori
        leafCategories.push(categoryItem);
      }
    });

    // Önce klasörleri, sonra leaf kategorileri göster
    return [...folderCategories, ...leafCategories];
  };

  // Arama sonuçları - sadece leaf kategorileri
  const getSearchResults = (): CategoryItem[] => {
    if (!search.trim()) return [];
    
    const results: CategoryItem[] = [];
    const searchTerm = search.toLowerCase();
    
    const searchInCategories = (categories: any[], currentPath: string[] = []) => {
      for (const cat of categories) {
        const hasSubcategories = !!(cat.subcategories && cat.subcategories.length > 0);
        const hasAttributes = !!(cat.attributes && cat.attributes.length > 0);
        
        // Sadece leaf kategorileri (attributes alanı olan) arama sonuçlarına ekle
        if (cat.name.toLowerCase().includes(searchTerm) && hasAttributes) {
          results.push({
            name: cat.name,
            icon: cat.icon,
            path: [...currentPath, cat.name],
            hasSubcategories: false
          });
        }
        
        // Alt kategorilerde aramaya devam et
        if (cat.subcategories) {
          searchInCategories(cat.subcategories, [...currentPath, cat.name]);
        }
      }
    };
    
    searchInCategories(categoriesConfig);
    return results;
  };

  const handleCategoryPress = (category: CategoryItem) => {
    if (category.hasSubcategories) {
      // Alt kategorileri aç
      setPath(category.path);
      setSearch('');
      setIsSearching(false);
    } else {
      // Sadece leaf kategorileri seçilebilir
      onCategorySelect(category.path);
      onClose();
    }
  };

  const handleBreadcrumbPress = (index: number) => {
    setPath(path.slice(0, index + 1));
    setSearch('');
    setIsSearching(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setIsSearching(text.trim().length > 0);
  };

  const handleBack = () => {
    if (path.length > 0) {
      setPath(path.slice(0, -1));
      setSearch('');
      setIsSearching(false);
    } else {
      onClose();
    }
  };

  const currentCategories = isSearching ? getSearchResults() : getCurrentCategories();
  
  // Debug log
  console.log('🔍 CategorySelectionModal - Path:', path);
  console.log('🔍 CategorySelectionModal - IsSearching:', isSearching);
  console.log('🔍 CategorySelectionModal - Categories found:', currentCategories.length);
  console.log('🔍 CategorySelectionModal - Categories:', currentCategories.map(cat => ({
    name: cat.name,
    hasSubcategories: cat.hasSubcategories,
    path: cat.path.join(' > ')
  })));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            {path.length > 0 ? (
              <ChevronRight size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <X size={24} color={colors.text} />
            )}
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isSearching ? 'Kategori Ara' : 'Kategori Seç'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={handleSearch}
            placeholder="Kategori ara..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Breadcrumb */}
        {!isSearching && path.length > 0 && (
          <View style={styles.breadcrumbContainer}>
            <TouchableOpacity onPress={() => { setPath([]); setSearch(''); }}>
              <Home size={16} color={colors.primary} />
            </TouchableOpacity>
            {path.map((p, idx) => (
              <View key={p} style={styles.breadcrumbItem}>
                <ChevronRight size={14} color={colors.textSecondary} />
                <TouchableOpacity onPress={() => handleBreadcrumbPress(idx)}>
                  <Text style={[styles.breadcrumbText, { color: colors.primary }]}>{p}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Current Category Display */}
        {currentCategory && !isSearching && path.length === 0 && (
          <View style={[styles.currentCategoryContainer, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.currentCategoryText, { color: colors.primary }]}>
              Mevcut Kategori: {currentCategory}
            </Text>
          </View>
        )}

        {/* Categories List */}
        <FlatList
          data={currentCategories}
          keyExtractor={(item) => item.path.join('>')}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem, 
                { 
                  backgroundColor: colors.surface, 
                  borderBottomColor: colors.border,
                  opacity: item.hasSubcategories ? 0.7 : 1
                }
              ]}
              onPress={() => handleCategoryPress(item)}
            >
              <View style={styles.categoryContent}>
                {item.icon && (
                  <View style={styles.categoryIcon}>
                    <item.icon size={24} color={colors.primary} />
                  </View>
                )}
                <View style={styles.categoryInfo}>
                  <Text style={[
                    styles.categoryName, 
                    { 
                      color: item.hasSubcategories ? colors.textSecondary : colors.text,
                      fontWeight: item.hasSubcategories ? '400' : '600'
                    }
                  ]}>
                    {item.name}
                    {item.hasSubcategories && ' (Klasör)'}
                  </Text>
                  <Text style={[styles.categoryPath, { color: colors.textSecondary }]}>
                    {item.path.join(' > ')}
                  </Text>
                </View>
              </View>
              {item.hasSubcategories && (
                <ChevronRight size={20} color={colors.textSecondary} />
              )}
              {!item.hasSubcategories && (
                <View style={[styles.selectableIndicator, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.selectableIndicatorText, { color: colors.white }]}>
                    Seç
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />

        {/* Empty State */}
        {isSearching && currentCategories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              "{search}" için sonuç bulunamadı
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Farklı anahtar kelimelerle aramayı deneyin
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  currentCategoryContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentCategoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryPath: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectableIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  selectableIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CategorySelectionModal; 