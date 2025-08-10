import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Heart, 
  Eye, 
  MessageCircle,
  Star,
  User,
  Tag,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react-native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Avatar } from '../components/Avatar';
import PinchToZoom from '../components/PinchToZoom';
import { useListing } from '../hooks/queries/useListings';
import { useToggleFavorite } from '../hooks/queries/useFavorites';
import { ListingWithUser } from '../services/listingService/core';
import { UseQueryResult } from '@tanstack/react-query';
import analyticsService from '../services/analyticsService';

const { width: screenWidth } = Dimensions.get('window');

interface NavigationProps {
  route: {
    params: {
      listingId: string;
    };
  };
  navigation: any;
}

interface ExtendedListingWithUser extends ListingWithUser {
  views_count?: number;
  offers_count?: number;
  subcategory?: string;
}

const ListingDetailScreen = ({ route, navigation }: NavigationProps) => {
  const { listingId } = route.params;
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  const { 
    data: listing,
    isLoading,
    isError,
    error,
    refetch
  } = useListing(listingId) as UseQueryResult<ExtendedListingWithUser, Error>;
  
  const { toggleFavorite } = useToggleFavorite();

  // Track listing view when screen loads
  useEffect(() => {
    console.log('🔍 ListingDetailScreen useEffect triggered');
    console.log('🔍 listing:', listing);
    console.log('🔍 listingId:', listingId);
    
    if (listing) {
      console.log('🔍 About to track LISTING_VIEW event');
      console.log('🔍 Event data:', {
        listing_id: listingId,
        listing_title: listing.title,
        listing_category: listing.category,
        listing_price: listing.budget,
        listing_location: listing.location,
        user_id: listing.user_id
      });
      
      analyticsService.trackEvent('LISTING_VIEW', {
        listing_id: listingId,
        listing_title: listing.title,
        listing_category: listing.category,
        listing_price: listing.budget,
        listing_location: listing.location,
        user_id: listing.user_id
      }).then(success => {
        console.log('🔍 LISTING_VIEW tracking result:', success);
      }).catch(error => {
        console.error('🔍 LISTING_VIEW tracking error:', error);
      });
    } else {
      console.log('🔍 No listing data available for tracking');
    }
  }, [listing, listingId]); // Dependencies for useEffect

  const handleProfilePress = () => {
    if (!listing?.user_id) return;

    navigation.navigate('PublicProfile', { 
      userId: listing.user_id
    });
  };

  const handleMakeOffer = () => {
    if (!user) {
      Alert.alert(
        'Giriş Yapın',
        'Teklif vermek için önce giriş yapmalısınız.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { 
            text: 'Giriş Yap', 
            onPress: () => navigation.navigate('Auth', { screen: 'Login' })
          }
        ]
      );
      return;
    }

    if (!listing) {
      Alert.alert('Hata', 'İlan bilgileri yüklenemedi.');
      return;
    }

    if (user.id === listing.user_id) {
      Alert.alert('Uyarı', 'Kendi ilanınıza teklif veremezsiniz.');
      return;
    }

    // Track offer sent event
    analyticsService.trackEvent('OFFER_SENT', {
      listing_id: listingId,
      listing_title: listing.title,
      listing_category: listing.category,
      listing_price: listing.budget,
      listing_location: listing.location,
      recipient_id: listing.user_id
    });

    navigation.navigate('MakeOffer', { 
      listingId: listing.id,
      userId: user.id,
      listingTitle: listing.title,
      currentPrice: listing.budget
    });
  };

  const handleFavoritePress = async () => {
    if (!user) {
      Alert.alert(
        'Giriş Yapın',
        'Favorilere eklemek için önce giriş yapmalısınız.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { 
            text: 'Giriş Yap', 
            onPress: () => navigation.navigate('Auth', { screen: 'Login' })
          }
        ]
      );
      return;
    }

    try {
      await toggleFavorite(listingId);
      
      // Track favorite added event
      analyticsService.trackEvent('FAVORITE_ADDED', {
        listing_id: listingId,
        listing_title: listing?.title,
        listing_category: listing?.category,
        listing_price: listing?.budget,
        listing_location: listing?.location,
        user_id: listing?.user_id
      });
      
      refetch();
    } catch (error) {
      Alert.alert('Hata', 'Favorilere eklenirken bir hata oluştu.');
    }
  };

  const handleEditListing = () => {
    navigation.navigate('EditListing', { 
      listingId: listing?.id,
      listingTitle: listing?.title
    });
  };

  const handleMessagePress = () => {
    console.log('🔍 handleMessagePress called');
    
    if (!user) {
      console.log('❌ User not logged in');
      Alert.alert(
        'Giriş Yapın',
        'Mesaj göndermek için önce giriş yapmalısınız.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { 
            text: 'Giriş Yap', 
            onPress: () => navigation.navigate('Auth', { screen: 'Login' })
          }
        ]
      );
      return;
    }

    if (!listing) {
      console.log('❌ Listing not available');
      Alert.alert('Hata', 'İlan bilgileri yüklenemedi.');
      return;
    }

    if (user.id === listing.user_id) {
      console.log('❌ User trying to message their own listing');
      Alert.alert('Uyarı', 'Kendi ilanınıza mesaj gönderemezsiniz.');
      return;
    }

    console.log('✅ About to track MESSAGE_SENT event');
    console.log('✅ Event data:', {
      listing_id: listingId,
      listing_title: listing.title,
      listing_category: listing.category,
      recipient_id: listing.user_id,
      message_type: 'text'
    });

    // Track message sent event
    analyticsService.trackEvent('MESSAGE_SENT', {
      listing_id: listingId,
      listing_title: listing.title,
      listing_category: listing.category,
      recipient_id: listing.user_id,
      message_type: 'text'
    });

    console.log('✅ MESSAGE_SENT event tracked, navigating to Chat');

    navigation.navigate('Chat', { 
      recipientId: listing.user_id,
      listingId: listing.id,
      listingTitle: listing.title
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !listing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error instanceof Error ? error.message : 'İlan yüklenirken bir hata oluştu'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryButtonText, { color: colors.white }]}>
              Tekrar Dene
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.primary }]}>İlanlara Geri Dön</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <PinchToZoom
            source={{ uri: listing?.main_image_url || '' }}
            style={styles.image}
          />
          <View style={[styles.badge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>normal</Text>
          </View>
          <TouchableOpacity 
            style={[styles.favoriteButton, { backgroundColor: colors.surface }]}
            onPress={handleFavoritePress}
          >
            <Heart
              size={20}
              color={listing?.is_favorited ? colors.error : colors.textSecondary}
              fill={listing?.is_favorited ? colors.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{listing.title}</Text>
          
          {/* Kategori ve Detaylar */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Tag size={16} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.primary }]}>
                {listing.category}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {listing.location}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {new Date(listing.created_at).toLocaleString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.text }]}>
            {listing.description}
          </Text>

          {/* İlan Sahibi */}
          <View style={[styles.ownerCard, { backgroundColor: colors.surface }]}>
            <View style={styles.ownerTitleRow}>
              <User size={20} color={colors.text} />
              <Text style={[styles.ownerTitle, { color: colors.text }]}>İlan Sahibi</Text>
            </View>
            <View style={styles.ownerInfo}>
              <Avatar
                size="md"
                source={listing?.user?.avatar_url}
                name={listing?.user?.name || 'Anonim'}
              />
              <View style={styles.ownerDetails}>
                <Text style={[styles.ownerName, { color: colors.text }]}>
                  {listing?.user?.name || 'Anonim'}
                </Text>
                <View style={styles.ratingContainer}>
                  <Star size={16} color={colors.warning} fill={colors.warning} />
                  <Text style={[styles.ratingValue, { color: colors.textSecondary }]}>
                    N/A değerlendirme
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: colors.background }]}
              onPress={handleProfilePress}
            >
              <User size={16} color={colors.primary} />
              <Text style={[styles.profileButtonText, { color: colors.primary }]}>
                Profile Git
              </Text>
            </TouchableOpacity>
          </View>

          {/* İstatistikler */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Eye size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {listing.views_count || 0} Görüntülenme
              </Text>
            </View>
            <View style={styles.stat}>
              <MessageCircle size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {listing.offers_count || 0} Teklif
              </Text>
            </View>
          </View>

          {/* Fiyat */}
          <View style={styles.priceSection}>
            <DollarSign size={24} color={colors.primary} />
            <Text style={[styles.price, { color: colors.primary }]}>
              {`${listing?.budget.toLocaleString('tr-TR')} ₺`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
        {user?.id === listing?.user_id ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEditListing}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              İlanı Düzenle
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleMakeOffer}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              Teklif Ver
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth * 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 0,
  },
  actionButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ownerCard: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  ownerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ownerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    marginLeft: 4,
  },
  profileButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ListingDetailScreen; 