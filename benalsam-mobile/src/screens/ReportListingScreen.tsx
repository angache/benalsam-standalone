import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { createListingReport } from '../services/reportService';
import { supabase  } from '../services/supabaseClient';
import { Picker } from '@react-native-picker/picker';

const reportReasons = [
  'Yasaklı ürün veya hizmet',
  'Yanlış veya yanıltıcı kategori',
  'Aldatıcı veya eksik bilgi',
  'Spam veya alakasız içerik',
  'Telif hakkı ihlali',
  'Dolandırıcılık şüphesi',
  'BenAlsam politikalarına aykırı',
  'Diğer',
];

const ReportListingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const listingId = route.params?.listingId;

  const [listingTitle, setListingTitle] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingListing, setLoadingListing] = useState(true);

  useEffect(() => {
    if (!user || !listingId) return;
    const fetchListingTitle = async () => {
      setLoadingListing(true);
      const { data, error } = await supabase
        .from('listings')
        .select('title')
        .eq('id', listingId)
        .single();
      if (error || !data) {
        Alert.alert('İlan Bulunamadı', 'Şikayet edilecek ilan bulunamadı.');
        navigation.goBack();
        return;
      }
      setListingTitle(data.title);
      setLoadingListing(false);
    };
    fetchListingTitle();
  }, [user, listingId, navigation]);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Şikayet Nedeni Seçilmedi', 'Lütfen bir şikayet nedeni seçin.');
      return;
    }
    if (reason === 'Diğer' && !details.trim()) {
      Alert.alert('Detay Gerekli', "Lütfen 'Diğer' seçeneği için şikayet detayını belirtin.");
      return;
    }
    setIsSubmitting(true);
    const reportData = {
      reporter_id: user?.id,
      listing_id: listingId,
      reason: reason,
      details: details.trim(),
    };
    const result = await createListingReport(reportData);
    setIsSubmitting(false);
    if (result) {
      Alert.alert('Başarılı', 'Şikayetiniz gönderildi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    }
  };

  if (loadingListing) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={styles.header}>İlanı Şikayet Et</Text>
      <Text style={{ color: colors.text, marginBottom: 12 }}>{listingTitle}</Text>
      <Text style={styles.label}>Şikayet Nedeni *</Text>
      <View style={[styles.pickerWrapper, { backgroundColor: colors.surface }]}> 
        <Picker
          selectedValue={reason}
          onValueChange={setReason}
          style={{ color: colors.text }}>
          <Picker.Item label="Bir neden seçin..." value="" />
          {reportReasons.map(r => (
            <Picker.Item key={r} label={r} value={r} />
          ))}
        </Picker>
      </View>
      <Text style={styles.label}>Detaylar (İsteğe Bağlı)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, minHeight: 80 }]}
        value={details}
        onChangeText={setDetails}
        placeholder="Şikayetinizle ilgili ek bilgi verin..."
        placeholderTextColor={colors.textSecondary}
        multiline
      />
      <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 16 }}>{isSubmitting ? 'Gönderiliyor...' : 'Şikayeti Gönder'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 6 },
  pickerWrapper: { borderRadius: 8, marginBottom: 14 },
  input: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14, fontSize: 16 },
  submitButton: { borderRadius: 8, alignItems: 'center', padding: 16, marginTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default ReportListingScreen; 