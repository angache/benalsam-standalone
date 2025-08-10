import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useAuthStore, useThemeColors } from '../stores';
import { useNavigation } from '@react-navigation/native';
import { Input, Button } from '../components';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const colors = useThemeColors();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Hata', 'E-posta adresi gerekli.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return;
    }

    // Dismiss keyboard before reset
    dismissKeyboard();

    // Clear previous messages
    setRateLimitError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccessMessage('Şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.');
      } else {
        if (result.error && (
          result.error.includes('kilitlendi') ||
          result.error.includes('fazla deneme') ||
          result.error.includes('hızlı deneme') ||
          result.error.includes('bekleyin')
        )) {
          setRateLimitError(result.error);
        } else {
          Alert.alert('Hata', result.error || 'Şifre sıfırlama e-postası gönderilemedi.');
        }
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Hata', 'Şifre sıfırlama işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    dismissKeyboard();
    navigation.navigate('Login' as never);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 20,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    rateLimitError: {
      backgroundColor: colors.error + '15',
      borderColor: colors.error,
      borderWidth: 1.5,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.error,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    rateLimitErrorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 20,
    },
    successMessage: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success,
      borderWidth: 1.5,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.success,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    successMessageText: {
      color: colors.success,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 20,
    },
    linkButton: {
      alignItems: 'center',
      marginTop: 20,
    },
    linkText: {
      color: colors.primary,
      fontSize: 14,
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Şifremi Unuttum</Text>
              <Text style={styles.subtitle}>
                E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
              </Text>
            </View>

            <View style={styles.form}>
              {rateLimitError && (
                <View style={styles.rateLimitError}>
                  <Text style={styles.rateLimitErrorText}>
                    🛡️ {rateLimitError}
                  </Text>
                </View>
              )}

              {successMessage && (
                <View style={styles.successMessage}>
                  <Text style={styles.successMessageText}>
                    ✅ {successMessage}
                  </Text>
                </View>
              )}

              <Input
                label="E-posta"
                placeholder="E-posta adresinizi girin"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                textContentType="emailAddress"
                keyboardType="email-address"
                autoCorrect={false}
              />

              <Button
                title={loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama E-postası Gönder'}
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
              />

              <Text style={styles.infoText}>
                Şifre sıfırlama e-postası 15 dakika içinde gelmezse spam klasörünüzü kontrol edin.
              </Text>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleBackToLogin}
              >
                <Text style={styles.linkText}>
                  Giriş sayfasına dön
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ForgotPasswordScreen; 