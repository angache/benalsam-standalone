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
import { useNavigation } from '@react-navigation/native';
import { Input, Button } from '../components';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { user, signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    // Only navigate to MainTabs if user exists and 2FA is not required
    if (user) {
      navigation.navigate('MainTabs' as never);
    }
  }, [user, navigation]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli.');
      return;
    }

    // Dismiss keyboard before login
    dismissKeyboard();

    // Clear previous rate limit error
    setRateLimitError(null);

    try {
      setLoading(true);
      await signIn(email, password);
      // signIn handles 2FA navigation automatically
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error toString:', error.toString());
      
      // Basit rate limit kontrolü
      const errorText = error.message || error.toString() || '';
      
      if (errorText.includes('kilitlendi') || 
          errorText.includes('fazla başarısız deneme') || 
          errorText.includes('hızlı deneme') || 
          errorText.includes('bekleyin')) {
        console.log('🛡️ Rate limit error detected:', errorText);
        setRateLimitError(errorText);
      } else {
        console.log('🔴 Regular error:', errorText);
        Alert.alert('Hata', 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPress = () => {
    console.log('🔵 [LoginScreen] Navigating to Register screen');
    dismissKeyboard();
    navigation.navigate('Register' as never);
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
      backgroundColor: colors.error + '15', // %15 opacity - daha hafif
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
    linkButton: {
      alignItems: 'center',
      marginTop: 20,
    },
    linkText: {
      color: colors.primary,
      fontSize: 14,
    },
    forgotPasswordButton: {
      alignItems: 'center',
      marginTop: 10,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
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
              <Text style={styles.title}>BenAlsam</Text>
              <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
            </View>

            <View style={styles.form}>
              {rateLimitError && (
                <View style={styles.rateLimitError}>
                  <Text style={styles.rateLimitErrorText}>
                    🛡️ {rateLimitError}
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

              <Input
                label="Şifre"
                placeholder="Şifrenizi girin"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                autoCorrect={false}
              />

              <Button
                title={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                onPress={handleLogin}
                loading={loading}
                fullWidth
              />

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  dismissKeyboard();
                  navigation.navigate('ForgotPassword' as never);
                }}
              >
                <Text style={styles.forgotPasswordText}>
                  Şifremi Unuttum
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleRegisterPress}
              >
                <Text style={styles.linkText}>
                  Hesabınız yok mu? Kayıt olun
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen; 