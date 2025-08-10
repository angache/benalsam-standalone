import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { Card, Button, Avatar } from '../components';
import { 
  fetchFollowedCategories, 
  fetchListingsForFollowedCategories,
  unfollowCategory 
} from '../services/categoryFollowService';
import { fetchFollowingUsers, unfollowUser } from '../services/followService';
import { User, Rss } from 'lucide-react-native';

const FollowingScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'users' | 'categories'>('users');
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [followedCategoriesWithListings, setFollowedCategoriesWithListings] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      setError(null);
      
      // Load following users
      setLoadingUsers(true);
      const usersData = await fetchFollowingUsers(user.id);
      setFollowingUsers(usersData || []);
      setLoadingUsers(false);

      // Load followed categories with listings
      setLoadingCategories(true);
      const categoriesResponse = await fetchListingsForFollowedCategories(user.id, 3, user.id);
      if (categoriesResponse.error) {
        throw categoriesResponse.error;
      }
      setFollowedCategoriesWithListings(categoriesResponse.data || []);
      setLoadingCategories(false);
    } catch (err) {
      console.error('Error loading following data:', err);
      setError('Takip edilenler yüklenirken bir sorun oluştu.');
      setLoadingUsers(false);
      setLoadingCategories(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUnfollowUser = async (userId: string) => {
    if (!user) return;

    Alert.alert(
      'Takibi Bırak',
      'Bu kullanıcının takibini bırakmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Takibi Bırak',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await unfollowUser(user.id, userId);
              if (success) {
                setFollowingUsers(prev => prev.filter(u => u.id !== userId));
              }
            } catch (error) {
              Alert.alert('Hata', 'Takip bırakılırken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleUnfollowCategory = async (categoryName: string) => {
    if (!user) return;

    Alert.alert(
      'Kategori Takibini Bırak',
      `"${categoryName}" kategorisinin takibini bırakmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Takibi Bırak',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await unfollowCategory(user.id, categoryName);
              if (response.data) {
                setFollowedCategoriesWithListings(prev => 
                  prev.filter(cat => cat.category_name !== categoryName)
                );
              }
            } catch (error) {
              Alert.alert('Hata', 'Kategori takibi bırakılırken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Avatar name={item.name || item.username || 'Kullanıcı'} size="lg" source={item.avatar_url} />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || item.username || 'Kullanıcı'}</Text>
          <Text style={styles.userStats}>{item.followers_count || 0} Takipçi • {item.following_count || 0} Takip Edilen</Text>
          {item.bio ? <Text style={styles.userBio}>{item.bio}</Text> : null}
        </View>
      </View>
      <TouchableOpacity style={styles.unfollowButton} onPress={() => handleUnfollowUser(item.id)}>
        <Text style={styles.unfollowButtonIcon}>👤➖</Text>
        <Text style={styles.unfollowButtonText}>Takipten Çık</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: any }) => (
    <Card style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryName, { color: colors.text }]}>
          {item.category_name}
        </Text>
        <Button
          title="Takibi Bırak"
          variant="outline"
          onPress={() => handleUnfollowCategory(item.category_name)}
          size="sm"
        />
      </View>
      
      {item.listings && item.listings.length > 0 && (
        <View style={styles.listingsContainer}>
          <Text style={[styles.listingsTitle, { color: colors.textSecondary }]}>
            Son İlanlar
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.listings.map((listing: any) => (
              <TouchableOpacity
                key={listing.id}
                style={styles.listingItem}
                onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
              >
                <Avatar 
                  source={listing.user.avatar_url}
                  name={listing.user.name}
                  size="lg"
                />
                <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={[styles.listingPrice, { color: colors.primary }]}>
                  ₺{listing.budget || listing.price || 'Fiyat belirtilmemiş'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Card>
  );

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorIcon, { color: colors.error }]}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Bir Sorun Oluştu
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  const isLoading = loadingUsers || loadingCategories;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]}
          onPress={() => setActiveTab('users')}
        >
          <View style={styles.tabLabelRow}>
            <User size={22} color={activeTab === 'users' ? '#4fdfff' : '#888'} style={styles.tabIcon} />
            <View style={styles.tabLabelTextContainer}>
              <Text style={[styles.tabLabelLine, activeTab === 'users' ? styles.activeTabText : styles.inactiveTabText]}>Takip Edilen</Text>
              <Text style={[styles.tabLabelLine, activeTab === 'users' ? styles.activeTabText : styles.inactiveTabText]}>Kullanıcılar ({followingUsers.length})</Text>
            </View>
          </View>
          {activeTab === 'users' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'categories' && styles.activeTabButton]}
          onPress={() => setActiveTab('categories')}
        >
          <View style={styles.tabLabelRow}>
            <Rss size={22} color={activeTab === 'categories' ? '#4fdfff' : '#888'} style={styles.tabIcon} />
            <View style={styles.tabLabelTextContainer}>
              <Text style={[styles.tabLabelLine, activeTab === 'categories' ? styles.activeTabText : styles.inactiveTabText]}>Takip Edilen</Text>
              <Text style={[styles.tabLabelLine, activeTab === 'categories' ? styles.activeTabText : styles.inactiveTabText]}>Kategoriler ({followedCategoriesWithListings.length})</Text>
            </View>
          </View>
          {activeTab === 'categories' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'users' ? followingUsers : followedCategoriesWithListings}
          renderItem={activeTab === 'users' ? renderUserItem : renderCategoryItem}
          keyExtractor={(item) => activeTab === 'users' ? item.id : item.category_name}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}> {activeTab === 'users' ? '👥' : '📂'} </Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}> {activeTab === 'users' ? 'Henüz Kimseyi Takip Etmiyorsun' : 'Henüz Kategori Takip Etmiyorsun'} </Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}> {activeTab === 'users' ? 'İlgi çekici profilleri takip etmeye başla!' : 'İlgini çeken kategorileri takip ederek yeni ilanlardan haberdar ol.'} </Text>
              {activeTab === 'categories' && (
                <Button
                  title="Kategori Takip Et"
                  onPress={() => navigation.navigate('FollowCategory')}
                  style={styles.emptyButton}
                />
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181B20',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'column',
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4fdfff',
  },
  inactiveTabText: {
    color: '#888',
  },
  activeTabButton: {},
  tabUnderline: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: 3,
    backgroundColor: '#4fdfff',
    borderRadius: 2,
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#23262B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userStats: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 2,
  },
  userBio: {
    fontSize: 15,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  unfollowButton: {
    backgroundColor: '#181B20',
    borderColor: '#ff4d4f',
    borderWidth: 1.5,
    borderRadius: 10,
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  unfollowButtonText: {
    color: '#ff4d4f',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
  unfollowButtonIcon: {
    fontSize: 18,
    color: '#ff4d4f',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryCard: {
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  listingsContainer: {
    marginTop: 8,
  },
  listingsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  listingItem: {
    width: 150,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  listingTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 200,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelTextContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  tabLabelLine: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});

export default FollowingScreen; 