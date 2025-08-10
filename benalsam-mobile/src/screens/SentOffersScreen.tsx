import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { getOrCreateConversation } from '../services/conversationService';
import { canUserReview } from '../services/reviewService';
import { formatDate } from '../types';

// 🚀 React Query Hooks - YENİ!
import { useSentOffers, useDeleteOffer } from '../hooks/queries/useOffers';
import { Button, Card, Badge, Avatar } from '../components';
import { 
  Send, 
  ArrowLeft, 
  Package,
  DollarSign,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  User,
  Calendar,
  Home,
  MessageSquare,
  ChevronRight
} from 'lucide-react-native';

const SentOffersScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  // 🚀 React Query Hooks - YENİ VE GÜÇLÜ!
  const { 
    data: sentOffers = [], 
    isLoading: loading, 
    error: offersError,
    refetch: refetchOffers 
  } = useSentOffers();
  
  const deleteOfferMutation = useDeleteOffer();
  
  // Legacy state - sadece reviewable offers için
  const [refreshing, setRefreshing] = useState(false);
  const [reviewableOffers, setReviewableOffers] = useState<{[key: string]: boolean}>({});
  // Yeni state - expanded items için
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});

  // Toggle expanded state
  const toggleExpanded = (offerId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
  };

  // Legacy data loading - sadece review status için
  const loadReviewStatus = async () => {
    if (!user || !sentOffers.length) return;
    
    try {
      const reviewStatus: {[key: string]: boolean} = {};
      for (const offer of sentOffers) {
        if (offer.status === 'accepted') {
          reviewStatus[offer.id] = await canUserReview(user.id, offer.id);
        } else {
          reviewStatus[offer.id] = false;
        }
      }
      setReviewableOffers(reviewStatus);
    } catch (error) {
      console.error('Error loading review status:', error);
    }
  };

  useEffect(() => {
    loadReviewStatus();
  }, [sentOffers, user]);

  // 🔄 Refresh function - React Query refetch'i kullanıyor!
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchOffers();
      await loadReviewStatus();
    } catch (error) {
      console.error('Error refreshing sent offers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { 
          color: '#FF6B35', 
          backgroundColor: '#FFF3E0', 
          borderColor: '#FF6B35',
          icon: Clock,
          label: 'Bekliyor'
        };
      case 'accepted':
        return { 
          color: '#059669', 
          backgroundColor: '#D1FAE5', 
          borderColor: '#059669',
          icon: CheckCircle,
          label: 'Kabul Edildi'
        };
      case 'rejected':
        return { 
          color: '#DC2626', 
          backgroundColor: '#FEE2E2', 
          borderColor: '#DC2626',
          icon: XCircle,
          label: 'Reddedildi'
        };
      case 'cancelled':
        return { 
          color: '#6B7280', 
          backgroundColor: '#F3F4F6', 
          borderColor: '#6B7280',
          icon: XCircle,
          label: 'İptal Edildi'
        };
      default:
        return { 
          color: '#6B7280', 
          backgroundColor: '#F9FAFB', 
          borderColor: '#9CA3AF',
          icon: Clock,
          label: 'Bilinmiyor'
        };
    }
  };

  // 🚀 React Query Mutation - Optimistic Updates ile!
  const handleDeleteOffer = async (offerId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Teklifi Geri Çekmek İstediğinize Emin Misiniz?',
      'Bu işlem geri alınamaz. Teklifiniz kalıcı olarak silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Geri Çek',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOfferMutation.mutateAsync(offerId);
              Alert.alert('Başarılı', 'Teklifiniz başarıyla silindi.');
            } catch (error) {
              console.error('Error deleting offer:', error);
              Alert.alert('Hata', 'Teklif silinirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleStartOrGoToConversation = async (offer: any) => {
    if (!user || !offer.listing || !offer.listing.user) {
      Alert.alert('Hata', 'Sohbet başlatılamadı, kullanıcı veya ilan bilgileri eksik.');
      return;
    }
    
    try {
      let conversationId = offer.conversation_id;
      if (!conversationId) {
        conversationId = await getOrCreateConversation(user.id, offer.listing.user.id, offer.id, offer.listing.id);
      }
      
      if (conversationId) {
        // React Query otomatik olarak cache'i güncelleyecek
        navigation.navigate('Conversation', { conversationId });
      } else {
        Alert.alert('Sohbet Başlatılamadı', 'Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Hata', 'Sohbet başlatılırken bir sorun oluştu.');
    }
  };

  const handleViewOfferedItem = (item: any) => {
    if (item && item.id) {
      Alert.alert(
        'Ürün Detayı (Yakında)', 
        `${item.name} adlı ürünün detay sayfası yakında eklenecektir. Şimdilik envanter sayfanızdan kontrol edebilirsiniz.`,
        [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Envantere Git', onPress: () => navigation.navigate('Inventory') }
        ]
      );
    } else {
      Alert.alert('Ürün Bilgisi Yok', 'Bu teklifte bir ürün belirtilmemiş.');
    }
  };

  const handleOpenLeaveReview = (offer: any) => {
    navigation.navigate('LeaveReview', { offerId: offer.id });
  };



  // Hata durumunu kontrol et
  useEffect(() => {
    if (offersError) {
      console.error('Error fetching sent offers:', offersError);
      Alert.alert('Hata', 'Teklifler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  }, [offersError]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.center}>
          <View style={[styles.loadingIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Send size={32} color={colors.primary} />
          </View>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Gönderdiğim teklifler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Send size={20} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gönderdiğim Teklifler</Text>
        </View>
        
        <View style={styles.headerSpace} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {sentOffers.length > 0 ? (
          sentOffers.map(offer => {
            const statusInfo = getStatusInfo(offer.status);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedItems[offer.id];
            
            return (
              <TouchableOpacity
                key={offer.id}
                style={[
                  styles.listItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: "#F0F0F0",
                    borderWidth: 1,
                    borderRadius: 8,
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
                onPress={() => toggleExpanded(offer.id)}
                activeOpacity={0.7}
              >
                {/* Compact Header */}
                <View style={styles.listItemHeader}>
                  <View style={styles.listItemMain}>
                    <Text
                      style={[styles.listItemTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {offer.listing?.title || "İlan Başlığı Yok"}
                    </Text>
                    <View style={styles.listItemMeta}>
                      <Calendar size={12} color={colors.textSecondary} />
                      <Text
                        style={[
                          styles.listItemDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatDate(offer.created_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.listItemActions}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          borderColor: "#F5F5F5",
                          borderWidth: 2,
                          borderRadius: 4,
                          padding: 4,
                        },
                      ]}
                    >
                      <StatusIcon size={16} color={statusInfo.color} />
                      {isExpanded && (
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: statusInfo.color,
                              fontSize: 11,
                              marginLeft: 4,
                            },
                          ]}
                        >
                          {statusInfo.label}
                        </Text>
                      )}
                    </View>
                    <ChevronRight
                      size={16}
                      color={colors.textSecondary}
                      style={[
                        styles.expandIcon,
                        {
                          transform: [
                            { rotate: isExpanded ? "90deg" : "0deg" },
                          ],
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    <View style={styles.offerDetails}>
                      <View style={styles.detailSection}>
                        <View style={styles.detailHeader}>
                          <Package size={14} color={colors.textSecondary} />
                          <Text
                            style={[
                              styles.detailLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Teklif Edilen Ürünüm
                          </Text>
                        </View>
                        {offer.inventory_item ? (
                          <TouchableOpacity
                            style={[
                              styles.itemCard,
                              { backgroundColor: colors.background },
                            ]}
                            onPress={() =>
                              handleViewOfferedItem(offer.inventory_item)
                            }
                          >
                            <Avatar
                              size="sm"
                              source={
                                offer.inventory_item.main_image_url ||
                                offer.inventory_item.image_url
                              }
                              name={offer.inventory_item.name}
                            />
                            <View style={styles.itemInfo}>
                              <Text
                                style={[
                                  styles.itemName,
                                  { color: colors.text },
                                ]}
                              >
                                {offer.inventory_item.name || "Ürün Adı Yok"}
                              </Text>
                              <Text
                                style={[
                                  styles.itemCategory,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {offer.inventory_item.category ||
                                  "Kategori Yok"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <Text
                            style={[
                              styles.noItemText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Bu teklifte ürün belirtilmemiş.
                          </Text>
                        )}
                      </View>

                      <View style={styles.detailSection}>
                        <View style={styles.detailHeader}>
                          <DollarSign size={14} color={colors.textSecondary} />
                          <Text
                            style={[
                              styles.detailLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Ek Nakit Teklifim
                          </Text>
                        </View>
                        <Text
                          style={[styles.priceText, { color: colors.primary }]}
                        >
                          {offer.offered_price
                            ? `${offer.offered_price.toLocaleString()} ₺`
                            : "Nakit teklif yok"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.messageSection}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Mesajım:
                      </Text>
                      <View
                        style={[
                          styles.messageBox,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Text
                          style={[styles.messageText, { color: colors.text }]}
                        >
                          {offer.message || "Ek mesaj yok."}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    <View style={styles.offerFooter}>
                      <View style={styles.userInfo}>
                        {offer.listing?.user ? (
                          <>
                            <Avatar
                              size="sm"
                              source={offer.listing.user.avatar_url}
                              name={offer.listing.user.name}
                            />
                            <Text
                              style={[
                                styles.userText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              İlan Sahibi:
                              <Text
                                style={[
                                  styles.userName,
                                  { color: colors.primary },
                                ]}
                              >
                                {" "}
                                {offer.listing.user.name || "Bilinmiyor"}
                              </Text>
                            </Text>
                          </>
                        ) : (
                          <Text
                            style={[
                              styles.userText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            İlan Sahibi: Bilinmiyor
                          </Text>
                        )}
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.messageButton,
                            { borderColor: colors.primary },
                          ]}
                          onPress={() => handleStartOrGoToConversation(offer)}
                        >
                          <MessageSquare size={12} color={colors.primary} />
                          <Text
                            style={[
                              styles.actionButtonText,
                              { color: colors.primary, fontSize: 12 },
                            ]}
                          >
                            {offer.conversation_id
                              ? "Sohbete Git"
                              : "Mesaj Gönder"}
                          </Text>
                        </TouchableOpacity>

                        {offer.status === "accepted" &&
                          reviewableOffers[offer.id] && (
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                styles.reviewButton,
                                { borderColor: colors.textSecondary },
                              ]}
                              onPress={() => handleOpenLeaveReview(offer)}
                            >
                              <Star size={12} color={colors.textSecondary} />
                              <Text
                                style={[
                                  styles.actionButtonText,
                                  { color: colors.textSecondary, fontSize: 12 },
                                ]}
                              >
                                Değerlendir
                              </Text>
                            </TouchableOpacity>
                          )}

                        {(offer.status === "pending" ||
                          offer.status === "cancelled") && (
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              styles.deleteButton,
                              {
                                borderColor: "#ef4444",
                                opacity: deleteOfferMutation.isPending
                                  ? 0.5
                                  : 1,
                              },
                            ]}
                            onPress={() => handleDeleteOffer(offer.id)}
                            disabled={deleteOfferMutation.isPending}
                          >
                            <Trash2 size={12} color="#ef4444" />
                            <Text
                              style={[
                                styles.actionButtonText,
                                { color: "#ef4444", fontSize: 12 },
                              ]}
                            >
                              {deleteOfferMutation.isPending
                                ? "İşleniyor"
                                : "Geri Çek"}
                            </Text>
                            {deleteOfferMutation.isPending && (
                              <ActivityIndicator
                                size="small"
                                color="#ef4444"
                                style={styles.buttonLoader}
                              />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Send size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Henüz hiç teklif göndermemişsiniz
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Beğendiğiniz ilanlara teklif yaparak takas dünyasına adım atın!
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Home')}
            >
              <Home size={18} color="white" />
              <Text style={styles.emptyButtonText}>
                İlanları Keşfet
              </Text>
            </TouchableOpacity>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingSpinner: {
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpace: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  offerCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  titleTouchable: {
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerDate: {
    fontSize: 12,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  offerDetails: {
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCategory: {
    fontSize: 12,
  },
  noItemText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
  },
  messageSection: {
    marginBottom: 16,
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  offerFooter: {
    flexDirection: 'column',
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  buttonLoader: {
    marginLeft: 6,
  },
  messageButton: {
    borderColor: '#3b82f6',
  },
  reviewButton: {
    borderColor: '#f59e0b',
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listItem: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Default border for compact view
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemMain: {
    flex: 1,
    marginRight: 10,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemDate: {
    fontSize: 12,
    marginLeft: 6,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    marginLeft: 8,
  },
  expandedContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
});

export default SentOffersScreen; 