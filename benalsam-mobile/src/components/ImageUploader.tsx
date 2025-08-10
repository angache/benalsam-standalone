import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../stores';

interface ImageItem {
  uri: string;
  name: string;
  isUploaded?: boolean;
  url?: string;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onImageChange: (images: ImageItem[]) => void;
  onRemoveImage: (index: number) => void;
  onSetMainImage: (index: number) => void;
  mainImageIndex: number;
  maxImages?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImageChange,
  onRemoveImage,
  onSetMainImage,
  mainImageIndex,
  maxImages = 5,
  disabled = false,
  style,
}) => {
  const colors = useThemeColors();

  const getContainerStyle = (): ViewStyle => {
    return {
      ...style,
    };
  };

  const getImageGridStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    };
  };

  const getImageContainerStyle = (): ViewStyle => {
    return {
      width: 100,
      height: 100,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    };
  };

  const getImageStyle = (): ImageStyle => {
    return {
      width: '100%',
      height: '100%',
    };
  };

  const getImageOverlayStyle = (): ViewStyle => {
    return {
      position: 'absolute',
      top: 4,
      right: 4,
      flexDirection: 'row',
      gap: 4,
    };
  };

  const getImageButtonStyle = (isMain: boolean): ViewStyle => {
    return {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isMain ? colors.primary : colors.surface,
    };
  };

  const getImageButtonTextStyle = (isMain: boolean): TextStyle => {
    return {
      fontSize: 12,
      fontWeight: 'bold',
      color: isMain ? colors.white : colors.text,
    };
  };

  const getMainImageBadgeStyle = (): ViewStyle => {
    return {
      position: 'absolute',
      top: 4,
      left: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.primary,
    };
  };

  const getMainImageBadgeTextStyle = (): TextStyle => {
    return {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.white,
    };
  };

  const getAddImageButtonStyle = (): ViewStyle => {
    return {
      width: 100,
      height: 100,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: colors.border,
    };
  };

  const getAddImageTextStyle = (): TextStyle => {
    return {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.primary,
    };
  };

  const getAddImageLabelStyle = (): TextStyle => {
    return {
      fontSize: 12,
      textAlign: 'center',
      color: colors.textSecondary,
    };
  };

  const getHelpTextStyle = (): TextStyle => {
    return {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
    };
  };

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Görsel Limiti', `En fazla ${maxImages} görsel yükleyebilirsiniz.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişim izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaType.Images,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets[0]) {
      const newImage: ImageItem = {
        uri: result.assets[0].uri,
        name: `image_${Date.now()}.jpg`,
        isUploaded: false,
      };

      const newImages = [...images, newImage];
      onImageChange(newImages);
      
      // İlk görseli ana görsel yap
      if (newImages.length === 1) {
        onSetMainImage(0);
      }
    }
  };

  const removeImage = (index: number) => {
    onRemoveImage(index);
  };

  const setMainImage = (index: number) => {
    onSetMainImage(index);
  };

  return (
    <View style={getContainerStyle()}>
      <View style={getImageGridStyle()}>
        {images.map((image, index) => (
          <View key={index} style={getImageContainerStyle()}>
            <Image source={{ uri: image.uri }} style={getImageStyle()} />
            
            {!disabled && (
              <View style={getImageOverlayStyle()}>
                <TouchableOpacity
                  style={getImageButtonStyle(false)}
                  onPress={() => removeImage(index)}
                >
                  <Text style={getImageButtonTextStyle(false)}>✕</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={getImageButtonStyle(mainImageIndex === index)}
                  onPress={() => setMainImage(index)}
                >
                  <Text style={getImageButtonTextStyle(mainImageIndex === index)}>
                    {mainImageIndex === index ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {mainImageIndex === index && (
              <View style={getMainImageBadgeStyle()}>
                <Text style={getMainImageBadgeTextStyle()}>Ana</Text>
              </View>
            )}
          </View>
        ))}

        {images.length < maxImages && !disabled && (
          <TouchableOpacity
            style={getAddImageButtonStyle()}
            onPress={pickImage}
            disabled={disabled}
          >
            <Text style={getAddImageTextStyle()}>+</Text>
            <Text style={getAddImageLabelStyle()}>Görsel Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={getHelpTextStyle()}>
        {images.length} / {maxImages} görsel yüklendi. Ana görseli ★ ile işaretleyebilirsiniz.
      </Text>
    </View>
  );
}; 