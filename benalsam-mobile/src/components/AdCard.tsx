import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useThemeColors } from '../stores';

interface AdCardProps {
  title: string;
  description?: string;
  image?: string;
  onPress?: () => void;
}

const AdCard: React.FC<AdCardProps> = ({ title, description, image, onPress }) => {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      margin: 10,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    image: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: colors.gray[200],
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 2,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
};

export default AdCard; 