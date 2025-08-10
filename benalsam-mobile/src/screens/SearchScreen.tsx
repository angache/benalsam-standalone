import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Filter,
  X,
  ChevronDown,
  TrendingUp,
  ArrowLeft,
  Grid3X3,
  List,
  SlidersHorizontal
} from "lucide-react-native";
import { useThemeColors } from "../stores";
import { useAuthStore } from "../stores";
import {
  SearchBar,
  ListingCard,
  LoadingSpinner,
  Card,
  Button,
  FilterBottomSheet,
  SearchResults,
  SortOptions,
  ListingListItem,
  PopularSearches,
  VirtualizedResults,
} from "../components";
import { supabase } from "../services/supabaseClient";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { useElasticsearchSearch } from "../hooks/useElasticsearchSearch";
// import SearchAnalytics from "../services/SearchAnalytics";
import SearchCache from "../services/SearchCache";



const SORT_OPTIONS = [
  { label: "En Yeni", value: "created_at-desc" },
  { label: "En Eski", value: "created_at-asc" },
  { label: "Fiyat: Düşük → Yüksek", value: "price-asc" },
  { label: "Fiyat: Yüksek → Düşük", value: "price-desc" },
];

const SearchScreen = ({ navigation, route }: any) => {
  const colors = useThemeColors();
  const { user } = useAuthStore();

  // Route params'dan query'yi al
  const initialQuery = route.params?.query || '';

  // Basit state management
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSort, setSelectedSort] = useState('created_at-desc');

  // Debounced search hook - Loop sorunu nedeniyle devre dışı
  // const {
  //   results: debouncedResults,
  //   isLoading: debouncedLoading,
  //   error: debouncedError,
  //   searchQuery: debouncedQuery,
  //   setSearchQuery: setDebouncedQuery,
  //   totalCount: debouncedTotalCount,
  //   searchDuration,
  //   clearResults: clearDebouncedResults,
  //   refreshSearch: refreshDebouncedSearch,
  // } = useDebouncedSearch({
  //   debounceMs: 800,
  //   minQueryLength: 3,
  //   maxResults: 50,
  //   enablePerformanceMonitoring: false,
  //   onSearchStart: () => {
  //     if (__DEV__) {
  //       console.log('🔍 Debounced search started');
  //     }
  //   },
  //   onSearchComplete: (results, duration) => {
  //     if (__DEV__) {
  //       console.log(`🔍 Debounced search completed: ${results.length} results in ${duration}ms`);
  //     }
  //     if (results.length > 0) {
  //       setResults(results);
  //       setTotalCount(results.length);
  //     }
  //   },
  //   onSearchError: (error) => {
  //     if (__DEV__) {
  //       console.error('🔍 Debounced search error:', error);
  //     }
  //   },
  // });

  // React Query ile Elasticsearch search
  const searchParams = {
    query: searchQuery,
    filters: {
      categories: selectedCategories,
    },
    sort: {
      field: selectedSort.split('-')[0],
      order: selectedSort.split('-')[1] as 'asc' | 'desc',
    },
    limit: 20,
  };

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useElasticsearchSearch(searchParams, {
    enabled: !!searchQuery.trim(), // Query varsa otomatik tetikle
  });

  // React Query search data'yı kullan
  const displayResults = searchData?.results || results;
  const displayLoading = searchLoading || isLoading;
  const displayTotalCount = searchData?.total || totalCount;

  // Manuel arama fonksiyonu (eski sistem - fallback)
  const performSearch = useCallback(async (query?: string, categories?: string[]) => {
    const searchText = query || searchQuery;
    const searchCategories = categories || selectedCategories;
    
    // console.log('🔍 performSearch called with:', { query: searchText, categories: searchCategories });
    
    if (!searchText.trim() && searchCategories.length === 0) {
      console.log('🔍 No search text and no categories, clearing results');
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const searchStartTime = Date.now();
    
    try {
      // Check cache first
      const cachedResults = await SearchCache.getInstance().getCachedSearchResults(searchText);
      if (cachedResults && cachedResults.length > 0) {
        if (__DEV__) {
          console.log('💾 Using cached results');
        }
        setResults(cachedResults);
        setTotalCount(cachedResults.length);
        setIsLoading(false);
        return;
      }

      let query = supabase.from('listings').select('*');
      
      if (searchText.trim()) {
        query = query.or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`);
      }
      
      if (searchCategories.length > 0) {
        // Çoklu kategori filtresi
        const categoryValues = searchCategories.map(cat => findCategoryValue(cat));
        // console.log('🔍 Category filter values:', categoryValues);
        query = query.in('category', categoryValues);
      }
      
      // Sıralama uygula
      const [sortField, sortOrder] = selectedSort.split('-');
      
      if (sortField && sortOrder) {
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) {
        console.error('🔍 Search error:', error);
        setResults([]);
        setTotalCount(0);
        
        // Track error - Şimdilik devre dışı
        // await SearchAnalytics.getInstance().trackError(searchText, error.message, user?.id);
      } else {
                const searchResults = data || [];
        const searchDuration = Date.now() - searchStartTime;
        
        setResults(searchResults);
        setTotalCount(searchResults.length);

        // Cache results
        await SearchCache.getInstance().cacheSearchResults(searchText, searchResults);
        
        // Basit performance monitoring
        if (__DEV__) {
          if (searchDuration > 1000) {
            console.warn(`⚠️ Slow search: ${searchDuration}ms for "${searchText}"`);
          } else if (searchDuration < 200) {
            console.log(`⚡ Fast search: ${searchDuration}ms for "${searchText}"`);
          } else {
            console.log(`🔍 Search: ${searchResults.length} results in ${searchDuration}ms`);
          }
        }
        
        // Track analytics - Şimdilik devre dışı
        // await SearchAnalytics.getInstance().trackSearch(
        //   searchText,
        //   searchResults.length,
        //   searchDuration,
        //   searchCategories.length > 0 ? searchCategories[0] : undefined,
        //   { categories: searchCategories },
        //   user?.id
        // );

        // console.log(`📊 Search Analytics: ${searchResults.length} results in ${searchDuration}ms`);
        
        // Performance monitoring - Şimdilik devre dışı
        // if (searchDuration > 1000) {
        //   console.warn(`⚠️ Slow search detected: ${searchDuration}ms for "${searchText}"`);
        // } else if (searchDuration < 200) {
        //   console.log(`⚡ Fast search: ${searchDuration}ms for "${searchText}"`);
        // }
        
        // Arama sonuçları geldiğinde klavyeyi kapat
        if (searchResults.length > 0) {
          Keyboard.dismiss();
        }
      }
    } catch (error) {
      console.error('🔍 Search exception:', error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategories, selectedSort]);

  // Sayfa açıldığında veya route params değiştiğinde otomatik arama yap
  useEffect(() => {
    if (initialQuery.trim()) {
      if (__DEV__) {
        console.log('🔍 Initial query detected:', initialQuery);
      }
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Memory management - component unmount'ta temizlik
  useEffect(() => {
    return () => {
      if (__DEV__) {
        console.log('🧹 SearchScreen cleanup');
      }
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
    };
  }, []);

  // Kategori değerini veritabanı değerine çevir
  const findCategoryValue = (mainCategory: string): string => {
    // Leaf kategorilerle eşleşecek şekilde mapping
    const categoryMap: { [key: string]: string } = {
      'Elektronik': 'Elektronik > Telefon > Akıllı Telefon > Akıllı Telefonlar',
      'Ev Aletleri & Mobilya': 'Ev Aletleri & Mobilya > Ev Aletleri > Buzdolabı > Buzdolapları',
      'Araç & Vasıta': 'Araç & Vasıta > Bisiklet > Şehir Bisikleti > Şehir Bisikletleri',
      'İş Makinesi': 'İş Makinesi > İş Makineleri > Ekskavatör > Ekskavatörler',
      'Moda': 'Moda > Ayakkabı',
      'Spor & Hobi': 'spor & hobi',
      'Kitap & Müzik': 'kitap & müzik',
      'Bahçe & Tarım': 'bahçe & tarım',
      'Sanat & Koleksiyon': 'sanat & koleksiyon',
      'Oyuncak & Hobi': 'oyuncak & hobi',
      'Sağlık & Güzellik': 'sağlık & güzellik',
      'Eğitim & Kurs': 'eğitim & kurs',
      'Hizmet': 'hizmet',
      'Diğer': 'diger'
    };

    const result = categoryMap[mainCategory] || mainCategory.toLowerCase();
            // console.log('🔍 findCategoryValue:', mainCategory, '->', result);
    return result;
  };

  // Category search
  const performCategorySearch = useCallback(async (categories: string[]) => {
    console.log('🔍 performCategorySearch - categories:', categories);
    console.log('🔍 performCategorySearch - searchQuery:', searchQuery);
    setSelectedCategories(categories);
    // setSearchQuery(''); // Arama sorgusunu temizleme, sadece kategori filtresi uygula
    await performSearch(searchQuery, categories);
    // Kategori seçildiğinde klavyeyi kapat
    Keyboard.dismiss();
  }, [performSearch, searchQuery]);

  useEffect(() => {
    if (route?.params?.query) {
      const query = route.params.query;
      setSearchQuery(query);
      performSearch(query);
    } else if (route?.params?.category) {
      performCategorySearch([route.params.category]);
    }
  }, [route?.params?.query, route?.params?.category, performSearch, performCategorySearch]);

  // Custom Header Component
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Arama
          </Text>
          {totalCount > 0 && (
                                    <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                          {displayTotalCount} sonuç
                        </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {/* Sort Button */}
          <TouchableOpacity
            style={styles.headerSortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Text style={[styles.headerSortButtonText, { color: colors.text }]}>
              Sırala
            </Text>
            <ChevronDown
              size={14}
              color={colors.text}
              style={[
                styles.headerSortIcon,
                { transform: [{ rotate: showSortOptions ? '180deg' : '0deg' }] }
              ]}
            />
          </TouchableOpacity>

          {/* View Mode Toggle */}
          <TouchableOpacity
            style={styles.headerViewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={16} color={colors.primary} />
            ) : (
              <Grid3X3 size={16} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* Filter Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={20} color={colors.primary} />
            {selectedCategories.length > 0 && (
              <View style={[styles.filterIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>


    </View>
  );

  // Enhanced Search Bar Section
  const renderSearchSection = () => (
    <View style={[styles.searchSection, { backgroundColor: colors.background }]}>
      <SearchBar
        value={searchQuery}
        onChangeText={(text) => {
          // console.log("🔍 SearchScreen onChangeText - Text:", text);
          setSearchQuery(text);
          // setDebouncedQuery(text); // Debounced search'i tetikle
        }}
        onSearch={() => {
          if (__DEV__) {
            console.log("🔍 SearchScreen onSearch - Enter pressed");
          }
          if (searchQuery.trim()) {
            // React Query ile search
            refetchSearch();
          }
        }}
        onSuggestionSelect={(suggestion) => {
          console.log('🔍 SearchScreen onSuggestionSelect - Suggestion:', suggestion);
          setSearchQuery(suggestion.text);
          performSearch(suggestion.text);
          // Suggestion seçildiğinde klavyeyi kapat
          Keyboard.dismiss();
        }}
        placeholder="Ne arıyorsunuz? (Enter'a basın)"
        showSuggestions={true}
        autoFocus={false}
      />
    </View>
  );



  // Enhanced List Item Renderer - Optimized
  const renderListItem = useCallback(({ item }: { item: any }) => {
    const handlePress = () => {
      navigation.navigate('ListingDetail', { listingId: item.id });
    };

    if (viewMode === 'grid') {
      return (
        <View style={[styles.listItem, styles.gridItem]}>
          <ListingCard
            listing={item}
            onPress={handlePress}
            screenName="SearchScreen"
            sectionName="Search Results"
          />
        </View>
      );
    } else {
      return (
        <View style={[styles.listItem, styles.listItemFull]}>
          <ListingListItem
            listing={item}
            onPress={handlePress}
          />
        </View>
      );
    }
  }, [viewMode, navigation]);

  // Empty State
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {!searchQuery ? (
        // Arama yapılmamışsa popüler aramaları göster
        <>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <TrendingUp size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Arama yapmaya başlayın
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            İstediğiniz ürünü bulmak için arama yapın
          </Text>
          
          {/* Popüler Aramalar */}
          <View style={styles.popularSearchesContainer}>
            <PopularSearches
              onSearchPress={(text) => {
                console.log('🔍 Popular search selected:', text);
                setSearchQuery(text);
                performSearch(text);
              }}
              visible={true}
            />
          </View>
        </>
      ) : (
        // Arama yapılmış ama sonuç yoksa
        <>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <TrendingUp size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Arama sonucu bulunamadı
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Farklı anahtar kelimeler deneyin veya filtreleri değiştirin
          </Text>
        </>
      )}
    </View>
  );

  // Render loop kontrolü - sadece geliştirme sırasında aktif
  if (__DEV__) {
    console.log("🔄 SearchScreen render - isLoading:", isLoading, "totalCount:", totalCount);
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle="dark-content"
      />

      {/* Custom Header */}
      {renderHeader()}

      {/* Search Section */}
      {renderSearchSection()}



      {/* Results List */}
                          <FlatList
                      data={displayResults}
                      renderItem={renderListItem}
        keyExtractor={useCallback((item: any) => item.id, [])}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          results.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={viewMode === 'list' ? (data, index) => ({
          length: 120, // ListingListItem yüksekliği
          offset: 120 * index,
          index,
        }) : undefined}
        key={viewMode} // Force re-render when view mode changes
      />

      {/* Loading Overlay */}
                            {displayLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner text="Aranıyor..." />
        </View>
      )}

      {/* Sort Options Modal */}
      {showSortOptions && (
        <View style={styles.sortModal}>
          <TouchableOpacity 
            style={styles.sortModalBackdrop}
            onPress={() => setShowSortOptions(false)}
            activeOpacity={1}
          />
          <View style={styles.sortModalContent}>
            <SortOptions
              selectedSort={selectedSort}
              onSortChange={(sort: string) => {
                console.log('🔍 Sort changed to:', sort);
                setSelectedSort(sort);
                setShowSortOptions(false);
                // Sıralama değiştiğinde aramayı yeniden çalıştır
                setTimeout(() => {
                  performSearch();
                }, 0);
              }}
              showReset={true}
            />
          </View>
        </View>
      )}

      {/* Filter Bottom Sheet */}
              <FilterBottomSheet
          visible={showFilters}
          onClose={() => setShowFilters(false)}
                  onApply={(filters) => {
          console.log('🔍 Filters applied:', filters);
          console.log('🔍 Current searchQuery:', searchQuery);
          console.log('🔍 Current selectedCategories:', selectedCategories);
          
          // Kategori filtresini uygula
          if (filters.category && filters.category.length > 0) {
            console.log('🔍 Applying category filter:', filters.category);
            setSelectedCategories(filters.category);
            performCategorySearch(filters.category);
          } else {
            // Kategori temizlendiğinde orijinal aramayı geri yükle
            console.log('🔍 Clearing category filter, restoring original search');
            setSelectedCategories([]);
            if (searchQuery.trim()) {
              console.log('🔍 Restoring search with query:', searchQuery);
              performSearch(searchQuery, []);
            } else {
              console.log('🔍 No search query, clearing results');
              setResults([]);
              setTotalCount(0);
            }
          }
          
          // Diğer filtreleri uygula (gelecekte eklenecek)
          // TODO: Apply other filters (price, location, etc.)
          
          setShowFilters(false);
        }}
          onClear={() => {
            console.log('🔍 Filters cleared');
            setSearchQuery('');
            setSelectedCategories([]);
            setResults([]);
            setTotalCount(0);
          }}
          currentFilters={{
            searchQuery,
            category: selectedCategories,
            priceRange: null,
            location: '',
            urgency: '',
          }}
          searchResults={results}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerSortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
  },
  headerSortIcon: {
    marginLeft: 2,
  },
  headerViewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    padding: 2,
  },
  headerViewModeButton: {
    padding: 4,
    borderRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultCount: {
    fontSize: 14,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Search Section Styles
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },



  // List Styles
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
  },
  listItem: {
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  listItemFull: {
    marginHorizontal: 0,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  popularSearchesContainer: {
    marginTop: 24,
    width: '100%',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sort Modal
  sortModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sortModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sortModalContent: {
    position: 'absolute',
    top: '20%',
    left: 16,
    right: 16,
    maxHeight: '60%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default SearchScreen;
