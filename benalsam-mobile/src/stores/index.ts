// Export stores
export { useAuthStore } from './authStore';
export type { User } from './authStore';

export { useThemeStore, useThemeColors } from './themeStore';
export type { Theme, ThemeColors, ThemeMode } from './themeStore';

export { useCreateListingStore } from './createListingStore';

// Store initialization
export const initializeStores = async () => {
  console.log('🏪 Initializing stores...');
  
  // Auth store will auto-initialize from AsyncStorage
  // Theme store will auto-initialize from AsyncStorage
  // CreateListing store is in-memory only
  
  // Just wait a bit for stores to initialize
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('✅ Stores initialized');
}; 