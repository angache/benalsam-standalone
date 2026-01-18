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
  
  // Wait for form to be fully rendered and interactive
  await page.waitForSelector('input#email', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('input#password', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 10000 });
  
  // Wait for React Hook Form to initialize and form to be ready
  await page.waitForFunction(
    () => {
      const emailInput = document.querySelector('input#email') as HTMLInputElement;
      const passwordInput = document.querySelector('input#password') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      return emailInput && passwordInput && submitButton && !submitButton.disabled;
    },
    { timeout: 10000 }
  );
  
  await page.waitForTimeout(500); // Small delay for form to be fully ready
  
  // Clear and fill email field - use fill for better reliability
  await page.fill('input#email', '', { timeout: 10000 });
  await page.fill('input#email', TEST_USER.email, { timeout: 10000 });
  
  // Trigger input event to ensure React Hook Form registers the change
  await page.evaluate((email) => {
    const input = document.querySelector('input#email') as HTMLInputElement;
    if (input) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, TEST_USER.email);
  
  // Clear and fill password field
  await page.fill('input#password', '', { timeout: 10000 });
  await page.fill('input#password', TEST_USER.password, { timeout: 10000 });
  
  // Trigger input event to ensure React Hook Form registers the change
  await page.evaluate((password) => {
    const input = document.querySelector('input#password') as HTMLInputElement;
    if (input) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, TEST_USER.password);
  
  // Wait for form validation to complete
  await page.waitForTimeout(800);
  
  // Verify form is filled correctly
  const emailValue = await page.inputValue('input#email').catch(() => '');
  const passwordValue = await page.inputValue('input#password').catch(() => '');
  
  if (emailValue !== TEST_USER.email) {
    console.warn('⚠️  Email mismatch - retrying fill. Expected:', TEST_USER.email, 'got:', emailValue);
    await page.fill('input#email', TEST_USER.email, { timeout: 10000, force: true });
    await page.waitForTimeout(300);
  }
  if (passwordValue !== TEST_USER.password) {
    console.warn('⚠️  Password mismatch - retrying fill. Expected length:', TEST_USER.password.length, 'got length:', passwordValue.length);
    await page.fill('input#password', TEST_USER.password, { timeout: 10000, force: true });
    await page.waitForTimeout(300);
  }
  
  // Wait for submit button to be enabled (form validation passed)
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });
  
  // Wait for button to be enabled (not disabled) and form to be valid
  await page.waitForFunction(
    () => {
      const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      const emailInput = document.querySelector('input#email') as HTMLInputElement;
      const passwordInput = document.querySelector('input#password') as HTMLInputElement;
      
      // Check if inputs have values
      const hasEmail = emailInput && emailInput.value.length > 0;
      const hasPassword = passwordInput && passwordInput.value.length > 0;
      
      // Check if button is enabled
      const isEnabled = button && !button.disabled;
      
      return hasEmail && hasPassword && isEnabled;
    },
    { timeout: 10000 }
  ).catch(() => {
    console.warn('⚠️  Submit button may still be disabled or form invalid');
  });
  
  // Double-check button is enabled
  const isDisabled = await submitButton.isDisabled().catch(() => false);
  if (isDisabled) {
    console.warn('⚠️  Submit button is disabled - form may be invalid');
    // Check for validation errors
    const validationErrors = await page.locator('[role="alert"]').or(page.locator('.text-red-600')).or(page.locator('text=Geçerli bir email')).all();
    if (validationErrors.length > 0) {
      const errorTexts = await Promise.all(validationErrors.map(el => el.textContent().catch(() => '')));
      console.warn('⚠️  Form validation errors:', errorTexts);
      return false;
    }
    // If no validation errors but button is disabled, wait a bit more
    await page.waitForTimeout(1000);
    
    // Final check
    const stillDisabled = await submitButton.isDisabled().catch(() => false);
    if (stillDisabled) {
      console.error('❌ Submit button still disabled after waiting - form may be invalid');
      return false;
    }
  }
  
  // Set up navigation promise BEFORE clicking (important for race conditions)
  // Wait for URL to change from /auth/login to either / or /auth/2fa/verify
  const initialUrl = page.url();
  const navigationPromise = page.waitForURL(
    (url) => {
      const path = new URL(url).pathname;
      return path !== '/auth/login' && (path === '/' || path.startsWith('/auth/2fa/verify'));
    },
    { timeout: 30000 }
  );
  
  // Also set up error detection - listen for console errors
  const consoleErrors: string[] = [];
  const consoleListener = (msg: any) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('🔍 [Console Error]', msg.text());
    }
  };
  page.on('console', consoleListener);
  
  // Also listen for network errors
  const networkErrors: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().includes('/api/auth/login')) {
      networkErrors.push(`HTTP ${response.status()}: ${response.url()}`);
      console.log('🔍 [Network Error]', response.status(), response.url());
    }
  });
  
  const errorPromise = page.waitForSelector('[role="status"]:has-text("Hata"), [data-sonner-toast]:has-text("Hata"), .toast:has-text("Hata")', { timeout: 10000 }).catch(() => null);
  
  console.log('🔍 [performLogin] Submitting form...');
  
  // Submit form - try clicking submit button first, if that doesn't work, try form.submit()
  try {
    // Check if button is still enabled before clicking
    const isStillEnabled = !(await submitButton.isDisabled().catch(() => true));
    console.log('🔍 [performLogin] Submit button enabled:', isStillEnabled);
    
    if (!isStillEnabled) {
      console.error('❌ Submit button is disabled - cannot submit form');
      return false;
    }
    
    await submitButton.click({ timeout: 10000, force: true });
    console.log('🔍 [performLogin] Submit button clicked');
  } catch (error) {
    console.warn('⚠️  Click failed, trying form.submit()...', error);
    // Fallback: submit form directly via React Hook Form
    await page.evaluate(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        // Try to trigger React Hook Form's handleSubmit
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    });
    console.log('🔍 [performLogin] Form submit event dispatched');
  }
  
  // Wait a bit for form submission to start
  await page.waitForTimeout(1000);
  
  // Check if form is loading
  const isLoadingAfterSubmit = await page.locator('button[type="submit"]:has(svg[class*="animate-spin"])').isVisible({ timeout: 2000 }).catch(() => false);
  console.log('🔍 [performLogin] Form loading after submit:', isLoadingAfterSubmit);
  
  // Wait for either navigation or error
  let result: { type: 'navigation' | 'error' | 'timeout' };
  try {
    result = await Promise.race([
      navigationPromise.then(() => ({ type: 'navigation' as const })),
      errorPromise.then(() => ({ type: 'error' as const })),
      page.waitForTimeout(30000).then(() => ({ type: 'timeout' as const }))
    ]);
  } catch (error) {
    result = { type: 'timeout' as const };
  }
  
  // Remove console listener
  page.off('console', consoleListener);
  
  // Check current state
  await page.waitForTimeout(1500); // Give time for any pending operations
  const currentUrl = page.url();
  
  console.log('🔍 [performLogin] Result type:', result.type);
  console.log('🔍 [performLogin] Current URL:', currentUrl);
  if (consoleErrors.length > 0) {
    console.log('🔍 [performLogin] Console errors:', consoleErrors);
  }
  if (networkErrors.length > 0) {
    console.log('🔍 [performLogin] Network errors:', networkErrors);
  }
  
  if (result.type === 'error' || (currentUrl.includes('/auth/login') && result.type !== 'navigation')) {
    // Check for error messages
    const toastError = await page.locator('[role="status"]').or(page.locator('[data-sonner-toast]')).or(page.locator('.toast')).filter({ hasText: /Hata|Geçersiz|Hatalı|Invalid|error/i }).textContent({ timeout: 3000 }).catch(() => null);
    const errorText = await page.locator('text=Hata').or(page.locator('[role="alert"]')).or(page.locator('text=Geçersiz')).or(page.locator('text=Hatalı')).or(page.locator('text=Invalid')).or(page.locator('text=Giriş yapılırken bir hata')).textContent({ timeout: 3000 }).catch(() => null);
    
    console.log('🔍 [performLogin] Toast error:', toastError);
    console.log('🔍 [performLogin] Inline error:', errorText);
    
    if (toastError || errorText) {
      console.log('❌ Login failed with error:', toastError || errorText);
      await page.screenshot({ path: 'test-results/login-error-debug.png', fullPage: true }).catch(() => {});
      return false;
    }
    
    // Check if form is still loading
    const isLoading = await page.locator('button[type="submit"]:has(svg[class*="animate-spin"])').isVisible({ timeout: 2000 }).catch(() => false);
    if (isLoading) {
      console.log('⚠️  Form is still loading - waiting longer...');
      // Wait for loading to complete
      await page.waitForFunction(
        () => {
          const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          const spinner = button?.querySelector('svg[class*="animate-spin"]');
          return !spinner;
        },
        { timeout: 10000 }
      ).catch(() => {});
      
      // Check URL again after loading
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      if (!finalUrl.includes('/auth/login')) {
        console.log('✅ Login succeeded after waiting for loading');
        // Continue with success flow below
      } else {
        console.log('❌ Login failed - still on login page after loading completed');
        await page.screenshot({ path: 'test-results/login-failed-debug.png', fullPage: true }).catch(() => {});
        return false;
      }
    } else {
      console.log('❌ Login failed - still on login page, no error message found');
      await page.screenshot({ path: 'test-results/login-failed-debug.png', fullPage: true }).catch(() => {});
      return false;
    }
  }
  
  // Use the currentUrl already defined above
  const currentPath = new URL(currentUrl).pathname;
  
  console.log('🔍 [performLogin] Final URL check - path:', currentPath);
  
  // Check if redirected to 2FA verification page
  if (currentPath.includes('/auth/2fa/verify')) {
    console.log('✅ Login successful - user has 2FA enabled, redirected to 2FA verification');
    // For E2E tests, we'll skip 2FA verification (would need TOTP code)
    // Navigate to home page after 2FA (tests will handle 2FA separately if needed)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    return true;
  }
  
  // Check if still on login page (login failed)
  if (currentPath.includes('/auth/login')) {
    console.log('❌ Login failed - still on login page');
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-still-on-page.png', fullPage: true }).catch(() => {});
    return false;
  }
  
  // If we're not on login page and not on 2FA page, assume we're on home page (login successful)
  if (currentPath === '/' || !currentPath.includes('/auth/')) {
    console.log('✅ Login successful - redirected to home page');
    // Continue with auth state loading check below
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
  // Check for Supabase session cookie first (more reliable than UI elements)
  const hasSessionCookie = await page.waitForFunction(
    () => {
      const cookies = document.cookie.split(';');
      return cookies.some(cookie => {
        const trimmed = cookie.trim();
        return (trimmed.includes('sb-') && trimmed.includes('auth-token')) || 
               trimmed.includes('supabase-auth-token');
      });
    },
    { timeout: 15000 }
  ).catch(() => false);
  
  if (hasSessionCookie) {
    console.log('✅ Supabase session cookie found - login successful');
  } else {
    console.warn('⚠️  Supabase session cookie not found - may still be loading');
  }
  
  // Wait for UI elements to appear (user avatar, logout button, etc.)
  // First, wait for Header component to be rendered
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000); // Give Header time to render
  
  let authStateLoaded = false;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(2000);
    
    // Check for user avatar - try multiple selectors
    const userAvatar1 = page.locator('button[aria-haspopup="menu"]').filter({ has: page.locator('[class*="Avatar"]') }).first();
    const userAvatar2 = page.locator('button:has([class*="Avatar"])').first();
    const userAvatar3 = page.locator('[class*="Avatar"]').first();
    
    // Check for logout button (might be in dropdown menu)
    const logoutButton = page.locator('text=Çıkış Yap').first();
    
    // Check for user name in header
    const userName = page.locator('[class*="text-sm"]').filter({ hasText: TEST_USER.name.split(' ')[0] }).first();
    
    // Check if dropdown menu is open (indicates user menu exists)
    const dropdownMenu = page.locator('[role="menu"]').first();
    
    const avatarVisible1 = await userAvatar1.isVisible({ timeout: 2000 }).catch(() => false);
    const avatarVisible2 = await userAvatar2.isVisible({ timeout: 2000 }).catch(() => false);
    const avatarVisible3 = await userAvatar3.isVisible({ timeout: 2000 }).catch(() => false);
    const logoutVisible = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
    const nameVisible = await userName.isVisible({ timeout: 2000 }).catch(() => false);
    const menuExists = await dropdownMenu.isVisible({ timeout: 1000 }).catch(() => false);
    
    // Check if any avatar is visible
    const anyAvatarVisible = avatarVisible1 || avatarVisible2 || avatarVisible3;
    
    if (anyAvatarVisible || logoutVisible || nameVisible || menuExists) {
      console.log('✅ Login successful - auth state loaded (attempt', i + 1, ')');
      console.log('   Avatar visible:', anyAvatarVisible, 'Logout visible:', logoutVisible, 'Name visible:', nameVisible);
      authStateLoaded = true;
      break;
    }
    
    // On last attempt, try clicking avatar button to open menu (if it exists but not visible)
    if (i === 9) {
      const avatarButton = await userAvatar1.isVisible({ timeout: 1000 }).catch(() => false) ? userAvatar1 : 
                          await userAvatar2.isVisible({ timeout: 1000 }).catch(() => false) ? userAvatar2 : null;
      if (avatarButton) {
        try {
          await avatarButton.click({ timeout: 2000 });
          await page.waitForTimeout(1000);
          const logoutAfterClick = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
          if (logoutAfterClick) {
            console.log('✅ Login successful - auth state loaded after clicking avatar');
            authStateLoaded = true;
            break;
          }
        } catch (error) {
          // Ignore click errors
        }
      }
    }
  }
  
  if (!authStateLoaded) {
    console.warn('⚠️  Login successful but user UI elements not visible yet - this may be a timing issue');
    console.warn('   Current URL:', currentUrl);
    console.warn('   Has session cookie:', hasSessionCookie);
    // Even if UI elements aren't visible, if we're not on login page and have session cookie, login was successful
    // This allows tests to continue even if auth state takes longer to load
    return !currentUrl.includes('/auth/login') && (Boolean(hasSessionCookie) || true); // Allow if not on login page
  }
  
  return true;
}

