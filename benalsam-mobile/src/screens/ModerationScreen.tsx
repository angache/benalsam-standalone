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
import { formatDate } from '../types';
import { CheckCircle, XCircle, Clock, Tag, Settings } from 'lucide-react-native';

interface PendingItem {
  type: 'feature' | 'tag';
  categoryPath: string;
  id: string;
  name: string;
  created_by: string;
  created_at: number;
}

const ModerationScreen = () => {
  const { colors } = useTheme();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingItems = async () => {
    try {
      setLoading(true);
      const items = await firebaseService.getPendingModeration();
      setPendingItems(items);
      console.log('📋 Loaded pending items:', items.length);
    } catch (error) {
      console.error('❌ Error loading pending items:', error);
      Alert.alert('Hata', 'Bekleyen öğeler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingItems();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPendingItems();
  }, []);

  const handleApprove = async (item: PendingItem) => {
    try {
      const status = 'approved';
      if (item.type === 'feature') {
        await firebaseService.updateFeatureStatus(item.categoryPath, item.id, status);
      } else {
        await firebaseService.updateTagStatus(item.categoryPath, item.id, status);
      }
      
      Alert.alert('Başarılı', `${item.name} onaylandı.`);
      loadPendingItems(); // Listeyi yenile
    } catch (error) {
      console.error('❌ Error approving item:', error);
      Alert.alert('Hata', 'Onaylama işlemi başarısız oldu.');
    }
  };

  const handleReject = async (item: PendingItem) => {
    try {
      const status = 'rejected';
      if (item.type === 'feature') {
        await firebaseService.updateFeatureStatus(item.categoryPath, item.id, status);
      } else {
        await firebaseService.updateTagStatus(item.categoryPath, item.id, status);
      }
      
      Alert.alert('Başarılı', `${item.name} reddedildi.`);
      loadPendingItems(); // Listeyi yenile
    } catch (error) {
      console.error('❌ Error rejecting item:', error);
      Alert.alert('Hata', 'Reddetme işlemi başarısız oldu.');
    }
  };



  const renderPendingItem = (item: PendingItem) => (
    <View key={`${item.type}-${item.id}`} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTypeContainer}>
          {item.type === 'feature' ? (
            <Settings size={16} color={colors.primary} />
          ) : (
            <Tag size={16} color={colors.primary} />
          )}
          <Text style={[styles.itemType, { color: colors.primary }]}>
            {item.type === 'feature' ? 'Özellik' : 'Etiket'}
          </Text>
        </View>
        <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
          {formatDate(new Date(item.created_at))}
        </Text>
      </View>

      <Text style={[styles.itemName, { color: colors.text }]}>
        {item.name}
      </Text>

      <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
        Kategori: {item.categoryPath}
      </Text>

      <Text style={[styles.itemUser, { color: colors.textSecondary }]}>
        Kullanıcı: {item.created_by}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.approveButton, { backgroundColor: colors.success }]}
          onPress={() => handleApprove(item)}
        >
          <CheckCircle size={16} color={colors.white} />
          <Text style={[styles.buttonText, { color: colors.white }]}>Onayla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rejectButton, { backgroundColor: colors.error }]}
          onPress={() => handleReject(item)}
        >
          <XCircle size={16} color={colors.white} />
          <Text style={[styles.buttonText, { color: colors.white }]}>Reddet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Bekleyen öğeler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Moderasyon Paneli</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Bekleyen özellik ve etiketler ({pendingItems.length})
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Bekleyen Öğe Yok
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Onay bekleyen özellik veya etiket bulunmuyor.
            </Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {pendingItems.map(renderPendingItem)}
          </View>
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
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  itemsContainer: {
    padding: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemDate: {
    fontSize: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemUser: {
    fontSize: 14,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ModerationScreen; 