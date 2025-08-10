import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input, Button } from '../components';
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updatePassword } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTokenAuthenticated, setIsTokenAuthenticated] = useState(false);
  const colors = useThemeColors();

  // Token-based authentication check
  useEffect(() => {
    const checkTokenAuthentication = async () => {
      try {
        console.log('🟡 [ResetPassword] Checking token authentication...');
        
        // Mevcut session'ı kontrol et
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ [ResetPassword] User already authenticated:', session.user.email);
          setIsTokenAuthenticated(true);
          return;
        }
        
        // URL'den token'ları kontrol et (deep link)
        const url = (route.params as any)?.url as string;
        if (url) {
          console.log('🟡 [ResetPassword] Checking URL for tokens:', url);
          const tokens = AuthService.parseTokensFromUrl(url);
          
          if (tokens.access_token && tokens.refresh_token) {
            console.log('🟡 [ResetPassword] Found tokens, attempting login...');
            const result = await AuthService.loginWithToken(tokens.access_token, tokens.refresh_token);
            
            if (result.success) {
              console.log('✅ [ResetPassword] Token authentication successful');
              setIsTokenAuthenticated(true);
            } else {
              console.error('🔴 [ResetPassword] Token authentication failed:', result.error);
              setPasswordError('Token doğrulama başarısız. Lütfen tekrar deneyin.');
            }
          } else {
            console.log('⚠️ [ResetPassword] No tokens found in URL');
            setPasswordError('Geçersiz veya eksik token. Lütfen email linkini tekrar kullanın.');
          }
        } else {
          console.log('⚠️ [ResetPassword] No URL provided');
          setPasswordError('Geçersiz erişim. Lütfen email linkini kullanın.');
        }
      } catch (error) {
        console.error('🔴 [ResetPassword] Error checking token authentication:', error);
        setPasswordError('Token kontrolü başarısız.');
      }
    };

    checkTokenAuthentication();
  }, [(route.params as any)?.url]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır.';
    }
    
    if (!/[A-Z]/.test(password)) {
      return 'Şifre en az bir büyük harf içermelidir.';
    }
    
    if (!/[a-z]/.test(password)) {
      return 'Şifre en az bir küçük harf içermelidir.';
    }
    
    if (!/\d/.test(password)) {
      return 'Şifre en az bir rakam içermelidir.';
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Şifre en az bir özel karakter içermelidir (!@#$%^&*).';
    }
    
    return null;
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }

    // Token authentication kontrolü
    if (!isTokenAuthenticated) {
      setPasswordError('Lütfen önce token doğrulamasını tamamlayın.');
      return;
    }

    // Password validation
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    // Password confirmation
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor.');
      return;
    }

    // Dismiss keyboard before update
    dismissKeyboard();

    // Clear previous messages
    setPasswordError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      
      // Update password using reset token method
      const result = await AuthService.updatePasswordWithResetToken(newPassword);
      
      if (result.success) {
        setSuccessMessage('Şifreniz başarıyla güncellendi!');
        // Clear form
        setNewPassword('');
        setConfirmPassword('');
        // Navigate to login after 2 seconds
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 2000);
      } else {
        setPasswordError(result.error || 'Şifre güncellenemedi.');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      setPasswordError('Şifre sıfırlama işlemi başarısız oldu.');
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
    passwordError: {
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
    passwordErrorText: {
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
    requirementsContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.gray[50] + '50',
      borderRadius: 8,
    },
    requirementsTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    requirementItem: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    tokenStatus: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
      borderWidth: 1.5,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tokenStatusText: {
      color: colors.primary,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 20,
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
              <Text style={styles.title}>Şifre Sıfırla</Text>
              <Text style={styles.subtitle}>
                {isTokenAuthenticated 
                  ? 'Token doğrulandı. Yeni şifrenizi belirleyin.'
                  : 'Token doğrulanıyor... Lütfen bekleyin.'
                }
              </Text>
            </View>

            <View style={styles.form}>
              {passwordError && (
                <View style={styles.passwordError}>
                  <Text style={styles.passwordErrorText}>
                    ⚠️ {passwordError}
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

              {!isTokenAuthenticated && (
                <View style={styles.tokenStatus}>
                  <Text style={styles.tokenStatusText}>
                    🔄 Token doğrulanıyor...
                  </Text>
                </View>
              )}

              <Input
                label="Yeni Şifre"
                placeholder="Yeni şifrenizi girin"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                autoCorrect={false}
              />

              <Input
                label="Şifre Tekrar"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setPasswordError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                autoCorrect={false}
              />

              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Şifre Gereksinimleri:</Text>
                <Text style={styles.requirementItem}>• En az 8 karakter</Text>
                <Text style={styles.requirementItem}>• En az bir büyük harf (A-Z)</Text>
                <Text style={styles.requirementItem}>• En az bir küçük harf (a-z)</Text>
                <Text style={styles.requirementItem}>• En az bir rakam (0-9)</Text>
                <Text style={styles.requirementItem}>• En az bir özel karakter (!@#$%^&*)</Text>
              </View>

              <Button
                title={loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
              />

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

export default ResetPasswordScreen; 