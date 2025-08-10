// Polyfills must be imported first
import './src/utils/polyfills';

import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Firebase
import { initializeFirebase } from './src/services/firebaseInit';

// React Query
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';

// Zustand Stores
import { useAuthStore } from './src/stores';

// Context
import { AppProvider } from './src/contexts/AppContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationService } from './src/services/navigationService';

export default function App() {
  const { initialize } = useAuthStore();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Initialize auth store when app starts
    initialize();
    
    // Initialize Firebase
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }, [initialize]);

  useEffect(() => {
    // Setup NavigationService when navigation is ready
    const setupNavigation = () => {
      if (navigationRef.current) {
        NavigationService.setTopLevelNavigator(navigationRef.current);
      } else {
        // Retry after a short delay
        setTimeout(setupNavigation, 100);
      }
    };
    
    setupNavigation();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppProvider>
              <NavigationContainer ref={navigationRef}>
                <AppNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </AppProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
