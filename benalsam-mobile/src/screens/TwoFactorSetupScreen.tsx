import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, useThemeColors } from '../stores';
import { TwoFactorService } from '../services/twoFactorService';

import { generateTOTP } from '../utils/totp';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  formattedSecret: string;
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  qrPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  qrNote: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  secretContainer: {
    marginTop: 8,
  },
  secretLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 12,
  },
  secretText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Courier',
    color: colors.text,
    marginRight: 8,
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  codeDisplayContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    marginTop: 16,
  },
  codeDisplayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  testCode: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Courier',
    letterSpacing: 4,
  },
  testTime: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  testNote: {
    marginTop: 8,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  enableButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  enableButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function TwoFactorSetupScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [currentCode, setCurrentCode] = useState('');
  const [remainingTime, setRemainingTime] = useState(30);

  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    initializeSetup();
  }, []);

  useEffect(() => {
    if (setupData) {
      updateCurrentCode();
      const interval = setInterval(updateCurrentCode, 1000);
      return () => clearInterval(interval);
    }
  }, [setupData]);

  const initializeSetup = async () => {
    try {
      setSetupLoading(true);

      
      if (!user?.id) {
        Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
        navigation.goBack();
        return;
      }

      const data = await TwoFactorService.setupTwoFactor(user.id);
      setSetupData(data);

    } catch (error) {
      console.error('2FA setup initialization failed:', error);
      Alert.alert('Hata', '2FA kurulumu başlatılamadı');
      navigation.goBack();
    } finally {
      setSetupLoading(false);
    }
  };

  const updateCurrentCode = async () => {
    if (!setupData) return;
    
    try {
      const result = await generateTOTP({
        secret: setupData.secret,
        digits: 6,
        period: 30,
        algorithm: 'SHA1'
      });
      
      setCurrentCode(result.code);
      setRemainingTime(result.remainingTime);
    } catch (error) {
      console.warn('Failed to update current code:', error);
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Hata', 'Lütfen doğrulama kodunu girin');
      return;
    }

    if (!user?.id || !setupData) {
      Alert.alert('Hata', 'Kurulum verisi bulunamadı');
      return;
    }

    try {
      setLoading(true);


      const result = await TwoFactorService.enableTwoFactor(
        user.id,
        setupData.secret,
        verificationCode
      );

      if (result.success) {

        Alert.alert(
          'Başarılı',
          'İki faktörlü kimlik doğrulama başarıyla etkinleştirildi',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {

        Alert.alert('Hata', result.error || '2FA etkinleştirilemedi');
      }
    } catch (error) {
      console.error('Enable 2FA error:', error);
      Alert.alert('Hata', '2FA etkinleştirilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Kopyalandı', 'Secret başarıyla kopyalandı');

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Hata', 'Kopyalama işlemi başarısız oldu');
    }
  };

  if (setupLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>2FA kurulumu hazırlanıyor...</Text>
      </View>
    );
  }

  if (!setupData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Kurulum verisi yüklenemedi</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeSetup}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>İki Faktörlü Kimlik Doğrulama</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Authenticator Uygulaması Kurun</Text>
            <Text style={styles.description}>
              Google Authenticator, Authy veya benzeri bir TOTP uygulaması indirin.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. QR Kodu Tarayın</Text>
            <View style={styles.qrContainer}>
              <Text style={styles.qrPlaceholder}>
                📱 QR Kod Burada Gösterilecek
              </Text>
              <Text style={styles.qrNote}>
                QR kod tarama özelliği aynı cihazda çalışmayabilir.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Manuel Giriş (Alternatif)</Text>
            <View style={styles.secretContainer}>
              <Text style={styles.secretLabel}>Secret Key:</Text>
              <View style={styles.secretRow}>
                <Text style={styles.secretText}>
                  {showSecret ? setupData.formattedSecret : '•••• •••• •••• ••••'}
                </Text>
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowSecret(!showSecret)}
                >
                  <Ionicons 
                    name={showSecret ? "eye-off" : "eye"} 
                    size={20} 
                    color="#007AFF" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(setupData.secret)}
                >
                  <Ionicons name="copy" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
            

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Doğrulama Kodu Girin</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>6 Haneli Kodu Girin:</Text>
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
              <Text style={styles.codeHint}>
                Kod her {remainingTime} saniyede yenilenir
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Test Kodu</Text>
            <View style={styles.testContainer}>
              <Text style={styles.testLabel}>Mevcut Kod:</Text>
              <Text style={styles.testCode}>{currentCode}</Text>
              <Text style={styles.testTime}>Kalan süre: {remainingTime}s</Text>
              <Text style={styles.testNote}>
                Bu kodu kullanarak test edebilirsiniz
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.enableButton, loading && styles.disabledButton]}
            onPress={handleEnable2FA}
            disabled={loading || !verificationCode.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.enableButtonText}>2FA'yı Etkinleştir</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 