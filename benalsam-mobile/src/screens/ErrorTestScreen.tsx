import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Wifi, 
  Server, 
  User, 
  Zap,
  Bug
} from 'lucide-react-native';
import { ErrorReporter } from '../utils/errorBoundaryHelpers';

// Test component that throws errors
const BuggyComponent: React.FC<{ errorType: string }> = ({ errorType }) => {
  switch (errorType) {
    case 'network':
      throw new Error('Network request failed: Unable to fetch data from server');
    case 'server':
      throw new Error('Server Error 500: Internal server error occurred');
    case 'auth':
      throw new Error('Authentication failed: Invalid token or expired session');
    case 'generic':
      throw new Error('Something went wrong: Unexpected error in component');
    case 'async':
      // This will cause an unhandled promise rejection
      Promise.reject(new Error('Async operation failed'));
      return <Text>Async error triggered</Text>;
    default:
      return <Text>No error</Text>;
  }
};

const ErrorTestScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const testError = (errorType: string) => {
    setTriggerError(errorType);
    // Reset after a moment to allow retrying
    setTimeout(() => setTriggerError(null), 100);
  };

  const testManualErrorReporting = () => {
    try {
      throw new Error('Manual test error');
    } catch (error) {
      ErrorReporter.reportError(
        error as Error, 
        'Manual Test', 
        { testData: 'This is a test error report' }
      );
      Alert.alert('Test Completed', 'Check console for error report');
    }
  };

  const testNetworkErrorReporting = () => {
    const error = new Error('Failed to fetch data');
    ErrorReporter.reportNetworkError(
      'https://api.example.com/data',
      error,
      { status: 404, statusText: 'Not Found' }
    );
    Alert.alert('Network Error Reported', 'Check console for error report');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Error Boundary Test
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Bug size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Error Boundary Testing
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Bu sayfa Error Boundary sistemini test etmek için kullanılır. 
            Farklı hata türlerini tetikleyerek error boundary'lerin nasıl çalıştığını görebilirsiniz.
          </Text>
        </View>

        {/* Error Type Tests */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Error Boundary Tests
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.error }]}
            onPress={() => testError('network')}
            activeOpacity={0.8}
          >
            <Wifi size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Network Error
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.warning }]}
            onPress={() => testError('server')}
            activeOpacity={0.8}
          >
            <Server size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Server Error
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => testError('auth')}
            activeOpacity={0.8}
          >
            <User size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Auth Error
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.textSecondary }]}
            onPress={() => testError('generic')}
            activeOpacity={0.8}
          >
            <AlertTriangle size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Generic Error
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => testError('async')}
            activeOpacity={0.8}
          >
            <Zap size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Async Error
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Reporting Tests */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Error Reporting Tests
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.success }]}
            onPress={testManualErrorReporting}
            activeOpacity={0.8}
          >
            <Bug size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Manual Error Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.success }]}
            onPress={testNetworkErrorReporting}
            activeOpacity={0.8}
          >
            <Wifi size={20} color={colors.white} />
            <Text style={[styles.testButtonText, { color: colors.white }]}>
              Test Network Error Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Trigger Area */}
        {triggerError && (
          <View style={[styles.errorArea, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <Text style={[styles.errorAreaTitle, { color: colors.error }]}>
              Triggering {triggerError} error...
            </Text>
            <BuggyComponent errorType={triggerError} />
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorArea: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
  },
  errorAreaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  spacer: {
    height: 40,
  },
});

export default ErrorTestScreen; 