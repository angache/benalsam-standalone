import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { Header, Card, Button, Input } from '../components';
import { supabase  } from '../services/supabaseClient';

const UnpublishListingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  const listingId = route.params?.listingId;
  const [listing, setListing] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const reasons = [
    { value: 'Sattım', label: 'Ürünü sattım' },
    { value: 'Vazgeçtim', label: 'Satmaktan vazgeçtim' },
    { value: 'Diğer', label: 'Diğer' },
  ];

  useEffect(() => {
    if (!user || !listingId) return;

    const fetchListing = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          Alert.alert('İlan Bulunamadı', 'Kaldırılacak ilan bulunamadı.');
          navigation.goBack();
          return;
        }

        setListing(data);
      } catch (error) {
        console.error('Error fetching listing:', error);
        Alert.alert('Hata', 'İlan bilgileri yüklenirken bir hata oluştu.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [user, listingId, navigation]);

  const handleConfirm = async () => {
    const finalReason = reason === 'Diğer' ? otherReason.trim() : reason;
    if (!finalReason) return;
    
    const status = reason === 'Sattım' ? 'sold' : 'inactive';
    
    Alert.alert(
      'İlanı Yayından Kaldır',
      `İlanınızı "${finalReason}" nedeniyle yayından kaldırmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            
            try {
              const { error } = await supabase
                .from('listings')
                .update({ 
                  status: status,
                  unpublish_reason: finalReason,
                  updated_at: new Date().toISOString()
                })
                .eq('id', listingId);

              if (error) throw error;

              Alert.alert(
                'İlan Yayından Kaldırıldı', 
                `İlanınız "${finalReason}" nedeniyle yayından kaldırıldı.`,
                [{ text: 'Tamam', onPress: () => navigation.navigate('MyListings') }]
              );
            } catch (error) {
              console.error('Error unpublishing listing:', error);
              Alert.alert('Hata', 'İlan kaldırılırken bir sorun oluştu.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            İlan bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (!listing) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.mainCard}>
          <View style={styles.headerSection}>
            <Text style={[styles.warningIcon, { color: colors.error }]}>⚠️</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              İlanı Yayından Kaldır
            </Text>
          </View>

          <View style={styles.listingInfo}>
            <Text style={[styles.listingTitle, { color: colors.text }]}>
              İlan: {listing.title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              İlanınızı neden yayından kaldırdığınızı belirtin. Bu bilgi, deneyiminizi iyileştirmemize yardımcı olur.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>Neden</Text>
            
            <View style={styles.reasonsContainer}>
              {reasons.map((r) => (
                <Button
                  key={r.value}
                  title={r.label}
                  variant={reason === r.value ? 'default' : 'outline'}
                  onPress={() => setReason(r.value)}
                  style={{
                    ...styles.reasonButton,
                    backgroundColor: reason === r.value ? colors.primary : undefined
                  }}
                />
              ))}
            </View>
            
            {reason === 'Diğer' && (
              <View style={styles.otherReasonContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Detay</Text>
                <Input
                  placeholder="Lütfen nedeninizi belirtin..."
                  value={otherReason}
                  onChangeText={setOtherReason}
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                />
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <Button
              title="İptal"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={isProcessing}
              style={styles.cancelButton}
            />
            <Button
              title={isProcessing ? 'İşleniyor...' : 'Onayla ve Kaldır'}
              onPress={handleConfirm}
              disabled={!reason || (reason === 'Diğer' && !otherReason.trim()) || isProcessing}
              loading={isProcessing}
              variant="destructive"
              style={styles.confirmButton}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listingInfo: {
    marginBottom: 24,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonButton: {
    marginBottom: 8,
  },
  otherReasonContainer: {
    marginTop: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});

export default UnpublishListingScreen; 