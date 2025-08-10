import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, Flame, Star, Zap } from 'lucide-react-native';
import { useThemeColors } from '../stores/themeStore';
import { supabase } from '../services/supabaseClient';

interface PopularSearchesProps {
  onSearchPress: (text: string) => void;
  visible: boolean;
  category?: string;
}

interface PopularSearch {
  id: string;
  text: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  category?: string;
}

const PopularSearches: React.FC<PopularSearchesProps> = ({
  onSearchPress,
  visible,
  category,
}) => {
  const colors = useThemeColors();
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Popüler aramaları yükle
  useEffect(() => {
    if (visible) {
      loadPopularSearches();
    }
  }, [visible, category]);

  const loadPopularSearches = async () => {
    setIsLoading(true);
    try {
      // Gerçek uygulamada bu veriler analytics'ten gelecek
      // Şimdilik statik veri kullanıyoruz
      const mockPopularSearches: PopularSearch[] = [
        { id: '1', text: 'iPhone', count: 1250, trend: 'up', category: 'Elektronik' },
        { id: '2', text: 'araba', count: 980, trend: 'up', category: 'Araç & Vasıta' },
        { id: '3', text: 'ev', count: 850, trend: 'stable', category: 'Ev Aletleri & Mobilya' },
        { id: '4', text: 'bilgisayar', count: 720, trend: 'down', category: 'Elektronik' },
        { id: '5', text: 'mobilya', count: 650, trend: 'up', category: 'Ev Aletleri & Mobilya' },
        { id: '6', text: 'telefon', count: 580, trend: 'up', category: 'Elektronik' },
        { id: '7', text: 'buzdolabı', count: 420, trend: 'stable', category: 'Ev Aletleri & Mobilya' },
        { id: '8', text: 'bisiklet', count: 380, trend: 'up', category: 'Araç & Vasıta' },
      ];

      // Kategori filtresi varsa uygula
      const filteredSearches = category 
        ? mockPopularSearches.filter(search => search.category === category)
        : mockPopularSearches;

      // En popüler 6 aramayı göster
      const sortedSearches = filteredSearches
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setPopularSearches(sortedSearches);
    } catch (error) {
      console.error('Popüler aramalar yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} color={colors.success} />;
      case 'down':
        return <TrendingUp size={14} color={colors.error} style={{ transform: [{ rotate: '180deg' }] }} />;
      default:
        return <Zap size={14} color={colors.warning} />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'Yükseliyor';
      case 'down':
        return 'Düşüyor';
      default:
        return 'Stabil';
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Flame size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            🔥 Popüler Aramalar
          </Text>
        </View>
        {category && (
          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
            {category} kategorisinde
          </Text>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {popularSearches.map((search, index) => (
          <TouchableOpacity
            key={search.id}
            style={[
              styles.searchChip,
              { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => onSearchPress(search.text)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View style={styles.chipContent}>
              <View style={styles.rankContainer}>
                <Text style={[styles.rank, { color: colors.primary }]}>
                  #{index + 1}
                </Text>
              </View>
              
              <View style={styles.searchInfo}>
                <Text style={[styles.searchText, { color: colors.text }]}>
                  {search.text}
                </Text>
                <View style={styles.trendContainer}>
                  {getTrendIcon(search.trend)}
                  <Text style={[styles.trendText, { color: colors.textSecondary }]}>
                    {getTrendText(search.trend)}
                  </Text>
                </View>
              </View>

              <View style={styles.countContainer}>
                <Star size={12} color={colors.warning} fill={colors.warning} />
                <Text style={[styles.countText, { color: colors.textSecondary }]}>
                  {search.count.toLocaleString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {popularSearches.length === 0 && !isLoading && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz popüler arama yok
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    marginLeft: 28,
  },
  scrollContainer: {
    paddingHorizontal: 4,
  },
  searchChip: {
    marginHorizontal: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    marginRight: 8,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchInfo: {
    flex: 1,
  },
  searchText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 10,
    marginLeft: 4,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    fontSize: 10,
    marginLeft: 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default PopularSearches; 