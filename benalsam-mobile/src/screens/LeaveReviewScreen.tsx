import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { useReviewActions, useCanUserReview } from '../hooks/queries/useReviews';
import { supabase  } from '../services/supabaseClient';

const LeaveReviewScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const offerId = route.params?.offerId;

  const [offer, setOffer] = useState<any>(null);
  const [loadingOffer, setLoadingOffer] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  // React Query hooks
  const { data: canReview, isLoading: checkingReviewability } = useCanUserReview(offerId);
  const { submitReview, isSubmitting, error: reviewError } = useReviewActions();

  useEffect(() => {
    if (!user || !offerId) return;
    const loadOffer = async () => {
      setLoadingOffer(true);
      try {
        const { data: fetchedOffer, error } = await supabase
          .from('offers')
          .select(`
            id,
            listing_id,
            listings!offers_listing_id_fkey(user_id, title),
            offering_user_id,
            status
          `)
          .eq('id', offerId)
          .single();
        if (error || !fetchedOffer) {
          Alert.alert('Teklif Bulunamadı', 'Değerlendirilecek teklif bulunamadı.');
          navigation.goBack();
          return;
        }
        if (fetchedOffer.status !== 'accepted') {
          Alert.alert('Yorum Yapılamaz', 'Sadece kabul edilmiş takaslar için yorum yapabilirsiniz.');
          navigation.goBack();
          return;
        }
        setOffer(fetchedOffer);
        setLoadingOffer(false);
      } catch (error) {
        Alert.alert('Hata', 'Teklif bilgileri yüklenirken bir sorun oluştu.');
        navigation.goBack();
      }
    };
    loadOffer();
  }, [user, offerId, navigation]);

  useEffect(() => {
    // Review yapma yetkisi kontrolü
    if (canReview === false && !checkingReviewability) {
      Alert.alert('Yorum Yapılamaz', 'Bu takas için daha önce yorum yapmışsınız veya yorum yapma yetkiniz yok.');
      navigation.goBack();
    }
  }, [canReview, checkingReviewability, navigation]);

  if (loadingOffer || checkingReviewability) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (!offer) {
    return <View style={styles.center}><Text>Teklif bulunamadı.</Text></View>;
  }

  const revieweeId = offer.offering_user_id === user?.id ? offer.listings.user_id : offer.offering_user_id;
  const revieweeName = offer.offering_user_id === user?.id ? offer.listings.title : 'Kullanıcı';

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Puan Gerekli', 'Lütfen 1-5 arası bir puan verin.');
      return;
    }
    if (!revieweeId) {
      Alert.alert('Hata', 'Yorum yapılacak kullanıcı bulunamadı.');
      return;
    }
    
    try {
      await submitReview({
        reviewee_id: revieweeId,
        offer_id: offer.id,
        rating: rating,
        comment: comment.trim(),
      });
      
      Alert.alert('Yorum Gönderildi!', `${revieweeName} için yorumunuz kaydedildi.`, [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      // Hata durumunda Alert gösterilmesi review servisi tarafından handle ediliyor
      console.error('Review submission error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={styles.header}>Değerlendirme Yap</Text>
      <Text style={{ color: colors.text, marginBottom: 12 }}>İlgili ilan: {offer.listings?.title || 'İlan Adı Yok'}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={{ fontSize: 32, color: rating >= star ? '#FFD700' : colors.textSecondary }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, minHeight: 80 }]}
        value={comment}
        onChangeText={setComment}
        placeholder="Yorumunuz (isteğe bağlı)"
        placeholderTextColor={colors.textSecondary}
        multiline
      />
      <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 16 }}>{isSubmitting ? 'Gönderiliyor...' : 'Gönder'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  starsRow: { flexDirection: 'row', marginBottom: 16 },
  input: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14, fontSize: 16 },
  submitButton: { borderRadius: 8, alignItems: 'center', padding: 16, marginTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default LeaveReviewScreen; 