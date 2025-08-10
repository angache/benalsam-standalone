import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { ArrowLeft, Grid, List, Eye, EyeOff, Edit, Trash2 } from 'lucide-react-native';
import { useThemeColors, useAuthStore } from '../stores';
import ListingCard from '../components/ListingCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { fetchMyListings } from '../services/listingService';
import { updateListingStatus, deleteListing } from '../services/listingService/mutations';
// import { withDataErrorBoundary } from '../utils/errorBoundaryHelpers'; // Geçici olarak devre dışı

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = -screenWidth * 0.4; // 40% of screen width - more deliberate swipe needed
const REVEAL_WIDTH = 140; // Width for 3 buttons (44px each + gaps + padding)

type ViewType = 'card' | 'list';

// Custom Header Component
const CustomHeader = ({ 
  onBack, 
  viewType, 
  onViewToggle, 
  colors 
}: { 
  onBack: () => void;
  viewType: ViewType;
  onViewToggle: (type: ViewType) => void;
  colors: any;
}) => (
  <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={onBack}
      activeOpacity={0.7}
    >
      <ArrowLeft size={24} color={colors.text} />
    </TouchableOpacity>
    
    <Text style={[styles.headerTitle, { color: colors.text }]}>
      İlanlarım
    </Text>
    
    <View style={styles.viewToggleContainer}>
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          { backgroundColor: colors.surface },
          viewType === 'card' && { backgroundColor: colors.primary }
        ]}
        onPress={() => onViewToggle('card')}
        activeOpacity={0.7}
      >
        <Grid 
          size={20} 
          color={viewType === 'card' ? colors.white : colors.textSecondary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          { backgroundColor: colors.surface },
          viewType === 'list' && { backgroundColor: colors.primary }
        ]}
        onPress={() => onViewToggle('list')}
        activeOpacity={0.7}
      >
        <List 
          size={20} 
          color={viewType === 'list' ? colors.white : colors.textSecondary} 
        />
      </TouchableOpacity>
    </View>
  </View>
);

// Swipeable List Item Component
const SwipeableListItem = ({ 
  item, 
  onPress, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  colors,
  openItemId,
  setOpenItemId
}: {
  item: any;
  onPress: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  colors: any;
  openItemId: string | null;
  setOpenItemId: (id: string | null) => void;
}) => {
  const translateX = new Animated.Value(0);
  const isOpen = openItemId === item.id;

  // Auto-close when another item is opened
  useEffect(() => {
    if (!isOpen) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [isOpen]);

  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;
    
    // Only allow left swipe (negative values), clamp right swipe at 0
    const clampedValue = Math.min(0, Math.max(-REVEAL_WIDTH, translationX));
    translateX.setValue(clampedValue);
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      // Only allow left swipe (negative values) with higher threshold
      if (translationX < SWIPE_THRESHOLD && translationX < 0) {
        // Reveal actions (swipe left)
        Animated.spring(translateX, {
          toValue: -REVEAL_WIDTH,
          useNativeDriver: false,
        }).start();
        setOpenItemId(item.id);
      } else {
        // Hide actions or prevent right swipe
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        setOpenItemId(null);
      }
    }
  };

  const hideActions = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
    setOpenItemId(null);
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Hidden Action Buttons */}
      <View style={styles.hiddenActions}>
        <TouchableOpacity 
          style={[styles.actionButtonHidden, { backgroundColor: item.status === 'active' ? colors.warning : colors.success }]}
          onPress={() => {
            onToggleStatus();
            hideActions();
          }}
          activeOpacity={0.7}
        >
          {item.status === 'active' ? (
            <EyeOff size={20} color={colors.white} />
          ) : (
            <Eye size={20} color={colors.white} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButtonHidden, { backgroundColor: colors.primary }]}
          onPress={() => {
            onEdit();
            hideActions();
          }}
          activeOpacity={0.7}
        >
          <Edit size={20} color={colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButtonHidden, { backgroundColor: colors.error }]}
          onPress={() => {
            onDelete();
            hideActions();
          }}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View 
          style={[
            styles.swipeableContent,
            { transform: [{ translateX }] }
          ]}
        >
          <TouchableOpacity 
            style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={styles.listItemContent}>
              <View style={styles.listItemInfo}>
                <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title || 'Başlık yok'}
                </Text>
                <Text style={[styles.listItemPrice, { color: colors.primary }]}>
                  ₺{item.budget || 0} bütçe
                </Text>
                <Text style={[styles.listItemLocation, { color: colors.textSecondary }]}>
                  {item.location || '-'}
                </Text>
              </View>
              
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.status === 'active' ? colors.success : colors.warning }
              ]}>
                <Text style={[styles.statusText, { color: colors.white }]}>
                  {item.status === 'active' ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const MyListingsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('card');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const loadMyListings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetchMyListings(user.id);
      if (response.error) {
        Alert.alert('Hata', 'İlanlarınız yüklenirken bir hata oluştu.');
        setListings([]);
      } else {
        setListings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading my listings:', error);
      Alert.alert('Hata', 'İlanlarınız yüklenirken bir hata oluştu.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyListings();
    setRefreshing(false);
  };

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    if (!user) return;

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const result = await updateListingStatus(listingId, user.id, newStatus);
      if (result) {
        setListings(prev => 
          prev.map(listing => 
            listing.id === listingId 
              ? { ...listing, status: newStatus }
              : listing
          )
        );
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      Alert.alert('Hata', 'İlan durumu güncellenirken bir hata oluştu.');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!user) return;

    Alert.alert(
      'İlanı Sil',
      'Bu ilanı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteListing(listingId, user.id);
              if (success) {
                setListings(prev => prev.filter(listing => listing.id !== listingId));
              }
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Hata', 'İlan silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadMyListings();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} testID="loading-spinner">
        <LoadingSpinner />
      </View>
    );
  }

  const renderCardItem = ({ item }: { item: any }) => (
    <View style={styles.listingContainer}>
      <View style={styles.cardWrapper}>
        <ListingCard
          listing={item}
          onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          style={styles.listingCard}
          screenName="MyListingsScreen"
          sectionName="My Listings"
        />
        <View style={styles.cardActionOverlay}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { backgroundColor: item.status === 'active' ? colors.warning + '15' : colors.success + '15' }
            ]}
            onPress={() => handleToggleStatus(item.id, item.status)}
            activeOpacity={0.7}
          >
            {item.status === 'active' ? (
              <EyeOff size={16} color={colors.warning} />
            ) : (
              <Eye size={16} color={colors.success} />
            )}
            <Text style={[
              styles.actionButtonText, 
              { color: item.status === 'active' ? colors.warning : colors.success }
            ]}>
              {item.status === 'active' ? 'Pasif Et' : 'Aktif Et'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => navigation.navigate('EditListing', { listingId: item.id })}
            activeOpacity={0.7}
          >
            <Edit size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Düzenle
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => handleDeleteListing(item.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Sil
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <SwipeableListItem
      item={item}
      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
      onToggleStatus={() => handleToggleStatus(item.id, item.status)}
      onEdit={() => navigation.navigate('EditListing', { listingId: item.id })}
      onDelete={() => handleDeleteListing(item.id)}
      colors={colors}
      openItemId={openItemId}
      setOpenItemId={setOpenItemId}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        onBack={() => navigation.goBack()}
        viewType={viewType}
        onViewToggle={setViewType}
        colors={colors}
      />
      <FlatList
        testID="listings-flatlist"
        data={listings}
        renderItem={viewType === 'card' ? renderCardItem : renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz ilanınız yok
            </Text>
            <Button
              title="İlan Oluştur"
              onPress={() => navigation.navigate('CreateListing')}
              style={styles.createButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  listingContainer: {
    marginBottom: 20,
  },
  listingCard: {
    width: '100%',
    marginBottom: 0,
    borderRadius: 16,
  },
  cardWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardActionOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  createButton: {
    marginTop: 12,
    paddingHorizontal: 32,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    marginLeft: 'auto',
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  swipeableContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  hiddenActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  actionButtonHidden: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeableContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemLocation: {
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 36,
  },
  toggleButton: {
    // Additional styles will be applied dynamically
  },
  editButton: {
    // Additional styles will be applied dynamically
  },
  deleteButton: {
    // Additional styles will be applied dynamically
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  listActionButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default MyListingsScreen; 