import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../stores';
import { Header, Card, LoadingSpinner } from '../components';
import { 
  useElasticsearchHealth, 
  useElasticsearchStats,
  useElasticsearchSearch 
} from '../hooks/queries/useElasticsearchSearch';

const ElasticsearchTestScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const [testQuery, setTestQuery] = useState('iPhone');

  // Elasticsearch health check
  const { 
    data: healthStatus, 
    isLoading: isHealthLoading, 
    refetch: refetchHealth 
  } = useElasticsearchHealth();

  // Elasticsearch stats
  const { 
    data: stats, 
    isLoading: isStatsLoading, 
    refetch: refetchStats 
  } = useElasticsearchStats();

  // Test search
  const { 
    data: searchResults, 
    isLoading: isSearchLoading, 
    error: searchError,
    refetch: refetchSearch 
  } = useElasticsearchSearch(
    { query: testQuery, limit: 5 },
    true // enabled
  );

  const [searchQuery, setSearchQuery] = useState('iPhone');
  const [isSearching, setIsSearching] = useState(false);

  const runTest = () => {
    Alert.alert(
      'Elasticsearch Test',
      `Health: ${healthStatus ? '✅ Connected' : '❌ Disconnected'}\n` +
      `Stats: ${stats ? '✅ Available' : '❌ Unavailable'}\n` +
      `Search Results: ${searchResults?.listings?.length || 0} items\n` +
      `Search Error: ${searchError ? '❌ Error' : '✅ Success'}`,
      [{ text: 'OK' }]
    );
  };

  const performSearch = () => {
    if (searchQuery.trim()) {
      setTestQuery(searchQuery);
      setIsSearching(true);
      refetchSearch();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            ← Elasticsearch Test
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>
            Elasticsearch Bağlantı Testi
          </Text>
          
          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: colors.text }]}>Health Status:</Text>
            {isHealthLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={[
                styles.status, 
                { color: healthStatus ? colors.success : colors.error }
              ]}>
                {healthStatus ? '✅ Connected' : '❌ Disconnected'}
              </Text>
            )}
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: colors.text }]}>Stats:</Text>
            {isStatsLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={[
                styles.status, 
                { color: stats ? colors.success : colors.error }
              ]}>
                {stats ? '✅ Available' : '❌ Unavailable'}
              </Text>
            )}
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={[styles.label, { color: colors.text }]}>Test Search:</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Arama terimi girin..."
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={performSearch}
                disabled={isSearchLoading}
              >
                <Text style={[styles.searchButtonText, { color: colors.white }]}>
                  {isSearchLoading ? 'Aranıyor...' : 'Ara'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={runTest}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              Test Sonuçlarını Göster
            </Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>
            Arama Testi
          </Text>
          
          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: colors.text }]}>Query:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{testQuery}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.label, { color: colors.text }]}>Results:</Text>
            {isSearchLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {searchResults?.listings?.length || 0} items
              </Text>
            )}
          </View>

          {searchError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                Search Error: {searchError.message}
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={() => refetchHealth()}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                Health Refresh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={() => refetchStats()}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                Stats Refresh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={() => refetchSearch()}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                Search Refresh
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {searchResults?.listings && searchResults.listings.length > 0 && (
          <Card style={styles.card}>
            <Text style={[styles.title, { color: colors.text }]}>
              Arama Sonuçları
            </Text>
            
            {searchResults.listings.map((item: any, index: number) => (
              <View key={index} style={styles.resultItem}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.resultCategory, { color: colors.textSecondary }]}>
                  {item.category}
                </Text>
                <Text style={[styles.resultPrice, { color: colors.primary }]}>
                  ₺{item.budget}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    marginTop: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ElasticsearchTestScreen; 