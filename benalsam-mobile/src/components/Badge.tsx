import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../stores';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const colors = useThemeColors();

  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    };

    const sizeStyles = {
      sm: { paddingVertical: 2, paddingHorizontal: 6 },
      md: { paddingVertical: 4, paddingHorizontal: 8 },
      lg: { paddingVertical: 6, paddingHorizontal: 12 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: colors.secondary,
        borderWidth: 0,
      },
      success: {
        backgroundColor: colors.success,
        borderWidth: 0,
      },
      warning: {
        backgroundColor: colors.warning,
        borderWidth: 0,
      },
      error: {
        backgroundColor: colors.error,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '500',
      textAlign: 'center',
    };

    const sizeStyles = {
      sm: { fontSize: 10 },
      md: { fontSize: 12 },
      lg: { fontSize: 14 },
    };

    const variantStyles = {
      primary: {
        color: colors.white,
      },
      secondary: {
        color: colors.white,
      },
      success: {
        color: colors.white,
      },
      warning: {
        color: colors.white,
      },
      error: {
        color: colors.white,
      },
      outline: {
        color: colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...textStyle,
    };
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
}; 