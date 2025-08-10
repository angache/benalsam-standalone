import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Pressable,
  Dimensions
} from 'react-native';
import { useThemeColors } from '../stores';
import { ImageWithFallback } from './ImageWithFallback';
import { Avatar } from './Avatar';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Zap
} from 'lucide-react-native';

interface ListingListItemProps {
  listing: any;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  style?: any;
  isFavoriteLoading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const SIDE_PADDING = 16;
const ITEM_HEIGHT = 100;
const IMAGE_SIZE = 80;

const ListingListItem: React.FC<ListingListItemProps> = React.memo(({
  listing,
  onPress,
  onToggleFavorite,
  style,
  isFavoriteLoading = false,
}) => {
  const colors = useThemeColors();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Animations
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  // Memoized data processing
  const cardData = useMemo(() => {
    const isUrgent = listing.urgency === 'high' || listing.urgency === 'Acil';
    const timeAgo = getTimeAgo(listing.created_at);
    
    // Extract only city from location
    const getCity = (location: string) => {
      if (!location || location === '-') return '-';
      const parts = location.split('/').map(part => part.trim());
      return parts[0] || '-';
    };
    
    return {
      id: listing.id,
      title: listing.title || 'Başlık yok',
      price: listing.budget || 0,
      location: getCity(listing.location || '-'),
      timeAgo,
      isUrgent,
      category: listing.category || 'Genel',
      imageUrl: listing.main_image_url || listing.main_image || listing.image_url || null,
      isFavorited: !!listing.is_favorited,
    };
  }, [listing]);

  // Animation handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Fiyat belirtilmemiş';
    return `${price.toLocaleString('tr-TR')} ₺`;
  };

  // Get time ago
  function getTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    return `${Math.floor(diffInSeconds / 2592000)} ay önce`;
  }

  // Dynamic styles
  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: 8,
    },
    item: {
      height: ITEM_HEIGHT,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      padding: 12,
    },
    imageContainer: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: 8,
      overflow: 'hidden',
      marginRight: 12,
      backgroundColor: colors.surface,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    skeletonImage: {
      backgroundColor: colors.surface,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    price: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
      marginTop: 4,
      alignSelf: 'flex-start',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: -8,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    locationText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    timeText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    urgentBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.error,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.white,
      marginLeft: 2,
    },
    favoriteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.background + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteButtonRight: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    leftInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  }), [colors]);

  return (
    <Animated.View 
      style={[
        dynamicStyles.container, 
        { transform: [{ scale: scaleAnim }] },
        style
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          dynamicStyles.item,
          isFavoriteLoading && { opacity: 0.7 }
        ]}
        disabled={isFavoriteLoading}
      >
        <View style={dynamicStyles.content}>
          {/* Image Section */}
          <View style={dynamicStyles.imageContainer}>
            {cardData.imageUrl ? (
              <Image
                source={{ uri: cardData.imageUrl }}
                style={dynamicStyles.image}
                onLoad={handleImageLoad}
              />
            ) : (
              <View style={[dynamicStyles.image, dynamicStyles.skeletonImage]} />
            )}

            {/* Urgent Badge */}
            {cardData.isUrgent && (
              <View style={dynamicStyles.urgentBadge}>
                <Zap size={10} color={colors.white} />
                <Text style={dynamicStyles.badgeText}>ACİL</Text>
              </View>
            )}


          </View>

          {/* Info Section */}
          <View style={dynamicStyles.infoContainer}>
            {/* Satır 1: Title */}
            <Text style={dynamicStyles.title} numberOfLines={1}>
              {cardData.title}
            </Text>

            {/* Satır 2: Bütçe (sola yaslanmış) */}
            <Text style={dynamicStyles.price}>
              {formatPrice(cardData.price)}
            </Text>

            {/* Satır 3: Şehir, Zaman ve Favori */}
            <View style={dynamicStyles.bottomRow}>
              {/* Sol taraf: Şehir ve Zaman */}
              <View style={dynamicStyles.leftInfo}>
                <View style={dynamicStyles.locationContainer}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={dynamicStyles.locationText}>
                    {cardData.location}
                  </Text>
                </View>
                <View style={dynamicStyles.timeContainer}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={[dynamicStyles.timeText, { marginLeft: 4 }]}>
                    {cardData.timeAgo}
                  </Text>
                </View>
              </View>
              
              {/* Sağ taraf: Favori Butonu */}
              <TouchableOpacity
                style={dynamicStyles.favoriteButtonRight}
                onPress={onToggleFavorite}
                disabled={isFavoriteLoading}
              >
                <Heart 
                  size={16} 
                  color={cardData.isFavorited ? colors.error : colors.textSecondary}
                  fill={cardData.isFavorited ? colors.error : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default ListingListItem; 