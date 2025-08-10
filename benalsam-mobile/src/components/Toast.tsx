import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../stores';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
  style,
  textStyle,
}) => {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      top: 50,
      left: 16,
      right: 16,
      zIndex: 1000,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    };

    const typeStyles = {
      success: {
        backgroundColor: colors.success,
      },
      error: {
        backgroundColor: colors.error,
      },
      warning: {
        backgroundColor: colors.warning,
      },
      info: {
        backgroundColor: colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...typeStyles[type],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.white,
      ...textStyle,
    };
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        getToastStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={getTextStyle()}>{message}</Text>
    </Animated.View>
  );
}; 