import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { Button } from '../components';

const NotFoundScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.errorCode}>404</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Sayfa Bulunamadı
        </Text>
        <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Ana Sayfaya Dön"
            onPress={() => navigation.navigate('Home')}
            style={styles.primaryButton}
          />
          <Button
            title="Geri Git"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.secondaryButton}
          />
        </View>
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
  errorCode: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#ef4444',
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
    marginBottom: 32,
    maxWidth: 300,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});

export default NotFoundScreen; 