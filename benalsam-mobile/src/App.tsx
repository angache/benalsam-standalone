import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fcmTokenService } from './services/fcmTokenService';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(1);

  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);
  const handleSearchPress = () => {};
  const handleNotificationPress = () => {};
  const handleCreatePress = () => {};
  const handleMenuPress = () => {};

  const [fontsLoaded] = useFonts({
    'AmazonEmber-Regular': require('./assets/fonts/AmazonEmber_Rg.ttf'),
  });

  // FCM notification listener'ını ayarla
  useEffect(() => {
    console.log('🔔 Setting up FCM notification listeners...');
    fcmTokenService.setupNotificationListener();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserPreferencesProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </UserPreferencesProvider>
    </GestureHandlerRootView>
  );
} 