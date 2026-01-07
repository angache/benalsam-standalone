/**
 * Playwright Global Teardown
 * 
 * Runs once after all tests finish.
 * Optionally cleans up test user (commented out by default to preserve test data).
 */

import { deleteTestUser } from './helpers/auth';
import { unlinkSync } from 'fs';
import { join } from 'path';

async function globalTeardown() {
  console.log('🧹 Starting E2E test global teardown...');
  
  // Clean up password file
  try {
    const passwordFile = join(process.cwd(), '.e2e-test-password');
    unlinkSync(passwordFile);
    console.log('   Cleaned up .e2e-test-password file');
  } catch (error) {
    // File doesn't exist, that's okay
  }
  
  // Uncomment the line below if you want to delete test user after tests
  // This is useful for CI/CD but may not be desired for local development
  // await deleteTestUser();
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;

