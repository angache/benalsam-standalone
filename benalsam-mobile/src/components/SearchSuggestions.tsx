import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Clock, TrendingUp, Tag, Search } from 'lucide-react-native';
import { useThemeColors } from '../stores/themeStore';
import { supabase } from '../services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'category' | 'trending';
  category?: string;
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSuggestionPress: (suggestion: string) => void;
  onClearHistory?: () => void;
  visible: boolean;
  maxSuggestions?: number;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSuggestionPress,
  onClearHistory,
  visible,
  maxSuggestions = 10,
}) => {
  const colors = useThemeColors();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 SearchSuggestions useEffect - visible:', visible, 'query:', query);
    if (visible) {
      generateSuggestions();
    }
  }, [visible, query]);

  const loadRecentSearches = async () => {
    try {
      const recentSearches = await AsyncStorage.getItem('recentSearches');
      if (recentSearches) {
        const searches = JSON.parse(recentSearches);
        return searches.slice(0, 5).map((search: string, index: number) => ({
          id: `recent-${index}`,
          text: search,
          type: 'recent' as const,
        }));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
    return [];
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('recentSearches');
      onClearHistory?.();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const showDefaultSuggestions = async () => {
    console.log('🔍 SearchSuggestions showDefaultSuggestions - ENTRY');
    const recentSearches = await loadRecentSearches();
    const popularSearches = await getPopularSearches();
    
    const allSuggestions = [
      ...recentSearches,
      ...popularSearches.map((search, index) => ({
        id: `popular-${index}`,
        text: search,
        type: 'popular' as const,
      })),
    ];

    console.log('🔍 SearchSuggestions - Popular searches:', popularSearches);
    console.log('🔍 SearchSuggestions - Final suggestions:', allSuggestions);
    
    setSuggestions(allSuggestions.slice(0, maxSuggestions));
  };

  const getPopularSearches = async (): Promise<string[]> => {
    try {
      // Veritabanından popüler aramaları al
      const { data, error } = await supabase
        .from('listings')
        .select('title')
        .limit(100);

      if (error) {
        console.error('Error fetching popular searches:', error);
        return ['arıyorum', 'aranıyor', 'ikinci', 'iphone', 'pro'];
      }

      // Başlıklardan popüler kelimeleri çıkar
      const titles = data?.map(item => item.title) || [];
      const words = titles
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['ile', 've', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'mi', 'mu'].includes(word));

      // Kelime frekansını hesapla
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // En popüler kelimeleri döndür
      return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    } catch (error) {
      console.error('Error in getPopularSearches:', error);
      return ['arıyorum', 'aranıyor', 'ikinci', 'iphone', 'pro'];
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      if (!query.trim()) {
        console.log('🔍 SearchSuggestions - Showing default suggestions');
        await showDefaultSuggestions();
      } else {
        console.log('🔍 SearchSuggestions - Generating suggestions for query:', query);
        const categorySuggestions = await getCategorySuggestions(query);
        const similarTitles = await getSimilarTitles(query);
        
        const allSuggestions = [
          ...categorySuggestions,
          ...similarTitles,
        ];
        
        setSuggestions(allSuggestions.slice(0, maxSuggestions));
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategorySuggestions = async (query: string): Promise<SearchSuggestion[]> => {
    const suggestions: SearchSuggestion[] = [];
    
    // Kategori eşleştirmeleri - gerçek arama terimleriyle eşleştir
    const categoryMatches = {
      'ara': ['araba', 'araclar', 'araç'],
      'ev': ['ev', 'emlak', 'daire', 'konut'],
      'tel': ['telefon', 'iphone', 'samsung', 'mobil'],
      'bil': ['bilgisayar', 'laptop', 'pc', 'computer'],
      'mob': ['mobilya', 'koltuk', 'masa', 'sandalye'],
      'iş': ['iş makinesi', 'ekskavatör', 'buldozer'],
      'elek': ['elektronik', 'teknoloji', 'gadget'],
    };

    Object.entries(categoryMatches).forEach(([keyword, searchTerms]) => {
      if (query.toLowerCase().includes(keyword)) {
        searchTerms.forEach((term, index) => {
          suggestions.push({
            id: `category-${keyword}-${index}`,
            text: term,
            type: 'category',
            category: keyword,
          });
        });
      }
    });

    return suggestions;
  };

  const getSimilarTitles = async (query: string): Promise<SearchSuggestion[]> => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('title')
        .ilike('title', `%${query}%`)
        .limit(5);

      if (error) {
        console.error('Error fetching similar titles:', error);
        return [];
      }

      return data?.map((item, index) => ({
        id: `similar-${index}`,
        text: item.title,
        type: 'trending',
      })) || [];
    } catch (error) {
      console.error('Error in getSimilarTitles:', error);
      return [];
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return Clock;
      case 'popular':
        return TrendingUp;
      case 'category':
        return Tag;
      case 'trending':
        return Search;
      default:
        return Search;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return colors.textSecondary;
      case 'popular':
        return colors.primary;
      case 'category':
        return colors.warning;
      case 'trending':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getSuggestionTitle = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return 'Son Aramalar';
      case 'popular':
        return 'Popüler Aramalar';
      case 'category':
        return 'Kategori Önerileri';
      case 'trending':
        return 'Benzer İlanlar';
      default:
        return 'Öneriler';
    }
  };

  // Önerileri grupla
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    if (!groups[suggestion.type]) {
      groups[suggestion.type] = [];
    }
    groups[suggestion.type].push(suggestion);
    return groups;
  }, {} as Record<string, SearchSuggestion[]>);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Öneriler yükleniyor...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
            <View key={type} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                  {getSuggestionTitle(type as SearchSuggestion['type'])}
                </Text>
                {type === 'recent' && typeSuggestions.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={[styles.clearButton, { color: colors.primary }]}>
                      Temizle
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {typeSuggestions.map(suggestion => {
                const IconComponent = getSuggestionIcon(suggestion.type);
                return (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      console.log('🔍 SearchSuggestions - Suggestion pressed:', suggestion.text);
                      onSuggestionPress(suggestion.text);
                    }}
                  >
                    <IconComponent
                      size={16}
                      color={getSuggestionColor(suggestion.type)}
                      style={styles.suggestionIcon}
                    />
                    <Text style={[styles.suggestionText, { color: colors.text }]}>
                      {suggestion.text}
                    </Text>
                    {suggestion.count && (
                      <Text style={[styles.suggestionCount, { color: colors.textSecondary }]}>
                        {suggestion.count}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    maxHeight: 300,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  group: {
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  suggestionCount: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default SearchSuggestions; 