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

// Mock navigator for mobile tests
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
});

// Mock window for mobile tests
Object.defineProperty(global, 'window', {
  value: {
    devicePixelRatio: 2,
  },
  writable: true,
});

// Mock React Native globals
global.__DEV__ = true;
global.__TEST__ = true;

// Mock React Native modules - avoid circular dependency
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Image: 'Image',
  TextInput: 'TextInput',
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  Alert: {
    alert: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
}));

// Silence console warnings in tests
console.warn = jest.fn();
console.error = jest.fn();