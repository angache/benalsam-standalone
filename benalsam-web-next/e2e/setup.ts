/**
 * Playwright Test Setup
 * 
 * This file runs before each test file to set up the test environment.
 * It disables Next.js dev overlay that interferes with E2E tests.
 */

import { Page } from '@playwright/test';

/**
 * Remove Next.js dev overlay that blocks clicks in E2E tests
 */
export async function removeDevOverlay(page: Page) {
  // Remove overlay elements (only if page is loaded)
  try {
    await page.evaluate(() => {
      // Remove dev overlay portal
      const overlay = document.querySelector('nextjs-portal');
      if (overlay) {
        overlay.remove();
      }
      
      // Remove dev overlay script
      const overlayScript = document.querySelector('script[data-nextjs-dev-overlay="true"]');
      if (overlayScript) {
        overlayScript.remove();
      }
      
      // Remove any overlay-related styles that might block interactions
      const overlayStyles = document.querySelectorAll('style[data-nextjs-dev-overlay]');
      overlayStyles.forEach(style => style.remove());
      
      // Force remove any elements that might intercept pointer events
      const interceptors = document.querySelectorAll('[data-nextjs-toast], [data-nextjs-dialog]');
      interceptors.forEach(el => el.remove());
    });
    
    // Wait a bit for DOM to update
    await page.waitForTimeout(100);
  } catch (error) {
    // Ignore errors if page is not loaded yet or execution context is destroyed
    // This can happen during navigation
  }
}

/**
 * Setup page to automatically remove dev overlay on navigation
 */
export async function setupPageForTests(page: Page) {
  // Inject CSS to hide overlay immediately (this runs before page loads)
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.id = 'e2e-hide-overlay';
    style.innerHTML = `
      nextjs-portal,
      [data-nextjs-dev-overlay],
      script[data-nextjs-dev-overlay="true"],
      #__next-build-watcher,
      #__next-dev-overlay {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        z-index: -9999 !important;
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
      }
      [data-nextjs-toast] {
        display: none !important;
        pointer-events: none !important;
      }
      [data-nextjs-dialog] {
        display: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // MutationObserver to remove overlay elements as they appear
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as Element;
            if (
              element.tagName === 'NEXTJS-PORTAL' ||
              element.hasAttribute('data-nextjs-dev-overlay') ||
              element.id === '__next-build-watcher' ||
              element.id === '__next-dev-overlay'
            ) {
              element.remove();
            }
            // Also check children
            const portals = element.querySelectorAll?.('nextjs-portal, [data-nextjs-dev-overlay]');
            portals?.forEach(p => p.remove());
          }
        });
      });
    });
    
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // Also remove existing overlays periodically
    const removeOverlays = () => {
      document.querySelectorAll('nextjs-portal, [data-nextjs-dev-overlay], script[data-nextjs-dev-overlay="true"]').forEach(el => el.remove());
    };
    
    removeOverlays();
    setInterval(removeOverlays, 100);
  });
  
  // Remove overlay before any action (only if page is already loaded)
  try {
    await removeDevOverlay(page);
  } catch (error) {
    // Ignore errors if page is not loaded yet
  }
  
  // Remove overlay on every navigation (with error handling)
  page.on('load', async () => {
    try {
      await removeDevOverlay(page);
    } catch (error) {
      // Ignore errors during navigation (execution context may be destroyed)
    }
  });
  
  // Remove overlay on DOMContentLoaded (with error handling)
  page.on('domcontentloaded', async () => {
    try {
      await removeDevOverlay(page);
    } catch (error) {
      // Ignore errors during navigation (execution context may be destroyed)
    }
  });
}

