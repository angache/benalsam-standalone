import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';

const AuthCallbackScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { signInWithSession } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);
        
        // Handle authentication callback
        const success = await signInWithSession();
        
        if (success) {
          // Navigate to home on successful authentication
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          setError('Kimlik doğrulama başarısız oldu. Lütfen tekrar deneyin.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [signInWithSession, navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Giriş yapılıyor...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Giriş Başarısız
          </Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <View style={styles.buttonContainer}>
            <Text 
              style={[styles.retryButton, { color: colors.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              Tekrar Dene
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={[styles.successTitle, { color: colors.text }]}>
          Giriş Başarılı
        </Text>
        <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
          Ana sayfaya yönlendiriliyorsunuz...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    marginTop: 16,
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});

export default AuthCallbackScreen; 