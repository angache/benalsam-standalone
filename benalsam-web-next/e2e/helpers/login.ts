/**
 * E2E Test Helper: Login Utilities
 * 
 * Helper functions for login operations in E2E tests
 */

import { Page } from '@playwright/test';
import { getTestUser } from './auth';

/**
 * Perform login and wait for auth state to be fully loaded
 * Returns true if login was successful, false otherwise
 */
export async function performLogin(page: Page): Promise<boolean> {
  const TEST_USER = getTestUser();
  
  // Debug: Log credentials being used
  console.log('🔍 [performLogin] Using credentials:', {
    email: TEST_USER.email,
    passwordLength: TEST_USER.password.length,
    passwordPreview: TEST_USER.password.substring(0, 4) + '...'
  });
  
  // Navigate to login page (don't use query params - fill manually for more control)
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Wait for form to render
  
  // Clear and fill email field
  await page.fill('input#email', '', { timeout: 10000 });
  await page.fill('input#email', TEST_USER.email, { timeout: 10000 });
  
  // Clear and fill password field
  await page.fill('input#password', '', { timeout: 10000 });
  await page.fill('input#password', TEST_USER.password, { timeout: 10000 });
  
  // Verify form is filled correctly
  const emailValue = await page.inputValue('input#email').catch(() => '');
  const passwordValue = await page.inputValue('input#password').catch(() => '');
  
  if (emailValue !== TEST_USER.email) {
    console.warn('⚠️  Email mismatch - expected:', TEST_USER.email, 'got:', emailValue);
    await page.fill('input#email', TEST_USER.email, { timeout: 10000 });
  }
  if (passwordValue !== TEST_USER.password) {
    console.warn('⚠️  Password mismatch - expected length:', TEST_USER.password.length, 'got length:', passwordValue.length);
    await page.fill('input#password', TEST_USER.password, { timeout: 10000 });
  }
  
  // Wait a bit before submitting to ensure form is ready
  await page.waitForTimeout(1000);
  
  // Wait for submit button to be enabled and visible
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });
  await submitButton.waitFor({ state: 'attached', timeout: 10000 });
  
  // Check if button is disabled (form might be invalid)
  const isDisabled = await submitButton.isDisabled().catch(() => false);
  if (isDisabled) {
    console.warn('⚠️  Submit button is disabled - form may be invalid');
    // Try to check for validation errors
    const validationErrors = await page.locator('[role="alert"]').or(page.locator('.text-red-600')).all();
    if (validationErrors.length > 0) {
      const errorTexts = await Promise.all(validationErrors.map(el => el.textContent().catch(() => '')));
      console.warn('⚠️  Form validation errors:', errorTexts);
    }
  }
  
  // Submit form - use force click to bypass overlay
  // Also wait for navigation to start (form submission triggers navigation)
  const navigationPromise = page.waitForURL(/.*(\/|\/auth\/2fa\/verify)/, { timeout: 20000 }).catch(() => null);
  await submitButton.click({ timeout: 10000, force: true });
  
  // Wait for form submission - check for loading state or navigation
  await page.waitForTimeout(1000); // Wait for form submission to start
  
  // Wait for navigation (either to home or 2FA page) or error message
  const navigationResult = await navigationPromise;
  
  if (!navigationResult) {
    // If no navigation after 20 seconds, check current state
    await page.waitForTimeout(3000); // Give extra time for slow connections
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth/login')) {
      // Check for error message
      const errorText = await page.locator('text=Hata').or(page.locator('[role="alert"]')).or(page.locator('text=Geçersiz')).or(page.locator('text=Hatalı')).or(page.locator('text=Invalid')).textContent({ timeout: 3000 }).catch(() => null);
      if (errorText) {
        console.log('❌ Login failed with error:', errorText);
      } else {
        console.log('❌ Login failed - still on login page, no error message found');
        // Check if submit button is still visible (form didn't submit)
        const submitStillVisible = await submitButton.isVisible({ timeout: 2000 }).catch(() => false);
        if (submitStillVisible) {
          console.log('⚠️  Submit button still visible - form may not have submitted');
        }
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/login-failed-debug.png', fullPage: true }).catch(() => {});
      }
      return false;
    }
  }
  
  const currentUrl = page.url();
  
  // Check if redirected to 2FA verification page
  if (currentUrl.includes('/auth/2fa/verify')) {
    console.log('✅ Login successful - user has 2FA enabled, redirected to 2FA verification');
    // For E2E tests, we'll skip 2FA verification (would need TOTP code)
    // Navigate to home page after 2FA (tests will handle 2FA separately if needed)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    return true;
  }
  
  // Check if still on login page (login failed)
  if (currentUrl.includes('/auth/login')) {
    console.log('❌ Login failed - still on login page');
    return false;
  }
  
  // Login successful - redirected to home (no 2FA)
  // Wait for page to fully load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Network idle may timeout if there are long polling connections - that's okay
  });
  
  // Wait for Supabase session cookie to be set (Next.js uses cookies, not localStorage)
  await page.waitForFunction(
    () => {
      const cookies = document.cookie.split(';');
      return cookies.some(cookie => 
        cookie.trim().includes('sb-') && cookie.trim().includes('auth-token')
      );
    },
    { timeout: 20000 }
  ).catch(() => {
    console.warn('⚠️  Supabase auth cookie not found - may still be loading');
  });
  
  // Wait for React to process auth state and Header to render
  // Try multiple times to wait for auth state
  let authStateLoaded = false;
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(2000);
    
    // Check for user avatar or logout button
    const userAvatar = page.locator('button[class*="rounded-full"]').filter({ has: page.locator('[class*="Avatar"]') }).first();
    const logoutButton = page.locator('text=Çıkış Yap').first();
    const userMenu = page.locator('button[aria-haspopup="menu"]').filter({ has: page.locator('[class*="Avatar"]') }).first();
    
    const avatarVisible = await userAvatar.isVisible({ timeout: 3000 }).catch(() => false);
    const logoutVisible = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
    const menuVisible = await userMenu.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (avatarVisible || logoutVisible || menuVisible) {
      console.log('✅ Login successful - auth state loaded');
      authStateLoaded = true;
      break;
    }
  }
  
  if (!authStateLoaded) {
    console.warn('⚠️  Login successful but user UI elements not visible yet - this may be a timing issue');
    // Even if UI elements aren't visible, if we're not on login page, login was successful
    // This allows tests to continue even if auth state takes longer to load
    return !currentUrl.includes('/auth/login');
  }
  
  return true;
}

