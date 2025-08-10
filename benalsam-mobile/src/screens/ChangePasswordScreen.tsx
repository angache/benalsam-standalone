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
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const colors = useThemeColors();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validatePassword = (password: string) => {
    console.log('🔍 [ChangePassword] Validating password complexity...');
    
    if (password.length < 8) {
      console.log('❌ [ChangePassword] Password too short:', password.length, 'characters');
      return 'Şifre en az 8 karakter olmalıdır. (Mevcut: ' + password.length + ' karakter)';
    }
    
    if (!/[A-Z]/.test(password)) {
      console.log('❌ [ChangePassword] Missing uppercase letter');
      return 'Şifre en az bir büyük harf içermelidir. (A-Z)';
    }
    
    if (!/[a-z]/.test(password)) {
      console.log('❌ [ChangePassword] Missing lowercase letter');
      return 'Şifre en az bir küçük harf içermelidir. (a-z)';
    }
    
    if (!/\d/.test(password)) {
      console.log('❌ [ChangePassword] Missing digit');
      return 'Şifre en az bir rakam içermelidir. (0-9)';
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      console.log('❌ [ChangePassword] Missing special character');
      return 'Şifre en az bir özel karakter içermelidir (!@#$%^&*).';
    }
    
    console.log('✅ [ChangePassword] Password complexity validation passed');
    return null;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }

    // Email'i Supabase session'dan al
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    
    if (!userEmail) {
      console.error('🔴 [ChangePassword] No user email found in session:', session);
      setPasswordError('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    console.log('🟡 [ChangePassword] Starting password change for:', userEmail);

    // Password validation
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    // Password confirmation
    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }

    // Current password validation
    if (newPassword === currentPassword) {
      setPasswordError('Yeni şifre mevcut şifre ile aynı olamaz.');
      return;
    }

    // Dismiss keyboard before update
    dismissKeyboard();

    // Clear previous messages
    setPasswordError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      
      // Supabase'in resmi önerisi: Önce mevcut şifre ile giriş yaparak doğrulama
      console.log('🟡 [ChangePassword] Verifying current password...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });

      if (signInError) {
        console.error('🔴 [ChangePassword] Current password verification failed:', signInError);
        setPasswordError('Mevcut şifre yanlış.');
        setLoading(false);
        return;
      }

      console.log('✅ [ChangePassword] Current password verified successfully');
      
      // Şifre doğrulandıysa güncelleme yap
      console.log('🟡 [ChangePassword] Updating password...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        console.error('🔴 [ChangePassword] Password update error:', updateError);
        console.error('🔴 [ChangePassword] Error details:', {
          message: updateError.message,
          status: updateError.status,
          name: updateError.name,
          stack: updateError.stack
        });
        setPasswordError(updateError.message);
        setLoading(false);
        return;
      }
      
      console.log('🟢 [ChangePassword] Password updated successfully');
      
      setSuccessMessage('Şifreniz başarıyla güncellendi!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error: any) {
      console.error('Change password error:', error);
      setPasswordError('Şifre değiştirme işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };



  const handleBack = () => {
    dismissKeyboard();
    navigation.goBack();
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
              <Text style={styles.title}>Şifre Değiştir</Text>
              <Text style={styles.subtitle}>
                Güvenliğiniz için güçlü bir şifre belirleyin. Şifreniz en az 8 karakter olmalı ve özel karakterler içermelidir.
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

              <Input
                label="Mevcut Şifre"
                placeholder="Mevcut şifrenizi girin"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setPasswordError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                autoCorrect={false}
              />

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
                label="Yeni Şifre Tekrar"
                placeholder="Yeni şifrenizi tekrar girin"
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
                title={loading ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}
                onPress={handleChangePassword}
                loading={loading}
                fullWidth
              />

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleBack}
              >
                <Text style={styles.linkText}>
                  Geri Dön
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ChangePasswordScreen; 