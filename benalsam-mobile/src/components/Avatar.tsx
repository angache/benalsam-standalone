import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useThemeColors } from '../stores';
import { generateAvatarUrl, getInitials } from '../utils/avatarUtils';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  style,
  textStyle,
}) => {
  const colors = useThemeColors();

  const getSize = () => {
    switch (size) {
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 48;
      case 'xl': return 96;
      default: return 40;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return 12;
      case 'md': return 14;
      case 'lg': return 16;
      case 'xl': return 32;
      default: return 14;
    }
  };

  const avatarSize = getSize();
  const fontSize = getFontSize();

  const getAvatarStyle = (): ViewStyle => {
    return {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      fontSize,
      fontWeight: '600',
      color: colors.white,
      ...textStyle,
    };
  };

  const getImageStyle = (): ImageStyle => {
    return {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    };
  };

  // Generate fallback URL if no source provided
  const avatarUrl = source || (name ? generateAvatarUrl(name, avatarSize) : null);

  return (
    <View style={getAvatarStyle()}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={getImageStyle()}
          resizeMode="cover"
        />
      ) : (
        <Text style={getTextStyle()}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}; 