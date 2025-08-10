import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { fcmTokenService, FCMToken } from '../services/fcmTokenService';
import { notificationService, NotificationPayload } from '../services/notificationService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { supabase  } from '../services/supabaseClient';
import { useThemeColors } from '../stores/themeStore';

export default function FCMTestScreen() {
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<FCMToken[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    if (user) {
      loadUserTokens();
    }
  }, [user]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const loadUserTokens = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const tokens = await fcmTokenService.getUserTokens(user.id);
      setUserTokens(tokens);
      addTestResult(`Loaded ${tokens.length} user tokens`);
    } catch (error) {
      addTestResult(`Error loading tokens: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetFCMToken = async () => {
    try {
      setLoading(true);
      addTestResult('Testing FCM token generation...');
      
      const token = await fcmTokenService.getFCMToken();
      setCurrentToken(token);
      
      if (token) {
        addTestResult(`✅ FCM token obtained: ${token.substring(0, 20)}...`);
      } else {
        addTestResult('❌ Failed to get FCM token');
      }
    } catch (error) {
      addTestResult(`❌ Error getting FCM token: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSaveToken = async () => {
    if (!user || !currentToken) {
      addTestResult('❌ No user or token available');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Testing token save to Supabase...');
      
      const success = await fcmTokenService.saveTokenToSupabase(user.id, currentToken);
      
      if (success) {
        addTestResult('✅ Token saved successfully');
        await loadUserTokens(); // Refresh list
      } else {
        addTestResult('❌ Failed to save token');
      }
    } catch (error) {
      addTestResult(`❌ Error saving token: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserLogin = async () => {
    if (!user) {
      addTestResult('❌ No user available');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Testing user login FCM setup...');
      
      const success = await fcmTokenService.onUserLogin(user.id);
      
      if (success) {
        addTestResult('✅ User login FCM setup successful');
        await loadUserTokens(); // Refresh list
      } else {
        addTestResult('❌ User login FCM setup failed');
      }
    } catch (error) {
      addTestResult(`❌ Error in user login setup: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserLogout = async () => {
    if (!user) {
      addTestResult('❌ No user available');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Testing user logout FCM cleanup...');
      
      const success = await fcmTokenService.onUserLogout(user.id);
      
      if (success) {
        addTestResult('✅ User logout FCM cleanup successful');
        await loadUserTokens(); // Refresh list
      } else {
        addTestResult('❌ User logout FCM cleanup failed');
      }
    } catch (error) {
      addTestResult(`❌ Error in user logout cleanup: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const deleteAllTokens = async () => {
    if (!user) return;

    Alert.alert(
      'Delete All Tokens',
      'Are you sure you want to delete all FCM tokens for this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              addTestResult('Deleting all user tokens...');
              
              const success = await fcmTokenService.deleteToken(user.id);
              
              if (success) {
                addTestResult('✅ All tokens deleted');
                await loadUserTokens(); // Refresh list
              } else {
                addTestResult('❌ Failed to delete tokens');
              }
            } catch (error) {
              addTestResult(`❌ Error deleting tokens: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const testSendNotification = async () => {
    if (!user || !currentToken || !selectedNotification) {
      addTestResult('❌ No user, token, or notification selected');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Testing notification send...');
      
      const result = await notificationService.sendToToken(currentToken, selectedNotification);
      
      if (result.success) {
        addTestResult(`✅ Notification sent: ${result.message}`);
      } else {
        addTestResult(`❌ Notification failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Error sending notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSendToUser = async () => {
    if (!user || !selectedNotification) {
      addTestResult('❌ No user or notification selected');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Testing notification to user...');
      
      const result = await notificationService.sendToUser(user.id, selectedNotification);
      
      if (result.success) {
        addTestResult(`✅ User notification sent: ${result.message}`);
      } else {
        addTestResult(`❌ User notification failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Error sending user notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testBroadcast = async () => {
    if (!selectedNotification) {
      addTestResult('❌ No notification selected');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Testing broadcast notification...');
      
      const result = await notificationService.sendBroadcast(selectedNotification);
      
      if (result.success) {
        addTestResult(`✅ Broadcast sent: ${result.message}`);
      } else {
        addTestResult(`❌ Broadcast failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Error sending broadcast: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const showJwtToken = async () => {
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (jwt) {
      console.log('🔑 JWT Token:', jwt);
      addTestResult('JWT token console.log ile gösterildi.');
    } else {
      addTestResult('JWT token bulunamadı.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>FCM Token Test</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          User: {user?.email || 'Not logged in'}
        </Text>
      </View>

      <Card style={{ ...styles.card, backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Token</Text>
        {currentToken ? (
          <Text style={[styles.tokenText, { color: colors.text }]} numberOfLines={2}>
            {currentToken}
          </Text>
        ) : (
          <Text style={[styles.noTokenText, { color: colors.textSecondary }]}>No token generated</Text>
        )}
      </Card>

      <Card style={{ ...styles.card, backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>User Tokens ({userTokens.length})</Text>
        {userTokens.length > 0 ? (
          userTokens.map((token, index) => (
            <View key={token.id} style={[styles.tokenItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tokenInfo, { color: colors.textSecondary }]}>
                Platform: {token.platform} | Active: {token.is_active ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.tokenText, { color: colors.text }]} numberOfLines={1}>
                {token.token}
              </Text>
              <Text style={[styles.tokenDate, { color: colors.textSecondary }]}>
                Last used: {new Date(token.last_used).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noTokenText, { color: colors.textSecondary }]}>No tokens found</Text>
        )}
      </Card>

      <Card style={{ ...styles.card, backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Actions</Text>
        
        <View style={styles.buttonRow}>
          <Button
            title="Get FCM Token"
            onPress={testGetFCMToken}
            disabled={loading}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
          <Button
            title="Save Token"
            onPress={testSaveToken}
            disabled={loading || !currentToken}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Test Login"
            onPress={testUserLogin}
            disabled={loading}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
          <Button
            title="Test Logout"
            onPress={testUserLogout}
            disabled={loading}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Refresh Tokens"
            onPress={loadUserTokens}
            disabled={loading}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
          <Button
            title="Delete All"
            onPress={deleteAllTokens}
            disabled={loading}
            style={{ ...styles.dangerButton, backgroundColor: colors.error }}
          />
        </View>
      </Card>

      <Card style={{ ...styles.card, backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>JWT Token</Text>
        <Button
          title="JWT Token'ı Console'a Yazdır"
          onPress={showJwtToken}
          style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
        />
      </Card>

      <Card style={{ ...styles.card, backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Test</Text>
        
        <View style={[styles.notificationSelector, { backgroundColor: colors.surface }]}>
          <Text style={[styles.selectorLabel, { color: colors.text }]}>Select Notification Template:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.templateScroll, { backgroundColor: colors.surface }]}>
            {notificationService.getTestNotifications().map((notification, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.templateButton,
                  selectedNotification?.title === notification.title && styles.selectedTemplate,
                  { backgroundColor: colors.surface, borderColor: colors.border }
                ]}
                onPress={() => setSelectedNotification(notification)}
              >
                <Text style={[styles.templateTitle, { color: colors.text }]} numberOfLines={1}>
                  {notification.title}
                </Text>
                <Text style={[styles.templateBody, { color: colors.textSecondary }]} numberOfLines={2}>
                  {notification.body}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedNotification && (
          <View style={[styles.selectedNotification, { backgroundColor: colors.surface, borderLeftColor: colors.success }]}>
            <Text style={[styles.selectedTitle, { color: colors.success }]}>{selectedNotification.title}</Text>
            <Text style={[styles.selectedBody, { color: colors.success }]}>{selectedNotification.body}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button
            title="Send to Token"
            onPress={testSendNotification}
            disabled={loading || !currentToken || !selectedNotification}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
          <Button
            title="Send to User"
            onPress={testSendToUser}
            disabled={loading || !selectedNotification}
            style={{ ...styles.button, backgroundColor: colors.primary, borderColor: colors.primary }}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            title="Broadcast"
            onPress={testBroadcast}
            disabled={loading || !selectedNotification}
            style={{ ...styles.broadcastButton, backgroundColor: colors.warning }}
          />
        </View>
      </Card>

      <Card style={{ ...styles.card, backgroundColor: colors.surface, borderColor: colors.border }}>
        <View style={[styles.resultsHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Results</Text>
          <TouchableOpacity onPress={clearTestResults} style={[styles.clearButton, { backgroundColor: colors.error }]}>
            <Text style={[styles.clearButtonText, { color: colors.text }]}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={[styles.resultsContainer, { backgroundColor: colors.surface }]} nestedScrollEnabled>
          {testResults.length > 0 ? (
            testResults.map((result, index) => (
              <Text key={index} style={[styles.resultText, { color: colors.text }]}>
                {result}
              </Text>
            ))
          ) : (
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>No test results yet</Text>
          )}
        </ScrollView>
      </Card>

      {loading && (
        <View style={{ ...styles.loadingOverlay, backgroundColor: colors.background + 'CC' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ ...styles.loadingText, color: colors.textSecondary }}>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  noTokenText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tokenItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  tokenInfo: {
    fontSize: 12,
    marginBottom: 4,
  },
  tokenDate: {
    fontSize: 10,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 10,
  },
  dangerButton: {
    borderRadius: 8,
    paddingVertical: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsContainer: {
    maxHeight: 200,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  notificationSelector: {
    marginBottom: 16,
    borderRadius: 8,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  templateScroll: {
    maxHeight: 120,
    borderRadius: 8,
  },
  templateButton: {
    width: 200,
    marginRight: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateBody: {
    fontSize: 10,
    lineHeight: 14,
  },
  selectedNotification: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedBody: {
    fontSize: 12,
  },
  broadcastButton: {
    borderRadius: 8,
    paddingVertical: 10,
  },
}); 