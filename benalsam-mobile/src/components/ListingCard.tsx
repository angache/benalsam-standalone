import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Pressable,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../stores';
import { ImageWithFallback } from './ImageWithFallback';
import { Avatar } from './Avatar';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Zap,
  Share2,
  Bookmark,
  Flag
} from 'lucide-react-native';
import { useLongPress } from '../hooks/useLongPress';
import { haptic } from '../utils/hapticFeedback';
import analyticsService from '../services/analyticsService';

interface ListingCardProps {
  listing: any;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  style?: any;
  index?: number;
  isFavoriteLoading?: boolean;
  isGrid?: boolean; // Grid layout için marginRight kontrolü
  showCategoryBadges?: boolean;
  showUrgencyBadges?: boolean;
  numColumns?: number; // Grid sütun sayısı
  screenName?: string; // Analytics için screen adı
  sectionName?: string; // Analytics için section adı
}

const { width: screenWidth } = Dimensions.get('window');
const SIDE_PADDING = 16; // Sol ve sağ kenar mesafesi
const CARD_GAP = 16; // Kartlar arası mesafe (12'den 16'ya artırıldı)

// Dinamik kart genişliği hesaplama fonksiyonu
const getCardWidth = (numColumns: number) => {
  return (screenWidth - SIDE_PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns;
};

// Helper function
const getTimeAgo = (dateString: string) => {
  if (!dateString) return 'Bilinmiyor';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) return 'Az önce';
  if (diffInHours < 24) return `${diffInHours}s önce`;
  if (diffInDays < 7) return `${diffInDays}g önce`;
  return `${Math.floor(diffInDays / 7)}h önce`;
};

const ListingCard: React.FC<ListingCardProps> = React.memo(({
  listing,
  onPress,
  onToggleFavorite,
  style,
  index = 0,
  isFavoriteLoading = false,
  isGrid = false,
  showCategoryBadges = true,
  showUrgencyBadges = true,
  numColumns = 2,
  screenName = 'Unknown',
  sectionName = 'Unknown',
}) => {
  const colors = useThemeColors();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Memoized data processing
  const cardData = useMemo(() => {
    const isUrgent = listing.urgency === 'high' || listing.urgency === 'Acil';
    const timeAgo = getTimeAgo(listing.created_at);
    
    // Extract only city from location
    const getCity = (location: string) => {
      if (!location || location === '-') return '-';
      const parts = location.split('/').map(part => part.trim());
      return parts[0] || '-'; // First part is usually the city
    };
    
    const imageUrl = listing.main_image_url || listing.main_image || listing.image_url || null;
    
    return {
      id: listing.id,
      title: listing.title || 'Başlık yok',
      price: listing.budget || 0,
      location: getCity(listing.location || '-'),
      timeAgo,
      isUrgent,
      category: listing.category || 'Genel',
      imageUrl,
      isFavorited: !!listing.is_favorited,
    };
  }, [listing]);

  // Animations
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  // Analytics tracking functions
  const trackCardClick = useCallback(() => {
    analyticsService.trackEvent('BUTTON_CLICK', {
      screen_name: screenName,
      section_name: sectionName,
      listing_id: cardData.id,
      action: 'view_listing',
      listing_title: cardData.title,
      listing_category: cardData.category,
      listing_price: cardData.price,
    });
  }, [screenName, sectionName, cardData]);

  const trackFavoriteAction = useCallback((action: 'add' | 'remove') => {
    analyticsService.trackEvent('FAVORITE_ADDED', {
      screen_name: screenName,
      section_name: sectionName,
      listing_id: cardData.id,
      action: action,
      listing_title: cardData.title,
      listing_category: cardData.category,
    });
  }, [screenName, sectionName, cardData]);

  const trackLongPressAction = useCallback((action: 'share' | 'save' | 'report') => {
    analyticsService.trackEvent('BUTTON_CLICK', {
      screen_name: screenName,
      section_name: sectionName,
      listing_id: cardData.id,
      action: `long_press_${action}`,
      listing_title: cardData.title,
      listing_category: cardData.category,
    });
  }, [screenName, sectionName, cardData]);

  // Long press actions
  const handleLongPress = useCallback(() => {
    haptic.medium();
    Alert.alert(
      'İlan Seçenekleri',
      'Bu ilan için ne yapmak istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Paylaş', 
          onPress: () => {
            haptic.light();
            trackLongPressAction('share');
            console.log('Share listing:', cardData.id);
          }
        },
        { 
          text: 'Kaydet', 
          onPress: () => {
            haptic.success();
            trackLongPressAction('save');
            onToggleFavorite?.();
          }
        },
        { 
          text: 'Rapor Et', 
          style: 'destructive',
          onPress: () => {
            haptic.warning();
            trackLongPressAction('report');
            console.log('Report listing:', cardData.id);
          }
        },
      ]
    );
  }, [cardData.id, onToggleFavorite, trackLongPressAction]);

  const { handlers: longPressHandlers } = useLongPress({
    onLongPress: handleLongPress,
    onPress: () => {
      trackCardClick();
      onPress?.();
    },
  }, {
    duration: 750, // 500ms'den 750ms'ye çıkarıldı
    hapticFeedback: true,
    hapticType: 'medium',
  });



  // Animation handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleFavoritePress = useCallback((e: any) => {
    e.stopPropagation();
    haptic.selection();
    const action = cardData.isFavorited ? 'remove' : 'add';
    trackFavoriteAction(action);
    onToggleFavorite?.();
  }, [cardData.id, cardData.isFavorited, onToggleFavorite, trackFavoriteAction]);

  const formatPrice = useCallback((price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
    return price.toString();
  }, []);

  const dynamicStyles = useMemo(() => {
    const containerWidth = style?.width === '100%' ? screenWidth - 32 : getCardWidth(numColumns);
    const isCompact = numColumns >= 3;
    
    return StyleSheet.create({
      container: {
        width: containerWidth,
        marginBottom: style?.marginBottom !== undefined ? style.marginBottom : 16,
        marginRight: isGrid ? 0 : 16, // Sadece horizontal layout'ta marginRight
      },
      card: {
        backgroundColor: colors.surface,
        borderRadius: isCompact ? 12 : 16,
        overflow: 'hidden',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: isCompact ? 2 : 4 },
        shadowOpacity: 0.1,
        shadowRadius: isCompact ? 8 : 12,
        elevation: isCompact ? 4 : 8,
        borderWidth: 1,
        borderColor: `${colors.border}20`,
      },
      imageContainer: {
        height: isCompact ? 120 : 140,
        position: 'relative',
        backgroundColor: colors.gray[100],
      },
      image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
      },
      imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      urgentBadge: {
        position: 'absolute',
        top: isCompact ? 6 : 8,
        left: isCompact ? 6 : 8,
        backgroundColor: colors.error,
        borderRadius: isCompact ? 8 : 12,
        paddingHorizontal: isCompact ? 6 : 8,
        paddingVertical: isCompact ? 3 : 4,
        flexDirection: 'row',
        alignItems: 'center',
      },
      badgeText: {
        color: colors.white,
        fontSize: isCompact ? 9 : 11,
        fontWeight: '700',
        marginLeft: isCompact ? 2 : 4,
      },
      favoriteButton: {
        position: 'absolute',
        top: isCompact ? 6 : 8,
        right: isCompact ? 6 : 8,
        width: isCompact ? 28 : 32,
        height: isCompact ? 28 : 32,
        borderRadius: isCompact ? 14 : 16,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
      },
      content: {
        padding: isCompact ? 8 : 12,
      },
      header: {
        marginBottom: isCompact ? 4 : 8,
      },
      title: {
        fontSize: isCompact ? 14 : 16,
        fontWeight: '700',
        color: colors.text,
        lineHeight: isCompact ? 18 : 20,
        marginBottom: isCompact ? 2 : 4,
        height: isCompact ? 32 : 40, // Compact'ta 1 satır, normal'de 2 satır
      },
      price: {
        fontSize: isCompact ? 16 : 18,
        fontWeight: '800',
        color: colors.primary,
        marginBottom: isCompact ? 0 : 2,
      },
      priceLabel: {
        fontSize: isCompact ? 9 : 11,
        color: colors.textSecondary,
        fontWeight: '500',
      },
      metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: isCompact ? 0 : 8,
      },
      metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      metadataText: {
        fontSize: isCompact ? 9 : 11,
        color: colors.textSecondary,
        marginLeft: isCompact ? 2 : 4,
        fontWeight: '500',
      },
      loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -10 }, { translateY: -10 }],
      },
      skeletonImage: {
        backgroundColor: colors.gray[200],
        borderRadius: 8,
      },
    });
  }, [colors, style, isGrid, numColumns]);

  return (
    <Animated.View 
      style={[
        dynamicStyles.container, 
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Pressable
        onPressIn={() => {
          longPressHandlers.onPressIn();
          handlePressIn();
        }}
        onPressOut={() => {
          longPressHandlers.onPressOut();
          handlePressOut();
        }}
        onPress={longPressHandlers.onPress}
        style={[
          dynamicStyles.card,
          isFavoriteLoading && { opacity: 0.7 }
        ]}
        disabled={isFavoriteLoading}
      >
        {/* Image Section */}
        <View style={dynamicStyles.imageContainer}>
          {cardData.imageUrl ? (
            <>
              <ImageWithFallback
                uri={cardData.imageUrl}
                style={dynamicStyles.image}
                priority={index < 6 ? 'high' : 'normal'} // İlk 6 kart için high priority
                cachePolicy="memory-disk"
              />
              <Animated.View 
                style={[
                  dynamicStyles.imageOverlay,
                  { opacity: fadeAnim }
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </>
          ) : (
            <View style={[dynamicStyles.image, dynamicStyles.skeletonImage]} />
          )}

          {/* Badges */}
          {showUrgencyBadges && cardData.isUrgent && (
            <View style={dynamicStyles.urgentBadge}>
              <Zap size={12} color={colors.white} />
              <Text style={dynamicStyles.badgeText}>ACİL</Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={[
              dynamicStyles.favoriteButton,
              isFavoriteLoading && { opacity: 0.5 }
            ]}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
            disabled={isFavoriteLoading}
          >
            <Heart
              size={18}
              color={cardData.isFavorited ? '#FF0000' : '#FFFFFF'}
              fill={cardData.isFavorited ? '#FF0000' : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>

        </View>

        {/* Content Section */}
        <View style={dynamicStyles.content}>
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.title} numberOfLines={numColumns >= 3 ? 1 : 2}>
              {cardData.title}
            </Text>
            <Text style={dynamicStyles.price}>
              ₺{formatPrice(cardData.price)}
              {numColumns < 3 && <Text style={dynamicStyles.priceLabel}> bütçe</Text>}
            </Text>
          </View>

          {/* Metadata - Compact modda gizle */}
          {numColumns < 3 && (
            <View style={dynamicStyles.metadata}>
              <View style={dynamicStyles.metadataItem}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={dynamicStyles.metadataText} numberOfLines={1}>
                  {cardData.location}
                </Text>
              </View>
              <View style={dynamicStyles.metadataItem}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={dynamicStyles.metadataText}>
                  {cardData.timeAgo}
                </Text>
              </View>
            </View>
          )}

        </View>
      </Pressable>
    </Animated.View>
  );
});

ListingCard.displayName = 'ListingCard';

export default ListingCard; 