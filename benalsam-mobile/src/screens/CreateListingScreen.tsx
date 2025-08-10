import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCreateListingStore } from '../stores';
import { CreateListingProvider } from '../contexts/CreateListingContext';
import CreateListingCategoryScreen from './CreateListingCategoryScreen';
import CreateListingDetailsScreen from './CreateListingDetailsScreen';
import CreateListingImagesScreen from "./CreateListingImagesScreen";
import StockImageSearchScreen from "./StockImageSearchScreen";
import CreateListingLocationScreen from "./CreateListingLocationScreen";
import SelectDistrictScreen from './SelectDistrictScreen';
import CreateListingConfirmScreen from './CreateListingConfirmScreen';

const Stack = createStackNavigator();

// Store reset wrapper component
const CreateListingNavigator = () => {
  const { reset } = useCreateListingStore();
  
  // Sadece ilk açılışta store'u temizle
  useFocusEffect(
    React.useCallback(() => {
      reset();
    }, []) // Dependency array'i boş bırak
  );

  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}
      initialRouteName="Category"
    >
      <Stack.Screen 
        name="Category" 
        component={CreateListingCategoryScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Details" 
        component={CreateListingDetailsScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Images" 
        component={CreateListingImagesScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen
        name="StockImageSearch"
        component={StockImageSearchScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="Location" 
        component={CreateListingLocationScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen 
        name="Confirm" 
        component={CreateListingConfirmScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }}
      />
      <Stack.Screen
        name="SelectDistrict"
        component={SelectDistrictScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  );
};

const CreateListingScreen = () => {
  return (
    <CreateListingProvider>
      <CreateListingNavigator />
    </CreateListingProvider>
  );
};

export default CreateListingScreen; 