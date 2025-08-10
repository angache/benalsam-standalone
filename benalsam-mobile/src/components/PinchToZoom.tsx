import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  Text,
} from 'react-native';
import { X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { useThemeColors } from '../stores';
import { haptic } from '../utils/hapticFeedback';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PinchToZoomProps {
  source: { uri: string } | number;
  style?: any;
  onPress?: () => void;
  enableZoom?: boolean;
  maxScale?: number;
  minScale?: number;
}

const PinchToZoom: React.FC<PinchToZoomProps> = ({
  source,
  style,
  onPress,
  enableZoom = true,
  maxScale = 3,
  minScale = 0.5,
}) => {
  const colors = useThemeColors();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  
  // Animated values with safe defaults
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Safe update functions
  const updateZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(maxScale, newZoom));
    setCurrentZoom(clampedZoom);
    scale.value = clampedZoom;
  }, [maxScale]);

  const resetZoom = useCallback(() => {
    haptic.medium();
    setCurrentZoom(1);
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  const zoomIn = useCallback(() => {
    haptic.light();
    const newZoom = Math.min(currentZoom * 1.5, maxScale);
    updateZoom(newZoom);
  }, [currentZoom, maxScale, updateZoom]);

  const zoomOut = useCallback(() => {
    haptic.light();
    const newZoom = Math.max(currentZoom / 1.5, 1);
    updateZoom(newZoom);
  }, [currentZoom, updateZoom]);

  const openModal = useCallback(() => {
    haptic.light();
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    haptic.light();
    setIsModalVisible(false);
    resetZoom();
  }, [resetZoom]);

  // Calculate boundaries safely
  const getBoundaries = useCallback((currentScale: number) => {
    const imageWidth = screenWidth * currentScale;
    const imageHeight = screenHeight * currentScale;
    const maxTranslateX = Math.max(0, (imageWidth - screenWidth) / 2);
    const maxTranslateY = Math.max(0, (imageHeight - screenHeight) / 2);
    return { maxTranslateX, maxTranslateY };
  }, []);

  // Pinch gesture with safety checks
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      try {
        const newScale = Math.max(1, Math.min(maxScale, savedScale.value * event.scale));
        scale.value = newScale;
        runOnJS(updateZoom)(newScale);
      } catch (error) {
        console.warn('Pinch gesture error:', error);
      }
    })
    .onEnd(() => {
      try {
        if (scale.value < 1) {
          scale.value = withSpring(1);
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          savedScale.value = 1;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          runOnJS(updateZoom)(1);
        } else {
          savedScale.value = scale.value;
        }
      } catch (error) {
        console.warn('Pinch gesture end error:', error);
      }
    });

  // Pan gesture with boundary control
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      try {
        if (scale.value > 1) {
          // Simplified boundary calculation
          const maxTranslateX = (scale.value - 1) * screenWidth / 2;
          const maxTranslateY = (scale.value - 1) * screenHeight / 2;
          
          const newTranslateX = savedTranslateX.value + event.translationX;
          const newTranslateY = savedTranslateY.value + event.translationY;
          
          translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
          translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
        }
      } catch (error) {
        console.warn('Pan gesture error:', error);
      }
    })
    .onEnd(() => {
      try {
        if (scale.value <= 1) {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        } else {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        }
      } catch (error) {
        console.warn('Pan gesture end error:', error);
      }
    });

  // Use Race instead of Simultaneous for better performance
  const combinedGesture = Gesture.Race(pinchGesture, panGesture);

  // Animated styles with safety
  const animatedImageStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [
          { scale: scale.value },
          { translateX: translateX.value },
          { translateY: translateY.value },
        ],
      };
    } catch (error) {
      console.warn('Animated style error:', error);
      return {
        transform: [
          { scale: 1 },
          { translateX: 0 },
          { translateY: 0 },
        ],
      };
    }
  });

  const renderZoomedImage = () => (
    <View style={styles.modalContainer}>
      <StatusBar hidden />
      
      {/* Header */}
      <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={closeModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <Text style={[styles.zoomText, { color: colors.text }]}>
            {Math.round(currentZoom * 100)}%
          </Text>
        </View>
      </View>

      {/* Zoomed Image */}
      <View style={styles.imageContainer}>
        <GestureDetector gesture={combinedGesture}>
          <Animated.Image
            source={source}
            style={[styles.fullImage, animatedImageStyle]}
            resizeMode="contain"
          />
        </GestureDetector>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={openModal}
        activeOpacity={0.9}
      >
        <Image
          source={source}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        {renderZoomedImage()}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 44,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight,
  },
});

export default PinchToZoom; 