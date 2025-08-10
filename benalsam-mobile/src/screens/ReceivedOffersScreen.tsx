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
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { getOrCreateConversation } from '../services/conversationService';
import { canUserReview } from '../services/reviewService';
import { formatDate } from '../types';

// 🚀 React Query Hooks - YENİ!
import { useReceivedOffers, useUpdateOfferStatus } from '../hooks/queries/useOffers';
import { Avatar, Badge } from '../components';
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  MessageCircle, 
  User, 
  Check, 
  X, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Inbox
} from 'lucide-react-native';

const ReceivedOffersScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  // 🚀 React Query Hooks - YENİ VE GÜÇLÜ!
  const { 
    data: receivedOffers = [], 
    isLoading: loading, 
    error: offersError,
    refetch: refetchOffers 
  } = useReceivedOffers();
  
  const updateOfferStatusMutation = useUpdateOfferStatus();
  
  // Legacy state - sadece reviewable offers için
  const [refreshing, setRefreshing] = useState(false);
  const [reviewableOffers, setReviewableOffers] = useState<{[key: string]: boolean}>({});

  // Legacy data loading - sadece review status için
  const loadReviewStatus = async () => {
    if (!user || !receivedOffers.length) return;
    
    try {
      const reviewStatus: {[key: string]: boolean} = {};
      for (const offer of receivedOffers) {
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
  }, [receivedOffers, user]);

  // 🔄 Refresh function - React Query refetch'i kullanıyor!
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchOffers();
      await loadReviewStatus();
    } catch (error) {
      console.error('Error refreshing received offers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { 
          label: 'Bekliyor',
          icon: Clock,
          colors: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' }
        };
      case 'accepted':
        return { 
          label: 'Kabul Edildi',
          icon: CheckCircle,
          colors: { bg: '#D1FAE5', text: '#059669', border: '#10B981' }
        };
      case 'rejected':
        return { 
          label: 'Reddedildi',
          icon: XCircle,
          colors: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' }
        };
      case 'cancelled':
        return { 
          label: 'İptal Edildi',
          icon: XCircle,
          colors: { bg: '#F3F4F6', text: '#6B7280', border: '#9CA3AF' }
        };
      default:
        return { 
          label: 'Bilinmiyor',
          icon: Clock,
          colors: { bg: '#F9FAFB', text: '#6B7280', border: '#9CA3AF' }
        };
    }
  };

  // 🚀 React Query Mutation - Optimistic Updates ile!
  const handleUpdateStatus = async (offerId: string, status: string, offeringUserId: string, listingId: string) => {
    if (!user) return;
    
    try {
      await updateOfferStatusMutation.mutateAsync({ offerId, newStatus: status });
      
      Alert.alert(
        'Başarılı', 
        `Teklif ${status === 'accepted' ? 'kabul edildi' : 'reddedildi'}.`
      );
      
      if (status === 'accepted') {
        // Review status'unu güncelle
        const canReview = await canUserReview(user.id, offerId);
        setReviewableOffers(prev => ({...prev, [offerId]: canReview}));
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      Alert.alert('Hata', 'Teklif durumu güncellenirken bir sorun oluştu.');
    }
  };

  const handleStartOrGoToConversation = async (offer: any) => {
    if (!user || !offer.profiles) {
      Alert.alert('Hata', 'Sohbet başlatılamadı, kullanıcı bilgileri eksik.');
      return;
    }
    
    try {
      let conversationId = offer.conversation_id;
      if (!conversationId) {
        conversationId = await getOrCreateConversation(user.id, offer.offering_user_id, offer.id, offer.listing_id);
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
        `${item.name} adlı ürünün detay sayfası yakında eklenecektir.`
      );
    } else {
      Alert.alert('Ürün Bilgisi Yok', 'Bu teklifte bir ürün belirtilmemiş.');
    }
  };

  const handleOpenLeaveReview = (offer: any) => {
    navigation.navigate('LeaveReview', { offerId: offer.id });
  };



  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Teklifler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Inbox size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Aldığım Teklifler
          </Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {receivedOffers.length > 0 ? (
          receivedOffers.map(offer => {
            const offeredItem = offer.inventory_item;
            const statusConfig = getStatusConfig(offer.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <View 
                key={offer.id} 
                style={[
                  styles.offerCard, 
                  { 
                    backgroundColor: '#2a2b2e',
                    borderColor: colors.border + '40',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4
                  }
                ]}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.listingInfo}>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('ListingDetail', { listingId: offer.listing?.id })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
                        {offer.listing?.title || "İlan Başlığı Yok"}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.offerDate, { color: colors.textSecondary }]}>
                      {formatDate(offer.created_at)}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: statusConfig.colors.bg,
                      borderColor: statusConfig.colors.border
                    }
                  ]}>
                    <StatusIcon size={14} color={statusConfig.colors.text} />
                    <Text style={[styles.statusText, { color: statusConfig.colors.text }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Offered Item Section */}
                {offer.inventory_item && offer.inventory_item.id ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Package size={18} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Teklif Edilen Ürün
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleViewOfferedItem(offer.inventory_item)}
                      activeOpacity={0.8}
                    >
                      <Avatar 
                        size="md" 
                        source={offer.inventory_item.main_image_url || offer.inventory_item.image_url}
                        name={offer.inventory_item.name}
                      />
                      <View style={styles.itemDetails}>
                        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                          {offer.inventory_item.name || "Ürün Adı Yok"}
                        </Text>
                        <Text style={[styles.itemCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                          {offer.inventory_item.category || "Kategori Yok"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Cash Offer Section */}
                {offer.offered_price ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <DollarSign size={18} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Ek Nakit Teklifi
                      </Text>
                    </View>
                    
                    <View style={[styles.priceCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>
                        {offer.offered_price.toLocaleString()} ₺
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <DollarSign size={18} color={colors.textSecondary} />
                      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        Ek Nakit Teklifi
                      </Text>
                    </View>
                    
                    <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                      Bu teklifte nakit teklifi yok
                    </Text>
                  </View>
                )}

                {/* Message Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MessageCircle size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Teklif Mesajı
                    </Text>
                  </View>
                  
                  <View style={[styles.messageCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.messageText, { color: colors.text }]}>
                      {offer.message || "Ek mesaj yok."}
                    </Text>
                  </View>
                </View>

                {/* User Info & Actions */}
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                  {/* User Info */}
                  <View style={styles.userSection}>
                    <User size={16} color={colors.textSecondary} />
                    <Text style={[styles.userLabel, { color: colors.textSecondary }]}>
                      Teklif Veren:
                    </Text>
                    {offer.profiles ? (
                      <View style={styles.userInfo}>
                        <Avatar 
                          size="sm" 
                          source={offer.profiles.avatar_url}
                          name={offer.profiles.name}
                        />
                        <Text style={[styles.userName, { color: colors.text }]}>
                          {offer.profiles.name || 'Bilinmiyor'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.userName, { color: colors.textSecondary }]}>
                        Bilinmiyor
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {/* Message Button */}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.messageButton, { borderColor: colors.primary }]}
                      onPress={() => handleStartOrGoToConversation(offer)}
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        {offer.conversation_id ? 'Sohbete Git' : 'Mesaj Gönder'}
                      </Text>
                    </TouchableOpacity>

                    {/* Status-specific buttons */}
                    {offer.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleUpdateStatus(offer.id, 'accepted', offer.offering_user_id, offer.listing_id)}
                          disabled={updateOfferStatusMutation.isPending}
                          activeOpacity={0.8}
                        >
                          {updateOfferStatusMutation.isPending ? (
                            <ActivityIndicator size={14} color="#FFFFFF" />
                          ) : (
                            <Check size={16} color="#FFFFFF" />
                          )}
                          <Text style={styles.acceptButtonText}>
                            {updateOfferStatusMutation.isPending ? 'İşleniyor' : 'Kabul Et'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleUpdateStatus(offer.id, 'rejected', offer.offering_user_id, offer.listing_id)}
                          disabled={updateOfferStatusMutation.isPending}
                          activeOpacity={0.8}
                        >
                          {updateOfferStatusMutation.isPending ? (
                            <ActivityIndicator size={14} color="#FFFFFF" />
                          ) : (
                            <X size={16} color="#FFFFFF" />
                          )}
                          <Text style={styles.rejectButtonText}>
                            {updateOfferStatusMutation.isPending ? 'İşleniyor' : 'Reddet'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* Review button for accepted offers */}
                    {offer.status === 'accepted' && reviewableOffers[offer.id] && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reviewButton]}
                        onPress={() => handleOpenLeaveReview(offer)}
                        activeOpacity={0.8}
                      >
                        <Star size={16} color="#FFFFFF" />
                        <Text style={styles.reviewButtonText}>Değerlendir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
              <Inbox size={48} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Henüz Hiç Teklif Almamışsınız
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              İlanlarınız ilgi gördükçe burada teklifleri görebileceksiniz.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Ana Sayfaya Dön</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  offerCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  listingInfo: {
    flex: 1,
    marginRight: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  offerDate: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
  },
  priceCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userLabel: {
    fontSize: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  messageButton: {
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  reviewButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceivedOffersScreen; 