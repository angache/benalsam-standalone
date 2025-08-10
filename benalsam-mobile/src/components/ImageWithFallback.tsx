import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Image as ImageIcon } from 'lucide-react-native';

interface ImageWithFallbackProps {
  uri: string;
  style?: any;
  fallbackText?: string;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'memory-disk' | 'disk' | 'none';
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  uri, 
  style, 
  fallbackText = 'Görsel yüklenemedi',
  priority = 'normal',
  cachePolicy = 'memory-disk'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memory management - cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function for memory management
      setHasError(false);
      setIsLoading(false);
    };
  }, []);

  // Reset state when URI changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [uri]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, [uri]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, [uri]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, [uri]);

  if (hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <ImageIcon size={40} color="#666" />
        <Text style={styles.fallbackText}>{fallbackText}</Text>
        <Text style={styles.urlText} numberOfLines={2}>
          {uri}
        </Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={style}
        contentFit="cover"
        transition={200}
        cachePolicy={cachePolicy}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        onLoadStart={handleLoadStart}
      />
      {isLoading && (
        <View style={[styles.loadingOverlay, style]}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  urlText: {
    marginTop: 4,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  loading: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
}); 