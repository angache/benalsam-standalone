import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { testFirebaseConnection } from '../services/firebaseTest';
import { testFirebaseSimple } from '../services/firebaseSimpleTest';
import { testFirebaseWithReset } from '../services/firebaseReset';
import { testFirebaseRules } from '../services/firebaseRulesTest';
import { useThemeColors } from '../stores/themeStore';

const FirebaseTestScreen: React.FC = () => {
  const colors = useThemeColors();
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsLoading(true);
    addResult(`🧪 Starting ${testName}...`);
    
    try {
      const result = await testFunction();
      addResult(`✅ ${testName}: ${result.message || 'Success'}`);
      if (result.data) {
        addResult(`📊 Data: ${JSON.stringify(result.data, null, 2)}`);
      }
    } catch (error) {
      addResult(`❌ ${testName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionTest = () => {
    runTest('Connection Test', testFirebaseConnection);
  };

  const handleSimpleTest = () => {
    runTest('Simple Test', testFirebaseSimple);
  };

  const handleResetTest = () => {
    runTest('Reset Test', testFirebaseWithReset);
  };

  const handleRulesTest = () => {
    runTest('Rules Test', testFirebaseRules);
  };

  const handleAllTests = async () => {
    setIsLoading(true);
    addResult('🧪 Running all tests...');
    
    try {
      // Reset test
      addResult('🔄 Running reset test...');
      const resetResult = await testFirebaseWithReset();
      addResult(`✅ Reset test: ${resetResult.message}`);
      
      // Simple test
      addResult('🔄 Running simple test...');
      const simpleResult = await testFirebaseSimple();
      addResult(`✅ Simple test: ${simpleResult.message}`);
      
      // Connection test
      addResult('🔄 Running connection test...');
      const connectionResult = await testFirebaseConnection();
      addResult(`✅ Connection test: ${connectionResult.message}`);
      
      addResult('🎉 All tests completed!');
    } catch (error) {
      addResult(`❌ All tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ ...styles.container, backgroundColor: colors.background }}>
      <Text style={{ ...styles.title, color: colors.text }}>Firebase Test Screen</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={{ ...styles.button, backgroundColor: colors.error }}
          onPress={handleResetTest}
          disabled={isLoading}
        >
          <Text style={{ ...styles.buttonText, color: colors.white }}>Reset & Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ ...styles.button, backgroundColor: colors.secondary }}
          onPress={handleRulesTest}
          disabled={isLoading}
        >
          <Text style={{ ...styles.buttonText, color: colors.white }}>Rules Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ ...styles.button, backgroundColor: colors.primary }}
          onPress={handleSimpleTest}
          disabled={isLoading}
        >
          <Text style={{ ...styles.buttonText, color: colors.white }}>Simple Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ ...styles.button, backgroundColor: colors.warning }}
          onPress={handleConnectionTest}
          disabled={isLoading}
        >
          <Text style={{ ...styles.buttonText, color: colors.text }}>Connection Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ ...styles.button, backgroundColor: colors.success }}
          onPress={handleAllTests}
          disabled={isLoading}
        >
          <Text style={{ ...styles.buttonText, color: colors.white }}>Run All Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ ...styles.button, backgroundColor: colors.border }}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={{ ...styles.buttonText, color: colors.text }}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={{ ...styles.loadingContainer, backgroundColor: colors.background + 'CC' }}>
          <Text style={{ ...styles.loadingText, color: colors.textSecondary }}>Testing...</Text>
        </View>
      )}

      <View style={{ ...styles.resultsContainer, backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={{ ...styles.resultsTitle, color: colors.text }}>Test Results:</Text>
        {results.map((result, index) => (
          <Text key={index} style={{ ...styles.resultText, color: colors.text }}>{result}</Text>
        ))}
        {results.length === 0 && (
          <Text style={{ ...styles.noResultsText, color: colors.textSecondary }}>No test results yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
  },
  rulesButton: {
    backgroundColor: '#a55eea',
  },
  simpleButton: {
    backgroundColor: '#4ecdc4',
  },
  connectionButton: {
    backgroundColor: '#45b7d1',
  },
  allButton: {
    backgroundColor: '#96ceb4',
  },
  clearButton: {
    backgroundColor: '#feca57',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
    color: '#555',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default FirebaseTestScreen; 