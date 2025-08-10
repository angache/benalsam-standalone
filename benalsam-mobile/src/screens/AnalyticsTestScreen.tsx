import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import analyticsService from '../services/analyticsService';
import { AnalyticsEventType } from 'benalsam-shared-types';
import { useAuthStore } from '../stores/authStore';

const AnalyticsTestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { user } = useAuthStore();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testLegacyAnalytics = async () => {
    try {
      addResult('🔄 Testing legacy analytics...');
      
      // Test legacy trackEvent
      const legacyResult = await analyticsService.trackEvent({
        event_type: 'click',
        event_data: {
          screen_name: 'AnalyticsTestScreen',
          section_name: 'test_section',
          listing_id: 'test-listing-123'
        }
      });
      
      addResult(legacyResult ? '✅ Legacy analytics: SUCCESS' : '❌ Legacy analytics: FAILED');
    } catch (error) {
      addResult(`❌ Legacy analytics error: ${error}`);
    }
  };

  const testNewAnalytics = async () => {
    try {
      addResult('🔄 Testing new standardized analytics...');
      
      // Test new trackAnalyticsEvent
      const newResult = await analyticsService.trackAnalyticsEvent(
        AnalyticsEventType.BUTTON_CLICK,
        {
          button_name: 'test_button',
          screen_name: 'AnalyticsTestScreen',
          test_property: 'test_value'
        }
      );
      
      addResult(newResult ? '✅ New analytics: SUCCESS' : '❌ New analytics: FAILED');
    } catch (error) {
      addResult(`❌ New analytics error: ${error}`);
    }
  };

  const testAllEventTypes = async () => {
    try {
      addResult('🔄 Testing all event types...');
      
      const eventTypes = [
        { type: AnalyticsEventType.SCREEN_VIEW, name: 'Screen View' },
        { type: AnalyticsEventType.BUTTON_CLICK, name: 'Button Click' },
        { type: AnalyticsEventType.SEARCH, name: 'Search' },
        { type: AnalyticsEventType.LISTING_VIEW, name: 'Listing View' },
        { type: AnalyticsEventType.LISTING_CREATE, name: 'Listing Create' },
        { type: AnalyticsEventType.OFFER_SENT, name: 'Offer Sent' },
        { type: AnalyticsEventType.MESSAGE_SENT, name: 'Message Sent' },
        { type: AnalyticsEventType.APP_LOAD, name: 'App Load' },
        { type: AnalyticsEventType.API_CALL, name: 'API Call' },
        { type: AnalyticsEventType.ERROR_OCCURRED, name: 'Error Occurred' }
      ];

      for (const event of eventTypes) {
        const result = await analyticsService.trackAnalyticsEvent(event.type, {
          test_event: event.name,
          timestamp: new Date().toISOString()
        });
        
        addResult(result ? `✅ ${event.name}: SUCCESS` : `❌ ${event.name}: FAILED`);
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      addResult('🎉 All event types tested!');
    } catch (error) {
      addResult(`❌ Event types test error: ${error}`);
    }
  };

  const testHelperMethods = async () => {
    try {
      addResult('🔄 Testing helper methods...');
      
      const tests = [
        { method: () => analyticsService.trackScreenViewNew('TestScreen'), name: 'trackScreenViewNew' },
        { method: () => analyticsService.trackButtonClickNew('TestButton'), name: 'trackButtonClickNew' },
        { method: () => analyticsService.trackSearchNew('test search'), name: 'trackSearchNew' },
        { method: () => analyticsService.trackListingViewNew('test-listing-123'), name: 'trackListingViewNew' },
        { method: () => analyticsService.trackListingCreateNew('new-listing-456'), name: 'trackListingCreateNew' },
        { method: () => analyticsService.trackOfferSentNew('offer-789'), name: 'trackOfferSentNew' },
        { method: () => analyticsService.trackMessageSentNew('message-101'), name: 'trackMessageSentNew' },
        { method: () => analyticsService.trackAppLoadNew(), name: 'trackAppLoadNew' },
        { method: () => analyticsService.trackApiCallNew('/api/test', 150), name: 'trackApiCallNew' },
        { method: () => analyticsService.trackErrorNew('TestError', 'Test error message'), name: 'trackErrorNew' }
      ];

      for (const test of tests) {
        const result = await test.method();
        addResult(result ? `✅ ${test.name}: SUCCESS` : `❌ ${test.name}: FAILED`);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      addResult('🎉 All helper methods tested!');
    } catch (error) {
      addResult(`❌ Helper methods test error: ${error}`);
    }
  };

  const testUserContext = () => {
    addResult('👤 User Context:');
    addResult(`   ID: ${user?.id || 'Not logged in'}`);
    addResult(`   Email: ${user?.email || 'No email'}`);
    addResult(`   Name: ${user?.user_metadata?.name || 'No name'}`);
    addResult(`   Avatar: ${user?.user_metadata?.avatar_url || 'No avatar'}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Test Screen</Text>
        <Text style={styles.subtitle}>Test new standardized analytics implementation</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={testUserContext}>
            <Text style={styles.buttonText}>👤 Show User Context</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testLegacyAnalytics}>
            <Text style={styles.buttonText}>🔄 Test Legacy Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testNewAnalytics}>
            <Text style={styles.buttonText}>🆕 Test New Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAllEventTypes}>
            <Text style={styles.buttonText}>🎯 Test All Event Types</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testHelperMethods}>
            <Text style={styles.buttonText}>🛠️ Test Helper Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
            <Text style={styles.buttonText}>🗑️ Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet. Run a test to see results.</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noResults: {
    color: '#666',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default AnalyticsTestScreen; 