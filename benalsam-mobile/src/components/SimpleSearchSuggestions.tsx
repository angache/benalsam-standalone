import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Search, Car, Home, Phone, Monitor, Sofa, Clock, TrendingUp, Smartphone, Shirt, Car as CarIcon, Home as HomeIcon } from 'lucide-react-native';
import { useThemeColors } from '../stores/themeStore';
import { supabase } from '../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchHistory from './SearchHistory';
import PopularSearches from './PopularSearches';

// Kategori bazlı öneriler
const CATEGORY_SUGGESTIONS = {
  'Elektronik': ['telefon', 'bilgisayar', 'tablet', 'laptop', 'kulaklık', 'kamera'],
  'Moda': ['ayakkabı', 'çanta', 'elbise', 'pantolon', 'gömlek', 'ceket'],
  'Ev & Yaşam': ['mobilya', 'dekorasyon', 'mutfak', 'banyo', 'bahçe', 'ev aletleri'],
  'Araç': ['araba', 'motosiklet', 'bisiklet', 'otomobil', 'araç parçası', 'lastik'],
};

interface SimpleSearchSuggestionsProps {
  query: string;
  onSuggestionPress: (text: string) => void;
  visible: boolean;
}

const SimpleSearchSuggestions: React.FC<SimpleSearchSuggestionsProps> = ({
  query,
  onSuggestionPress,
  visible,
}) => {
  const colors = useThemeColors();
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Arama geçmişi ve popüler aramaları yükle
  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      try {
        // Arama geçmişini yükle
        const recent = await AsyncStorage.getItem('recentSearches');
        if (recent) {
          setRecentSearches(JSON.parse(recent).slice(0, 3));
        }

        // Popüler aramaları yükle (statik)
        setPopularSearches(['araba', 'telefon', 'bilgisayar', 'ev', 'mobilya']);
      } catch (error) {
        console.error('Veriler yüklenemedi:', error);
      }
    };

    loadData();
  }, [visible]);

  // Veritabanından dinamik öneriler çek
  useEffect(() => {
    if (!visible || !query.trim()) {
      setDynamicSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('title')
          .or(`title.ilike.%${query}%`)
          .limit(5);

        if (!error && data) {
          const suggestions = data
            .map(item => item.title)
            .filter(title => title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);
          setDynamicSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Öneriler yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce için timeout
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, visible]);

  if (!visible) return null;

  const staticSuggestions = ['araba', 'ev', 'telefon', 'bilgisayar', 'mobilya'];
  
  // Dinamik öneriler varsa onları kullan, yoksa statik önerileri filtrele
  const allSuggestions = dynamicSuggestions.length > 0 
    ? dynamicSuggestions 
    : staticSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );

  // Kategori tespit fonksiyonu
  const detectCategory = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();
    
    // Kategori anahtar kelimeleri
    const categoryKeywords = {
      'Elektronik': ['elektronik', 'telefon', 'bilgisayar', 'tablet', 'laptop', 'kulaklık', 'kamera', 'ara'],
      'Moda': ['moda', 'ayakkabı', 'çanta', 'elbise', 'pantolon', 'gömlek', 'ceket', 'giyim'],
      'Ev & Yaşam': ['ev', 'yaşam', 'mobilya', 'dekorasyon', 'mutfak', 'banyo', 'bahçe', 'ev aletleri'],
      'Araç': ['araç', 'araba', 'motosiklet', 'bisiklet', 'otomobil', 'araç parçası', 'lastik'],
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  };

  const renderSuggestionItem = (suggestion: string, index: number, type: 'recent' | 'popular' | 'dynamic' | 'static' | 'category') => {
    const getIcon = (text: string) => {
      if (text === 'araba') return <Car size={18} color={colors.textSecondary} style={styles.icon} />;
      if (text === 'ev') return <Home size={18} color={colors.textSecondary} style={styles.icon} />;
      if (text === 'telefon') return <Phone size={18} color={colors.textSecondary} style={styles.icon} />;
      if (text === 'bilgisayar') return <Monitor size={18} color={colors.textSecondary} style={styles.icon} />;
      if (text === 'mobilya') return <Sofa size={18} color={colors.textSecondary} style={styles.icon} />;
      
      // Tip bazlı ikonlar
      if (type === 'recent') return <Clock size={18} color={colors.textSecondary} style={styles.icon} />;
      if (type === 'popular') return <TrendingUp size={18} color={colors.textSecondary} style={styles.icon} />;
      if (type === 'category') return <Search size={18} color={colors.textSecondary} style={styles.icon} />;
      return <Search size={18} color={colors.textSecondary} style={styles.icon} />;
    };

    return (
              <Pressable
          key={`${type}-${index}`}
          style={({ pressed }) => [
            styles.suggestionItem, 
            { 
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
              backgroundColor: pressed ? colors.surface : 'transparent',
              opacity: pressed ? 0.7 : 1,
            }
          ]}
          onPress={() => {
            console.log('🔍 SimpleSearchSuggestions - Suggestion pressed:', suggestion);
            onSuggestionPress(suggestion);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
        {getIcon(suggestion)}
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {suggestion}
        </Text>
      </Pressable>
    );
  };

  // Query varsa dinamik öneriler + kategori önerileri, yoksa kategorize edilmiş öneriler
  if (query.trim()) {
    const detectedCategory = detectCategory(query);
    const categorySuggestions = detectedCategory && detectedCategory in CATEGORY_SUGGESTIONS 
      ? CATEGORY_SUGGESTIONS[detectedCategory as keyof typeof CATEGORY_SUGGESTIONS] || [] 
      : [];
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dinamik Arama Sonuçları */}
          {allSuggestions.length > 0 && (
            <>
              <Text style={[styles.title, { color: colors.textSecondary }]}>
                🔍 Arama Sonuçları
              </Text>
              {allSuggestions.map((suggestion: string, index: number) => 
                renderSuggestionItem(suggestion, index, 'dynamic')
              )}
            </>
          )}
          
          {/* Kategori Bazlı Öneriler */}
          {detectedCategory && categorySuggestions.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                📂 {detectedCategory} Kategorisi
              </Text>
              {categorySuggestions
                .filter((suggestion: string) => suggestion.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 3)
                .map((suggestion: string, index: number) => 
                  renderSuggestionItem(suggestion, index, 'category')
                )
              }
            </>
          )}

          {/* Popüler Aramalar (Query varken de göster) */}
          <PopularSearches
            onSearchPress={onSuggestionPress}
            visible={true}
            category={detectedCategory || undefined}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Arama Geçmişi */}
        <SearchHistory
          onHistoryItemPress={onSuggestionPress}
          visible={true}
        />

        {/* Popüler Aramalar */}
        <PopularSearches
          onSearchPress={onSuggestionPress}
          visible={true}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 300,
  },
  scrollView: {
    maxHeight: 250,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
});

export default SimpleSearchSuggestions; 