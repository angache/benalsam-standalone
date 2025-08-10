import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { fetchListings } from '../services/listingService';
import { supabase  } from '../services/supabaseClient';
import { dopingOptions } from '../config/dopingOptions';

const DopingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const listingId = route.params?.listingId;

  const [listing, setListing] = useState<any>(null);
  const [selectedDopings, setSelectedDopings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      const listings = await fetchListings(user?.id);
      const found = (listings || []).find((l: any) => l.id === listingId);
      setListing(found);
      setLoading(false);
    };
    if (user && listingId) fetchListing();
  }, [user, listingId]);

  const handleToggleDoping = (option: any) => {
    setSelectedDopings((prev: any) => {
      const newDopings = { ...prev };
      if (newDopings[option.id]) {
        delete newDopings[option.id];
      } else {
        newDopings[option.id] = { ...option, selectedPrice: option.prices[0] };
      }
      return newDopings;
    });
  };

  const handlePriceChange = (optionId: string, price: any) => {
    setSelectedDopings((prev: any) => {
      const newDopings = { ...prev };
      if (newDopings[optionId]) {
        newDopings[optionId].selectedPrice = price;
      }
      return newDopings;
    });
  };

  const totalPrice = Object.values(selectedDopings).reduce((total: number, option: any) => {
    return total + (option.selectedPrice?.price || 0);
  }, 0);

  const handlePurchase = async () => {
    if (!listing || isPurchasing) return;
    setIsPurchasing(true);
    const updatePayload: any = {};
    const now = new Date();
    Object.values(selectedDopings).forEach((doping: any) => {
      updatePayload[doping.db_field] = true;
      const duration = doping.selectedPrice.duration;
      if (duration > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(now.getDate() + duration);
        if (doping.id === 'showcase') updatePayload.showcase_expires_at = expiresAt.toISOString();
        if (doping.id === 'urgent') updatePayload.urgent_expires_at = expiresAt.toISOString();
        if (doping.id === 'featured') updatePayload.featured_expires_at = expiresAt.toISOString();
      }
      if (doping.id === 'up_to_date') {
        updatePayload.upped_at = now.toISOString();
      }
    });
    try {
      const { error } = await supabase
        .from('listings')
        .update(updatePayload)
        .eq('id', listing.id);
      if (error) throw error;
      Alert.alert('Başarılı', 'Dopingler aktif edildi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', 'Doping güncellenemedi.');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (!listing) {
    return <View style={styles.center}><Text>İlan bulunamadı.</Text></View>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>Doping Seçenekleri</Text>
      <Text style={{ color: colors.text, marginBottom: 16 }}>{listing.title}</Text>
      {dopingOptions.map(option => {
        const isSelected = !!selectedDopings[option.id];
        return (
          <View key={option.id} style={[styles.dopingCard, { borderColor: isSelected ? colors.primary : colors.border }]}> 
            <TouchableOpacity onPress={() => handleToggleDoping(option)}>
              <Text style={{ fontWeight: 'bold', color: colors.text }}>{option.title}</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>{option.description}</Text>
              {isSelected && (
                <View style={{ marginBottom: 8 }}>
                  {option.prices.map(price => (
                    <TouchableOpacity
                      key={price.label}
                      style={[styles.priceOption, { backgroundColor: selectedDopings[option.id]?.selectedPrice === price ? colors.primary : colors.surface }]}
                      onPress={() => handlePriceChange(option.id, price)}
                    >
                      <Text style={{ color: selectedDopings[option.id]?.selectedPrice === price ? colors.white : colors.text }}>{price.label} - ₺{price.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Toplam: ₺{totalPrice}</Text>
        <TouchableOpacity style={[styles.purchaseButton, { backgroundColor: colors.primary }]} onPress={handlePurchase} disabled={isPurchasing}>
          <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 16 }}>{isPurchasing ? 'Satın Alınıyor...' : 'Satın Al'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  dopingCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14 },
  priceOption: { borderRadius: 8, padding: 10, marginBottom: 6 },
  purchaseButton: { borderRadius: 8, alignItems: 'center', padding: 16, marginTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default DopingScreen; 