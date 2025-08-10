import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Clock, Trash2, X, Search } from 'lucide-react-native';
import { useThemeColors } from '../stores/themeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchHistoryProps {
  onHistoryItemPress: (text: string) => void;
  onClearHistory?: () => void;
  visible: boolean;
}

interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
  category?: string;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  onHistoryItemPress,
  onClearHistory,
  visible,
}) => {
  const colors = useThemeColors();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Arama geçmişini yükle
  useEffect(() => {
    if (visible) {
      loadSearchHistory();
    }
  }, [visible]);

  const loadSearchHistory = async () => {
    setIsLoading(true);
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        // Son 10 aramayı göster, en yeniden en eskiye sırala
        const sortedHistory = parsedHistory
          .sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setHistoryItems(sortedHistory);
      }
    } catch (error) {
      console.error('Arama geçmişi yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToHistory = async (searchText: string) => {
    try {
      const newItem: HistoryItem = {
        id: `history-${Date.now()}`,
        text: searchText,
        timestamp: Date.now(),
      };

      const existingHistory = await AsyncStorage.getItem('searchHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Aynı aramayı varsa kaldır (duplicate prevention)
      const filteredHistory = history.filter((item: HistoryItem) => item.text !== searchText);
      
      // Yeni aramayı başa ekle
      const updatedHistory = [newItem, ...filteredHistory].slice(0, 20); // Max 20 item
      
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setHistoryItems(updatedHistory.slice(0, 10)); // UI'da 10 item göster
    } catch (error) {
      console.error('Arama geçmişine eklenemedi:', error);
    }
  };

  const removeFromHistory = async (itemId: string) => {
    try {
      const updatedHistory = historyItems.filter(item => item.id !== itemId);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setHistoryItems(updatedHistory);
    } catch (error) {
      console.error('Arama geçmişinden silinemedi:', error);
    }
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'Arama Geçmişini Temizle',
      'Tüm arama geçmişini silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('searchHistory');
              setHistoryItems([]);
              onClearHistory?.();
            } catch (error) {
              console.error('Arama geçmişi temizlenemedi:', error);
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    
    return new Date(timestamp).toLocaleDateString('tr-TR');
  };

  if (!visible || historyItems.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          🕐 Son Aramalar
        </Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAllHistory}
        >
          <Text style={[styles.clearButtonText, { color: colors.primary }]}>
            Temizle
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {historyItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.historyItem,
              { 
                borderBottomColor: colors.border,
                borderBottomWidth: index === historyItems.length - 1 ? 0 : 1
              }
            ]}
          >
            <TouchableOpacity
              style={styles.historyContent}
              onPress={() => onHistoryItemPress(item.text)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Clock size={18} color={colors.textSecondary} style={styles.icon} />
              <View style={styles.textContainer}>
                <Text style={[styles.historyText, { color: colors.text }]}>
                  {item.text}
                </Text>
                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeFromHistory(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: 250,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default SearchHistory; 