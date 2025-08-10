import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../stores';
import { Avatar } from './Avatar';

interface OfferCardProps {
  offer: any;
  onPress?: () => void;
  style?: any;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress, style }) => {
  const colors = useThemeColors();

  const offerorName = offer.offeror?.username || offer.offeror?.email || 'Kullanıcı';

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        style
      ]}
    >
      <View style={styles.userInfo}>
        <Avatar 
          size="md"
          source={offer.offeror?.avatar_url}
          name={offerorName}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{offerorName}</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {offer.offered_price} ₺
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
}); 