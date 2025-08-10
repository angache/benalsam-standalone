import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../stores';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
  style,
  textStyle,
}) => {
  const colors = useThemeColors();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (fullScreen) {
      return {
        ...baseStyle,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        zIndex: 1000,
      };
    }

    return {
      ...baseStyle,
      padding: 20,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      ...textStyle,
    };
  };

  const spinnerColor = color || colors.primary;

  return (
    <View style={getContainerStyle()}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && <Text style={getTextStyle()}>{text}</Text>}
    </View>
  );
}; 