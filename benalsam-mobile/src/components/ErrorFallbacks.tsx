import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Wifi,
  Server,
  User,
  Shield,
  FileX
} from 'lucide-react-native';
import { useThemeColors } from '../stores';

const { width: screenWidth } = Dimensions.get('window');

interface ErrorFallbackProps {
  onRetry?: () => void;
  onGoHome?: () => void;
  error?: Error;
}

// Simple inline error fallback
export const SimpleErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  onRetry, 
  error 
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.simpleContainer, { backgroundColor: colors.background }]}>
      <AlertTriangle size={48} color={colors.error} />
      <Text style={[styles.simpleTitle, { color: colors.text }]}>
        Bir hata oluştu
      </Text>
      <Text style={[styles.simpleMessage, { color: colors.textSecondary }]}>
        {error?.message || 'Beklenmedik bir hata meydana geldi'}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.simpleButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <RefreshCw size={16} color={colors.white} />
          <Text style={[styles.simpleButtonText, { color: colors.white }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Network error fallback
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  onRetry, 
  onGoHome 
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.warning, '#f59e0b']}
        style={styles.iconContainer}
      >
        <Wifi size={48} color={colors.white} />
      </LinearGradient>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Bağlantı Hatası
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        İnternet bağlantınızı kontrol edin ve tekrar deneyin.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <RefreshCw size={20} color={colors.white} />
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
        
        {onGoHome && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={onGoHome}
          >
            <Home size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Ana Sayfa
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Server error fallback
export const ServerErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  onRetry, 
  onGoHome 
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.error, '#dc2626']}
        style={styles.iconContainer}
      >
        <Server size={48} color={colors.white} />
      </LinearGradient>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Sunucu Hatası
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Sunucularımızda geçici bir sorun var. Lütfen daha sonra tekrar deneyin.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <RefreshCw size={20} color={colors.white} />
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
        
        {onGoHome && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={onGoHome}
          >
            <Home size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Ana Sayfa
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Authentication error fallback
export const AuthErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  onRetry, 
  onGoHome 
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.warning, '#f59e0b']}
        style={styles.iconContainer}
      >
        <User size={48} color={colors.white} />
      </LinearGradient>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Oturum Hatası
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <User size={20} color={colors.white} />
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Giriş Yap
          </Text>
        </TouchableOpacity>
        
        {onGoHome && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={onGoHome}
          >
            <Home size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Ana Sayfa
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Permission error fallback
export const PermissionErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  onRetry, 
  onGoHome 
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.error, '#dc2626']}
        style={styles.iconContainer}
      >
        <Shield size={48} color={colors.white} />
      </LinearGradient>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Yetki Hatası
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Bu içeriğe erişim yetkiniz bulunmuyor.
      </Text>
      
      <View style={styles.buttonContainer}>
        {onGoHome && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onGoHome}
          >
            <Home size={20} color={colors.white} />
            <Text style={[styles.buttonText, { color: colors.white }]}>
              Ana Sayfa
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Not found error fallback
export const NotFoundErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  onRetry, 
  onGoHome 
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.textSecondary, '#6b7280']}
        style={styles.iconContainer}
      >
        <FileX size={48} color={colors.white} />
      </LinearGradient>
      
      <Text style={[styles.title, { color: colors.text }]}>
        İçerik Bulunamadı
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Aradığınız içerik mevcut değil veya kaldırılmış.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onGoHome}
        >
          <Home size={20} color={colors.white} />
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Ana Sayfa
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Error fallback factory function
export const createErrorFallback = (
  type: 'network' | 'server' | 'auth' | 'permission' | 'notfound' | 'simple' = 'simple'
) => {
  switch (type) {
    case 'network':
      return NetworkErrorFallback;
    case 'server':
      return ServerErrorFallback;
    case 'auth':
      return AuthErrorFallback;
    case 'permission':
      return PermissionErrorFallback;
    case 'notfound':
      return NotFoundErrorFallback;
    default:
      return SimpleErrorFallback;
  }
};

const styles = StyleSheet.create({
  simpleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
  },
  simpleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  simpleMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  simpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  simpleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    maxWidth: 300,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {
  SimpleErrorFallback,
  NetworkErrorFallback,
  ServerErrorFallback,
  AuthErrorFallback,
  PermissionErrorFallback,
  NotFoundErrorFallback,
  createErrorFallback,
}; 