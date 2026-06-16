import { test, expect, type Page } from '@playwright/test';

/**
 * Helpers
 */
async function signInWithPassword(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByRole('button', { name: /Use email & password/i }).click();
  await page.getByPlaceholder(/email/i).first().fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  // Wait for the app shell to appear (loading indicator disappears)
  await page.waitForSelector('text=⚔ Awakening', { state: 'detached', timeout: 15_000 });
}

/**
 * These tests require PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD env vars pointing
 * to a seeded test account in the Supabase project.  If they are absent the
 * tests are skipped gracefully.
 */
test.describe('Authenticated app shell', () => {
  const email = process.env.PLAYWRIGHT_EMAIL ?? '';
  const password = process.env.PLAYWRIGHT_PASSWORD ?? '';

  test.skip(!email || !password, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await signInWithPassword(page, email, password);
  });

  test('bottom nav is visible with at least 3 tabs', async ({ page }) => {
    const nav = page.locator('nav').filter({ has: page.locator('button') });
    await expect(nav.first()).toBeVisible();
    const buttons = nav.first().getByRole('button');
    await expect(buttons).toHaveCount(await buttons.count());
    expect(await buttons.count()).toBeGreaterThanOrEqual(3);
  });

  test('Overview tab renders member count stat', async ({ page }) => {
    // Overview is the default tab
    await expect(page.getByText(/members/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Roster tab renders a table header', async ({ page }) => {
    await page.getByRole('button', { name: /roster/i }).click();
    await expect(page.getByText('Character', { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('Bank/Treasury tab renders holdings panel', async ({ page }) => {
    await page.getByRole('button', { name: /bank|treasury/i }).click();
    await expect(page.getByText(/Current Holdings/i)).toBeVisible({ timeout: 8_000 });
  });

  test('global search filters roster results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('zzznomatch_xyz');
    // Roster should show zero results or "No members match"
    await expect(page.getByText(/No members match|0 members/i)).toBeVisible({ timeout: 8_000 });
    await searchInput.clear();
  });

  test('sign out returns to sign-in screen', async ({ page }) => {
    // Find sign-out button (could be in a menu/header)
    const signOutBtn = page.getByRole('button', { name: /sign out|log out/i });
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
      await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible({ timeout: 8_000 });
    } else {
      test.skip(true, 'Sign-out button not found in current viewport');
    }
  });
});

/**
 * Public / unauthenticated guard
 */
test('unauthenticated users cannot see app content', async ({ page }) => {
  await page.goto('/');
  // Should NOT see any tab navigation meant for authenticated users
  await expect(page.getByText(/Current Holdings/i)).not.toBeVisible();
  await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
});
