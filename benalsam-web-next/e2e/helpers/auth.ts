/**
 * E2E Test Helper: Authentication
 * 
 * Helper functions for creating and managing test users in E2E tests
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Get test user credentials
 * Can be overridden via environment variables for using existing users
 * This is a function to ensure environment variables are loaded when called
 */
// Store generated password globally so getTestUser() can access it
let generatedPassword: string | null = null;

export function getTestUser() {
  // Default password meets Supabase requirements: min 8 chars, uppercase, lowercase, number
  const defaultPassword = 'TestPassword123!';
  
  // Try to read generated password from file (created by global setup)
  let generatedPasswordFromFile: string | null = null;
  try {
    const fs = require('fs');
    const path = require('path');
    const passwordFile = path.join(process.cwd(), '.e2e-test-password');
    if (fs.existsSync(passwordFile)) {
      generatedPasswordFromFile = fs.readFileSync(passwordFile, 'utf8').trim();
    }
  } catch (error) {
    // File doesn't exist or can't be read, that's okay
  }
  
  // If user provides a password, use it, but warn if it doesn't meet requirements
  const providedPassword = process.env.E2E_TEST_USER_PASSWORD;
  
  // Priority: generated password from file > global generated password > provided password > default
  const passwordToUse = generatedPasswordFromFile || generatedPassword || providedPassword || defaultPassword;
  
  if (providedPassword && providedPassword.length < 8 && !generatedPasswordFromFile && !generatedPassword) {
    console.warn('⚠️  Warning: Provided password is less than 8 characters. Supabase may reject it.');
  }
  
  return {
    email: process.env.E2E_TEST_USER_EMAIL || 'test@example.com',
    password: passwordToUse,
    name: process.env.E2E_TEST_USER_NAME || 'Test User',
    username: process.env.E2E_TEST_USER_USERNAME || `testuser-${Date.now()}`,
  };
}

export function setGeneratedPassword(password: string) {
  generatedPassword = password;
}

// Backward compatibility
export const TEST_USER = getTestUser();

/**
 * Create Supabase admin client for test setup
 */
export function createTestSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug: Check if environment variables are loaded
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('⚠️  Supabase credentials not found. Test user creation will be skipped.');
    console.warn('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
    console.warn('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Found' : '❌ Missing');
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create test user in Supabase
 * Returns user ID if successful, null if user already exists or creation fails
 */
export async function createTestUser(): Promise<string | null> {
  const supabaseAdmin = createTestSupabaseAdmin();
  
  if (!supabaseAdmin) {
    console.warn('⚠️  Cannot verify test user: Supabase admin client not available');
    return null;
  }

  // Get test user credentials (read from env at runtime)
  const TEST_USER = getTestUser();

  try {
    // Check if user already exists (for verification)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      // If using existing user from env, we can still proceed
      if (process.env.E2E_TEST_USER_EMAIL) {
        console.warn('⚠️  Cannot verify user exists, but will proceed with provided credentials');
        return 'unknown'; // Return non-null to proceed
      }
      return null;
    }
    
    const existingUser = existingUsers?.users?.find(
      (user) => user.email === TEST_USER.email
    );

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id);
      console.log('   Using existing test user for E2E tests');
      
      // Update password to ensure it's correct
      // If password is too short, generate a stronger one
      let passwordToUse = TEST_USER.password;
      
      if (TEST_USER.password.length < 8) {
        console.warn('⚠️  Password is too short (minimum 8 characters). Generating a stronger password for testing.');
        console.warn(`   Current password length: ${TEST_USER.password.length}`);
        
        // Generate a strong password that meets Supabase requirements
        // Format: TestUser{timestamp}! (e.g., TestUser123456!)
        const timestamp = Date.now().toString().slice(-6);
        passwordToUse = `TestUser${timestamp}!`;
        
        console.log(`   Generated test password: ${passwordToUse.substring(0, 4)}...${passwordToUse.substring(passwordToUse.length - 2)}`);
        console.log('   This password will be used for E2E tests');
      }
      
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: passwordToUse,
      });

      if (passwordError) {
        console.error('❌ Failed to update password:', passwordError.message);
        console.error(`   Password update error details:`, JSON.stringify(passwordError, null, 2));
        console.warn(`   You may need to manually set password in Supabase Dashboard`);
        console.warn(`   Or use a stronger password (min 8 chars, uppercase, lowercase, number)`);
      } else {
        console.log('   Password verified/updated successfully');
        // Update environment variable and write to file for test workers
        if (passwordToUse !== TEST_USER.password) {
          process.env.E2E_TEST_USER_PASSWORD = passwordToUse;
          setGeneratedPassword(passwordToUse);
          
          // Write to file so test workers can read it
          const fs = require('fs');
          const path = require('path');
          const passwordFile = path.join(process.cwd(), '.e2e-test-password');
          fs.writeFileSync(passwordFile, passwordToUse, 'utf8');
          
          console.log('   ⚠️  Note: Password was auto-generated. Update .env.local if you want to use a specific password.');
          console.log(`   📝 Generated password stored in .e2e-test-password for test workers`);
        }
      }

      // Ensure email is confirmed
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      });

      if (confirmError) {
        console.warn('⚠️  Failed to confirm email:', confirmError.message);
      } else {
        // Verify email confirmation was successful
        const { data: updatedUser } = await supabaseAdmin.auth.admin.getUserById(existingUser.id);
        if (updatedUser?.user?.email_confirmed_at) {
          console.log('   ✅ Email confirmed successfully');
        } else {
          console.warn('   ⚠️  Email confirmation may have failed - email_confirmed_at is still null');
        }
      }
      
      // Ensure profile exists
      const { data: profile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, name, is_2fa_enabled')
        .eq('id', existingUser.id)
        .single();

      if (profileCheckError || !profile) {
        console.warn('⚠️  Profile not found, attempting to create...');
        // Create profile if it doesn't exist
        // Check for existing usernames to ensure uniqueness
        const { data: existingUsernames } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .not('username', 'is', null);
        
        const usernameList = existingUsernames?.map((p: { username: string | null }) => p.username) || [];
        let uniqueUsername = TEST_USER.username || `testuser-${Date.now()}`;
        let counter = 1;
        while (usernameList.includes(uniqueUsername)) {
          uniqueUsername = `testuser-${Date.now()}-${counter}`;
          counter++;
        }

        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
          id: existingUser.id,
          email: TEST_USER.email,
          name: TEST_USER.name,
          username: uniqueUsername,
          role: 'user',
          is_2fa_enabled: false, // Disable 2FA for test user
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error('❌ Failed to create profile for existing user:', profileError.message);
          console.error('   Profile error details:', JSON.stringify(profileError, null, 2));
        }
      } else {
        // Ensure 2FA is disabled for test user (E2E tests can't handle TOTP codes)
        if (profile.is_2fa_enabled) {
          console.log('⚠️  Test user has 2FA enabled - disabling for E2E tests');
          const { error: disable2FAError } = await supabaseAdmin
            .from('profiles')
            .update({ is_2fa_enabled: false })
            .eq('id', existingUser.id);
          
          if (disable2FAError) {
            console.warn('⚠️  Failed to disable 2FA for test user:', disable2FAError.message);
          } else {
            console.log('✅ 2FA disabled for test user');
          }
        } else {
          // Explicitly ensure 2FA is disabled (in case it was enabled before)
          const { error: ensure2FADisabledError } = await supabaseAdmin
            .from('profiles')
            .update({ is_2fa_enabled: false })
            .eq('id', existingUser.id);
          
          if (ensure2FADisabledError) {
            console.warn('⚠️  Failed to ensure 2FA is disabled:', ensure2FADisabledError.message);
          }
        }
      }

      return existingUser.id;
    }

    // If using existing user from env vars but user not found, don't try to create
    if (process.env.E2E_TEST_USER_EMAIL) {
      console.error('❌ Test user not found:', TEST_USER.email);
      console.error('   Environment variable E2E_TEST_USER_EMAIL is set, but user does not exist in Supabase');
      console.error('   Please create the user manually or check the email address');
      return null;
    }

    // Create new user (only if not using existing user from env)
    console.log('🔄 Creating test user...');
    
    // Try using the register API endpoint first (this uses the same flow as production)
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      console.log('   Trying register API endpoint...');
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: TEST_USER.name,
          email: TEST_USER.email,
          password: TEST_USER.password,
          passwordConfirm: TEST_USER.password,
          acceptTerms: true,
        }),
      });

      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        if (registerData.data?.user?.id) {
          console.log('✅ Test user created via register API:', registerData.data.user.id);
          
          // Confirm email manually
          const userId = registerData.data.user.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirm: true,
          });
          
          return userId;
        }
      } else {
        const errorData = await registerResponse.json();
        if (errorData.error?.code === 'DUPLICATE_ENTRY') {
          // User already exists, find and return it
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.users?.find((u: { email?: string }) => u.email === TEST_USER.email);
          if (existingUser) {
            console.log('✅ Test user already exists (from API check):', existingUser.id);
            return existingUser.id;
          }
        }
        console.warn('⚠️  Register API failed:', registerResponse.status, errorData);
      }
    } catch (apiError) {
      console.warn('⚠️  Register API error, trying direct admin.createUser...', apiError instanceof Error ? apiError.message : String(apiError));
    }

    // Fallback to admin.createUser
    // Check for existing usernames to ensure uniqueness
    const { data: existingUsernames } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .not('username', 'is', null);
    
    const usernameList = existingUsernames?.map((p: { username: string | null }) => p.username) || [];
    let uniqueUsername = TEST_USER.username || `testuser-${Date.now()}`;
    let counter = 1;
    while (usernameList.includes(uniqueUsername)) {
      uniqueUsername = `testuser-${Date.now()}-${counter}`;
      counter++;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        name: TEST_USER.name,
      },
    });

    if (authError || !authData.user) {
      console.error('❌ Failed to create test user (auth):', authError?.message || 'Unknown error');
      console.error('   Error details:', JSON.stringify(authError, null, 2));
      return null;
    }

    // Wait a bit for any database triggers
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was auto-created by trigger
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (!existingProfile) {
        // Create profile with all required fields (matching register route)
        // Disable 2FA for test user (E2E tests can't handle TOTP codes)
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
          id: authData.user.id,
          email: TEST_USER.email,
          name: TEST_USER.name,
          username: uniqueUsername,
          role: 'user',
          is_2fa_enabled: false, // Disable 2FA for test user
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('❌ Failed to create test user profile:', profileError.message);
        console.error('   Profile error details:', JSON.stringify(profileError, null, 2));
        // Rollback: Delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return null;
      }
    }

    console.log('✅ Test user created successfully:', authData.user.id);
    console.log('   Username:', uniqueUsername);
    return authData.user.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error creating test user (exception):', errorMessage);
    if (errorStack) {
      console.error('   Stack trace:', errorStack);
    }
    if (error && typeof error === 'object') {
      console.error('   Error details:', JSON.stringify(error, null, 2));
    }
    return null;
  }
}

/**
 * Delete test user from Supabase
 */
export async function deleteTestUser(): Promise<void> {
  const supabaseAdmin = createTestSupabaseAdmin();
  const TEST_USER = getTestUser();
  
  if (!supabaseAdmin) {
    console.warn('⚠️  Cannot delete test user: Supabase admin client not available');
    return;
  }

  try {
    // Find user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users?.users?.find((user) => user.email === TEST_USER.email);

    if (!testUser) {
      console.log('ℹ️  Test user not found, nothing to delete');
      return;
    }

    // Delete user (this will cascade delete profile due to foreign key)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);

    if (error) {
      console.error('❌ Failed to delete test user:', error.message);
    } else {
      console.log('✅ Test user deleted successfully');
    }
  } catch (error) {
    console.error('❌ Error deleting test user:', error);
  }
}

/**
 * Reset test user password (useful if password was changed)
 */
export async function resetTestUserPassword(): Promise<boolean> {
  const supabaseAdmin = createTestSupabaseAdmin();
  const TEST_USER = getTestUser();
  
  if (!supabaseAdmin) {
    return false;
  }

  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users?.users?.find((user) => user.email === TEST_USER.email);

    if (!testUser) {
      return false;
    }

    await supabaseAdmin.auth.admin.updateUserById(testUser.id, {
      password: TEST_USER.password,
    });

    return true;
  } catch (error) {
    console.error('❌ Error resetting test user password:', error);
    return false;
  }
}

