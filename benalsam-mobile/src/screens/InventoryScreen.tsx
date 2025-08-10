import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { 
  Plus, 
  Package, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Grid,
  List,
  Sparkles,
  Star
} from 'lucide-react-native';
import { Card, Button } from '../components';
import { fetchInventoryItems, deleteInventoryItem } from '../services/inventoryService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 16 padding + 16 gap
const SWIPE_THRESHOLD = -screenWidth * 0.4; // 40% of screen width - more deliberate swipe needed
const REVEAL_WIDTH = 140; // Width for 2 buttons (Edit + Delete)

type ViewType = 'card' | 'list';

// Swipeable List Item Component
const SwipeableListItem = ({ 
  item, 
  onEdit, 
  onDelete, 
  colors,
  openItemId,
  setOpenItemId,
  viewType,
  deletingItem
}: {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  colors: any;
  openItemId: string | null;
  setOpenItemId: (id: string | null) => void;
  viewType: ViewType;
  deletingItem: string | null;
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

  const renderContent = () => {
    if (viewType === 'card') {
      return (
        <Card style={{
          ...styles.gridCard,
          width: cardWidth,
          backgroundColor: '#23262B',
          borderWidth: 1,
          borderColor: 'rgba(80,80,80,0.5)',
        }}>
          <View style={styles.gridImageContainer}>
            {item.main_image_url || item.image_url ? (
              <Image 
                source={{ uri: item.main_image_url || item.image_url }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.surface }]}>
                <Package size={24} color={colors.textSecondary} />
              </View>
            )}
          </View>
          
          <View style={styles.gridContent}>
            <Text style={[styles.gridItemName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.gridItemCategory, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.category}
            </Text>
          </View>

          {/* Action buttons below text for card view */}
          <View style={styles.cardActionsBottom}>
            <TouchableOpacity 
              style={[styles.cardActionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                onEdit();
                hideActions();
              }}
              activeOpacity={0.7}
            >
              <Edit3 size={14} color={colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cardActionButton, { backgroundColor: colors.error }]}
              onPress={() => {
                onDelete();
                hideActions();
              }}
              activeOpacity={0.7}
              disabled={deletingItem === item.id}
            >
              {deletingItem === item.id ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Trash2 size={14} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </Card>
      );
    } else {
      return (
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: '#23262B', // daha açık bir arka plan
          borderRadius: 16,
          minHeight: 56,
          marginBottom: 14,
          padding: 0,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(80,80,80,0.5)', // ince yarı saydam koyu gri çerçeve
        }}>
          <View style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', margin: 10, marginRight: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
            {item.main_image_url || item.image_url ? (
              <Image 
                source={{ uri: item.main_image_url || item.image_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Package size={22} color={colors.textSecondary} />
            )}
          </View>
          <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 10, paddingBottom: 10, paddingRight: 10 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 2, lineHeight: 18 }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 1, lineHeight: 15 }} numberOfLines={1}>
              {item.category}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 15 }} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={[styles.swipeableContainer, viewType === 'card' && styles.cardSwipeableContainer]}>
      {/* Hidden Action Buttons */}
      <View style={styles.hiddenActions}>
        <TouchableOpacity 
          style={[styles.actionButtonHidden, { backgroundColor: colors.primary }]}
          onPress={() => {
            onEdit();
            hideActions();
          }}
          activeOpacity={0.7}
        >
          <Edit3 size={20} color={colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButtonHidden, { backgroundColor: colors.error }]}
          onPress={() => {
            onDelete();
            hideActions();
          }}
          activeOpacity={0.7}
          disabled={deletingItem === item.id}
        >
          {deletingItem === item.id ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Trash2 size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View 
          style={[
            styles.animatedContent,
            { transform: [{ translateX }] }
          ]}
        >
          {renderContent()}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const InventoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  // viewType navigation parametresinden alınacak
  const viewType: ViewType = route.params?.viewType || 'card';

  useEffect(() => {
    if (user) {
      loadInventoryItems();
    }
  }, [user]);

  // Sayfa focus aldığında veriyi yenile (loading spinner olmadan)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadInventoryItems(false);
      }
    }, [user])
  );

  const loadInventoryItems = async (showLoading = true) => {
    if (!user) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      const items = await fetchInventoryItems(user.id);
      setInventoryItems(items || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventoryItems();
    setRefreshing(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Ürünü Sil',
      'Bu ürünü silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingItem(itemId);
            try {
              const success = await deleteInventoryItem(itemId, user.id);
              if (success) {
                setInventoryItems(prev => prev.filter(item => item.id !== itemId));
                setOpenItemId(null);
              } else {
                Alert.alert('Hata', 'Ürün silinirken bir hata oluştu.');
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Hata', 'Ürün silinirken bir hata oluştu.');
            } finally {
              setDeletingItem(null);
            }
          }
        }
      ]
    );
  };

  const handleEditItem = (item: any) => {
    navigation.navigate('InventoryForm', { itemId: item.id });
    setOpenItemId(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <SwipeableListItem
      item={item}
      onEdit={() => handleEditItem(item)}
      onDelete={() => handleDeleteItem(item.id)}
      colors={colors}
      openItemId={openItemId}
      setOpenItemId={setOpenItemId}
      viewType={viewType}
      deletingItem={deletingItem}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Envanter yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {inventoryItems.length > 0 ? (
          <FlatList
            data={inventoryItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: 100 } // Space for fixed button
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            numColumns={viewType === 'card' ? 2 : 1}
            key={viewType} // Force re-render when switching views
            columnWrapperStyle={viewType === 'card' ? styles.gridRow : undefined}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.emptyIcon}
            >
              <Package size={48} color="white" />
              <Sparkles size={24} color="white" style={styles.sparkleIcon} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Envanterin boş görünüyor
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Tekliflerde kullanmak üzere sahip olduğun ürünleri buraya ekleyebilirsin.
            </Text>
          </View>
        )}
      </View>

      {/* Fixed Bottom Add Button */}
      <View style={[styles.fixedBottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <LinearGradient
          colors={['#3B82F6', '#6366F1']}
          style={styles.fixedAddButton}
        >
          <TouchableOpacity
            style={styles.fixedAddButtonContent}
            onPress={() => navigation.navigate('InventoryForm')}
            activeOpacity={0.8}
          >
            <Plus size={24} color={colors.white} />
            <Text style={[styles.fixedAddButtonText, { color: colors.white }]}>
              {inventoryItems.length === 0 ? 'İlk Ürününü Ekle' : 'Yeni Ürün Ekle'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  
  // Grid styles
  gridCard: {
    marginBottom: 16,
    padding: 12,
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridContent: {
    marginBottom: 8,
  },
  gridItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  gridItemCategory: {
    fontSize: 12,
  },
  
  // List styles
  listCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 64,
    paddingVertical: 4,
  },
  listImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 10,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    marginRight: 80, // Space for action buttons
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemCategory: {
    fontSize: 14,
    marginBottom: 2,
  },
  listItemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Common styles
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card action buttons (below text)
  cardActionsBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8,
  },
  cardActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },

  // List action buttons (top-right corner)
  listActionsTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  listActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    transform: [{ rotate: '15deg' }],
  },

  // Fixed bottom button styles
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  fixedAddButton: {
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedAddButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  fixedAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Swipe container styles
  swipeableContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  cardSwipeableContainer: {
    width: cardWidth,
  },
  hiddenActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 8,
    zIndex: 1,
  },
  animatedContent: {
    zIndex: 2,
  },
  actionButtonHidden: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default InventoryScreen; 