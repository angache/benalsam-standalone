/**
 * Playwright Global Setup
 * 
 * Runs once before all tests start.
 * Creates test user for E2E tests.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createTestUser } from './helpers/auth';

async function globalSetup() {
  console.log('🚀 Starting E2E test global setup...');
  
  // Load environment variables from .env.local
  const envPath = resolve(process.cwd(), '.env.local');
  const result = config({ path: envPath });
  
  if (result.error) {
    console.warn('⚠️  Could not load .env.local file:', result.error.message);
    console.warn('⚠️  Trying to use existing environment variables...');
  } else {
    console.log('✅ Environment variables loaded from .env.local');
  }
  
  // Check if using existing user from env vars
  if (process.env.E2E_TEST_USER_EMAIL) {
    console.log('📝 Using existing test user from environment variables:');
    console.log(`   Email: ${process.env.E2E_TEST_USER_EMAIL}`);
    console.log('   (Password and other details from .env.local)');
  }
  
  // Verify test user exists and is accessible
  const userId = await createTestUser();
  
  if (userId) {
    console.log('✅ Global setup completed successfully');
    console.log(`   Test user ID: ${userId}`);
  } else {
    console.warn('⚠️  Global setup completed but test user verification failed');
    console.warn('⚠️  Tests that require login will be skipped');
    console.warn('');
    console.warn('💡 Çözüm: .env.local dosyasına test kullanıcı bilgilerini ekleyin:');
    console.warn('   E2E_TEST_USER_EMAIL=your-test-user@example.com');
    console.warn('   E2E_TEST_USER_PASSWORD=your-password');
    console.warn('   E2E_TEST_USER_NAME=Test User (optional)');
    console.warn('   E2E_TEST_USER_USERNAME=testuser (optional)');
  }
}

export default globalSetup;

