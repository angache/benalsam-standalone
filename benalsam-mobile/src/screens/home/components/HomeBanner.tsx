// ===========================
// HOME BANNER COMPONENT
// ===========================

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { HomeBannerProps, Banner } from '../types';
import { useThemeColors } from '../../../stores';
import { spacing, margins, paddings, shadows, borderRadius } from '../../../utils/spacing';
import { typography } from '../../../utils/typography';

const { width: screenWidth } = Dimensions.get('window');

const HomeBanner: React.FC<HomeBannerProps> = ({
  banners,
  onBannerPress,
  autoPlay = true,
  interval = 3000
}) => {
  const colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlashList<Banner>>(null);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % banners.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, banners.length]);

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      style={styles.bannerCard}
      onPress={() => onBannerPress(item.action)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerText}>{item.text}</Text>
        <TouchableOpacity
          style={styles.bannerActionButton}
          onPress={() => onBannerPress(item.action)}
        >
          <Text style={styles.bannerActionText}>Keşfet</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {banners.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: index === currentIndex ? colors.primary : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );

  if (banners.length === 0) return null;

  return (
    <View style={styles.bannerSection}>
      <FlashList
        ref={listRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item, index) => `banner-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={280}
        contentContainerStyle={styles.bannerContainer}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / 280);
          setCurrentIndex(index);
        }}
      />
      {banners.length > 1 && renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerSection: {
    height: 180,
    ...margins.b.md,
  },
  bannerContainer: {
    ...paddings.h.sm,
  },
  bannerCard: {
    width: 280,
    height: 160,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    ...paddings.all.md,
  },
  bannerText: {
    ...typography.h3,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  bannerActionButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  bannerActionText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default HomeBanner;
