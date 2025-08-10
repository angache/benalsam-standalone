// Jest setup for React Native mobile tests
// This file is used to configure Jest for mobile app testing

// Mock React Native modules that cause issues in Jest environment
jest.mock('@react-native/js-polyfills', () => ({}));

// Mock AsyncStorage for tests
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock fetch for network requests
global.fetch = jest.fn();

// Silence console warnings in tests
console.warn = jest.fn();
console.error = jest.fn();