import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  X, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  Check
} from 'lucide-react-native';
import { useThemeColors } from '../stores';

// Dinamik kategori sistemi
import { useCategories } from '../hooks/queries/useCategories';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Category {
  name: string;
  subcategories?: any[];
}

interface SearchableCategorySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mainCategory: string, subCategory?: string, subSubCategory?: string) => void;
  selectedMainCategory?: string;
  selectedSubCategory?: string;
  selectedSubSubCategory?: string;
  title?: string;
}

export const SearchableCategorySelector: React.FC<SearchableCategorySelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedMainCategory = '',
  selectedSubCategory = '',
  selectedSubSubCategory = '',
  title = 'Kategori Seçin',
}) => {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'main' | 'sub' | 'subsub'>('main');
  const [selectedMain, setSelectedMain] = useState(selectedMainCategory);
  const [selectedSub, setSelectedSub] = useState(selectedSubCategory);
  const [selectedSubSub, setSelectedSubSub] = useState(selectedSubSubCategory);
  
  // Dinamik kategori yükleme
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Kategori yükleme log'ları
  React.useEffect(() => {
    if (categoriesLoading) {
      console.log('🔄 [SearchableCategorySelector] Kategoriler yükleniyor...');
    } else if (categoriesError) {
      console.error('❌ [SearchableCategorySelector] Kategori yükleme hatası:', categoriesError);
    } else if (categories) {
      console.log(`✅ [SearchableCategorySelector] ${categories.length} kategori yüklendi:`, categories.map(cat => cat.name));
    }
  }, [categories, categoriesLoading, categoriesError]);

  // Search functionality
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase().trim();
    return categories.filter(category => {
      // Search in main category
      if (category.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search in subcategories
      return category.subcategories?.some((sub: any) => {
        if (sub.name.toLowerCase().includes(query)) {
          return true;
        }
        // Search in sub-subcategories
        return sub.subcategories?.some((subSub: any) =>
          subSub.name.toLowerCase().includes(query)
        );
      });
    });
  }, [searchQuery, categories]);

  // Get current main category data
  const currentMainCategory = categories?.find(cat => cat.name === selectedMain);
  const currentSubCategory = currentMainCategory?.subcategories?.find((sub: any) => sub.name === selectedSub);

  const handleMainCategorySelect = (categoryName: string) => {
    setSelectedMain(categoryName);
    setSelectedSub('');
    setSelectedSubSub('');
    
    const category = categories?.find(cat => cat.name === categoryName);
    if ((category as any)?.subcategories && (category as any).subcategories.length > 0) {
      setCurrentLevel('sub');
    } else {
      // No subcategories, select this category directly
      onSelect(categoryName);
      handleClose();
    }
  };

  const handleSubCategorySelect = (subCategoryName: string) => {
    setSelectedSub(subCategoryName);
    setSelectedSubSub('');
    
    const subCategory = currentMainCategory?.subcategories?.find((sub: any) => sub.name === subCategoryName);
    if ((subCategory as any)?.subcategories && (subCategory as any).subcategories.length > 0) {
      setCurrentLevel('subsub');
    } else {
      // No sub-subcategories, select this category
      onSelect(selectedMain, subCategoryName);
      handleClose();
    }
  };

  const handleSubSubCategorySelect = (subSubCategoryName: string) => {
    setSelectedSubSub(subSubCategoryName);
    onSelect(selectedMain, selectedSub, subSubCategoryName);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setCurrentLevel('main');
    setSelectedMain(selectedMainCategory);
    setSelectedSub(selectedSubCategory);
    setSelectedSubSub(selectedSubSubCategory);
    onClose();
  };

  const goBack = () => {
    if (currentLevel === 'subsub') {
      setCurrentLevel('sub');
      setSelectedSubSub('');
    } else if (currentLevel === 'sub') {
      setCurrentLevel('main');
      setSelectedSub('');
    }
  };

  const renderSearchHeader = () => (
    <LinearGradient
      colors={['#3B82F6', '#6366F1']}
      style={[styles.searchHeader, { borderBottomColor: colors.border }]}
    >
      <View style={styles.headerTop}>
        {currentLevel !== 'main' ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
        ) : null}
        
        <Text style={[styles.headerTitle, { color: "white" }]}>
          {currentLevel === 'main' ? title :
           currentLevel === 'sub' ? selectedMain :
           `${selectedSub}`}
        </Text>
        
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color="white" />
        </TouchableOpacity>
      </View>

      {currentLevel === 'main' && (
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'transparent' }]}>
          <Search size={20} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Kategori ara..."
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
      )}
    </LinearGradient>
  );

  const renderMainCategories = () => {
    if (categoriesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Kategoriler yükleniyor...
          </Text>
        </View>
      );
    }
    
    if (categoriesError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Kategoriler yüklenemedi
          </Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
        const hasSubcategories = (item as any).subcategories && (item as any).subcategories.length > 0;
        const isSelected = selectedMain === item.name;
        
        return (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              { 
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderBottomColor: colors.border
              }
            ]}
            onPress={() => handleMainCategorySelect(item.name)}
          >
            <View style={styles.categoryContent}>
              <View style={styles.categoryInfo}>
                <Text style={[
                  styles.categoryName,
                  { 
                    color: isSelected ? colors.white : colors.text,
                    fontWeight: isSelected ? '700' : '400'
                  }
                ]}>
                  {item.name}
                </Text>
                {hasSubcategories && (
                  <Text style={[styles.subcategoryCount, { color: isSelected ? colors.white + 'CC' : colors.textSecondary }]}>
                    {(item as any).subcategories.length} alt kategori
                  </Text>
                )}
              </View>
              
              <View style={styles.categoryActions}>
                {isSelected && (
                  <Check size={20} color={colors.white} />
                )}
                {hasSubcategories && (
                  <ChevronRight size={20} color={isSelected ? colors.white : colors.textSecondary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
    );
  };

  const renderSubCategories = () => {
    if (!(currentMainCategory as any)?.subcategories) return null;

    return (
      <FlatList
        data={(currentMainCategory as any).subcategories}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          const hasSubcategories = (item as any).subcategories && (item as any).subcategories.length > 0;
          const isSelected = selectedSub === item.name;
          
          return (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderBottomColor: colors.border
                }
              ]}
              onPress={() => handleSubCategorySelect(item.name)}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryInfo}>
                  <Text style={[
                    styles.categoryName,
                    { 
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {item.name}
                  </Text>
                  {hasSubcategories && (
                    <Text style={[styles.subcategoryCount, { color: colors.textSecondary }]}>
                      {(item as any).subcategories.length} detay kategori
                    </Text>
                  )}
                </View>
                
                <View style={styles.categoryActions}>
                  {isSelected && (
                    <Check size={20} color={colors.primary} />
                  )}
                  {hasSubcategories && (
                    <ChevronRight size={20} color={colors.textSecondary} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderSubSubCategories = () => {
    if (!currentSubCategory || !('subcategories' in currentSubCategory) || !currentSubCategory.subcategories) return null;

    return (
      <FlatList
        data={currentSubCategory.subcategories}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          const isSelected = selectedSubSub === item.name;
          
          return (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderBottomColor: colors.border
                }
              ]}
              onPress={() => handleSubSubCategorySelect(item.name)}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryInfo}>
                  <Text style={[
                    styles.categoryName,
                    { 
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {item.name}
                  </Text>
                </View>
                
                <View style={styles.categoryActions}>
                  {isSelected && (
                    <Check size={20} color={colors.primary} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        
        {renderSearchHeader()}
        
        <View style={styles.content}>
          {currentLevel === 'main' && renderMainCategories()}
          {currentLevel === 'sub' && renderSubCategories()}
          {currentLevel === 'subsub' && renderSubSubCategories()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  categoryItem: {
    borderBottomWidth: 1,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    marginBottom: 2,
  },
  subcategoryCount: {
    fontSize: 12,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
  },
});

export default SearchableCategorySelector; 