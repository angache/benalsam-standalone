import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, useThemeColors } from '../stores';
import { TwoFactorService } from '../services/twoFactorService';

import { Ionicons } from '@expo/vector-icons';

interface TwoFactorVerifyScreenProps {
  route: {
    params: {
      userId: string;
      onSuccess?: () => void;
    };
  };
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  codeSection: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  codeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  attemptsSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  attemptsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  verifyButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function TwoFactorVerifyScreen({ route }: TwoFactorVerifyScreenProps) {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { userId, onSuccess } = route.params;
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;



  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Hata', 'Lütfen doğrulama kodunu girin');
      return;
    }

    if (attempts >= maxAttempts) {
      Alert.alert(
        'Çok Fazla Deneme',
        'Çok fazla başarısız deneme yaptınız. Lütfen daha sonra tekrar deneyin.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack()
          }
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const result = await TwoFactorService.verifyTwoFactor(userId, verificationCode);

      if (result.success) {
        setVerificationCode('');
        
        // Set user in authStore after successful 2FA verification
        const { supabase } = await import('../services/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch user profile and set in authStore
          const { AuthService } = await import('../services/authService');
          const user = await AuthService.fetchUserProfile(session.user.id);
          
          if (user) {
            useAuthStore.getState().setUser(user);
            useAuthStore.getState().setRequires2FA(false);
          }
        }
        
        Alert.alert(
          'Başarılı',
          'İki faktörlü kimlik doğrulama başarılı',
          [
            {
              text: 'Devam Et',
              onPress: () => {
                if (onSuccess) {
                  onSuccess();
                } else {
                  navigation.navigate('MainTabs' as never);
                }
              }
            }
          ]
        );
      } else {
        setAttempts(prev => prev + 1);
        setVerificationCode('');
        
        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        const remainingAttempts = maxAttempts - attempts - 1;
        Alert.alert(
          'Hatalı Kod',
          `Yanlış doğrulama kodu. Kalan deneme: ${remainingAttempts}`,
          [
            {
              text: 'Tekrar Dene',
              onPress: () => inputRef.current?.focus()
            }
          ]
        );
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      Alert.alert('Hata', 'Doğrulama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    Alert.alert(
      'Yeni Kod',
      'TOTP kodları otomatik olarak 30 saniyede bir yenilenir. Lütfen authenticator uygulamanızdan güncel kodu kullanın.',
      [{ text: 'Tamam' }]
    );
  };

  const handleBackToLogin = () => {
    Alert.alert(
      'Giriş Sayfasına Dön',
      'İki faktörlü kimlik doğrulamayı atlamak istiyor musunuz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Evet',
          onPress: () => navigation.navigate('Login' as never)
        }
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>İki Faktörlü Doğrulama</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={80} color={colors.primary} />
        </View>

        <Text style={styles.description}>
          Güvenliğiniz için iki faktörlü kimlik doğrulama gereklidir.
        </Text>

        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>6 Haneli Doğrulama Kodunu Girin</Text>
          
          <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
            <TextInput
              ref={inputRef}
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
            />
          </Animated.View>

          <Text style={styles.codeHint}>
            Authenticator uygulamanızdan 6 haneli kodu girin
          </Text>
        </View>



        <View style={styles.attemptsSection}>
          <Text style={[
            styles.attemptsText,
            { color: attempts >= maxAttempts - 2 ? '#FF3B30' : colors.textSecondary }
          ]}>
            Kalan deneme: {maxAttempts - attempts}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={() => {
            Keyboard.dismiss();
            handleVerify();
          }}
          disabled={loading || !verificationCode.trim() || attempts >= maxAttempts}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.verifyButtonText}>Doğrula</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
        >
          <Text style={styles.resendButtonText}>Yardım</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}