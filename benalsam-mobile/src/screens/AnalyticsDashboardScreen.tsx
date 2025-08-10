import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { firebaseService } from '../services/firebaseService';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Tag, 
  Settings, 
  Sparkles,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react-native';

interface AnalyticsData {
  popularFeatures: any;
  popularTags: any;
  aiSuccessRates: any;
  totalCategories: number;
  totalFeatures: number;
  totalTags: number;
}

const AnalyticsDashboardScreen = () => {
  const { colors } = useTheme();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Elektronik > Bilgisayar');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Popüler özellikler ve etiketler
      const popularFeatures = await firebaseService.getPopularFeatures(selectedCategory, 10);
      const popularTags = await firebaseService.getPopularTags(selectedCategory, 10);
      
      // AI başarı oranları
      const aiSuccessRates = await firebaseService.getAISuccessRates();
      
      // Genel istatistikler
      const allCategories = await firebaseService.getAllCategories();
      let totalFeatures = 0;
      let totalTags = 0;
      
      if (allCategories) {
        Object.values(allCategories).forEach((category: any) => {
          if (category.features) {
            totalFeatures += Object.keys(category.features).length;
          }
          if (category.tags) {
            totalTags += Object.keys(category.tags).length;
          }
        });
      }
      
      setAnalyticsData({
        popularFeatures,
        popularTags,
        aiSuccessRates,
        totalCategories: allCategories ? Object.keys(allCategories).length : 0,
        totalFeatures,
        totalTags,
      });
      
      console.log('📊 Analytics loaded successfully');
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      Alert.alert('Hata', 'Analitik veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedCategory]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (rate: number) => {
    return (rate * 100).toFixed(1) + '%';
  };

  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    </View>
  );

  const renderPopularItem = (item: any, index: number, type: 'feature' | 'tag') => (
    <View key={item.id || index} style={[styles.popularItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.popularItemHeader}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: colors.primary }]}>#{index + 1}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
            {type === 'feature' ? 'Özellik' : 'Etiket'}
          </Text>
        </View>
      </View>
      <View style={styles.itemStats}>
        <Text style={[styles.usageCount, { color: colors.primary }]}>
          {formatNumber(item.usage_count || 0)} kullanım
        </Text>
        {item.ai_suggested && (
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + '20' }]}>
            <Sparkles size={12} color={colors.primary} />
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAISuccessItem = (item: any, index: number) => (
    <View key={index} style={[styles.aiItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.aiItemHeader}>
        <Text style={[styles.aiItemTitle, { color: colors.text }]}>
          {item.title || `Öneri ${index + 1}`}
        </Text>
        <Text style={[styles.aiSuccessRate, { color: colors.success }]}>
          {formatPercentage(item.success_rate || 0)}
        </Text>
      </View>
      <Text style={[styles.aiItemDetails, { color: colors.textSecondary }]}>
        {item.usage_count || 0} kullanım • {item.feature_success_rate ? formatPercentage(item.feature_success_rate) : '0%'} özellik • {item.tag_success_rate ? formatPercentage(item.tag_success_rate) : '0%'} etiket
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <RefreshCw size={24} color={colors.textSecondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analitik veriler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Analitik Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          AI performansı ve popüler içerikler
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Genel İstatistikler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <BarChart3 size={20} color={colors.primary} /> Genel İstatistikler
          </Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Toplam Kategori',
              analyticsData?.totalCategories || 0,
              <Tag size={20} color={colors.primary} />,
              colors.primary
            )}
            {renderStatCard(
              'Toplam Özellik',
              analyticsData?.totalFeatures || 0,
              <Settings size={20} color={colors.success} />,
              colors.success
            )}
            {renderStatCard(
              'Toplam Etiket',
              analyticsData?.totalTags || 0,
              <Tag size={20} color={colors.warning} />,
              colors.warning
            )}
          </View>
        </View>

        {/* AI Başarı Oranları */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <TrendingUp size={20} color={colors.primary} /> AI Başarı Oranları
          </Text>
          <View style={styles.aiContainer}>
            {analyticsData?.aiSuccessRates ? (
              Object.entries(analyticsData.aiSuccessRates)
                .slice(0, 5)
                .map(([key, item]: [string, any], index) => renderAISuccessItem(item, index))
            ) : (
              <View style={styles.emptyContainer}>
                <Target size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  AI Verisi Yok
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Henüz AI önerisi kullanılmamış.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Popüler Özellikler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Settings size={20} color={colors.primary} /> Popüler Özellikler
          </Text>
          <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
            Kategori: {selectedCategory}
          </Text>
          <View style={styles.popularContainer}>
            {analyticsData?.popularFeatures ? (
              Object.entries(analyticsData.popularFeatures)
                .slice(0, 5)
                .map(([key, item]: [string, any], index) => renderPopularItem(item, index, 'feature'))
            ) : (
              <View style={styles.emptyContainer}>
                <Settings size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Özellik Verisi Yok
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Bu kategoride henüz özellik kullanılmamış.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Popüler Etiketler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Tag size={20} color={colors.primary} /> Popüler Etiketler
          </Text>
          <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
            Kategori: {selectedCategory}
          </Text>
          <View style={styles.popularContainer}>
            {analyticsData?.popularTags ? (
              Object.entries(analyticsData.popularTags)
                .slice(0, 5)
                .map(([key, item]: [string, any], index) => renderPopularItem(item, index, 'tag'))
            ) : (
              <View style={styles.emptyContainer}>
                <Tag size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Etiket Verisi Yok
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Bu kategoride henüz etiket kullanılmamış.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  aiContainer: {
    gap: 12,
  },
  aiItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  aiItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  aiSuccessRate: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiItemDetails: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  popularContainer: {
    gap: 12,
  },
  popularItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  popularItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AnalyticsDashboardScreen; 