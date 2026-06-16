import { test, expect } from '@playwright/test';

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the sign-in card when logged out', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Serrated Claws/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });

  test('email/password form is hidden by default and expands on click', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Use email & password/i });
    await expect(toggle).toBeVisible();

    const emailInput = page.getByPlaceholder(/email/i).first();
    await expect(emailInput).not.toBeVisible();

    await toggle.click();
    await expect(emailInput).toBeVisible();
  });

  test('shows error for bad credentials', async ({ page }) => {
    await page.getByRole('button', { name: /Use email & password/i }).click();
    await page.getByPlaceholder(/email/i).first().fill('bad@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Error text appears (exact wording from Supabase)
    await expect(page.locator('[class*="text-red"], [class*="danger"], [role="alert"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('magic link toggle hides password and shows send link button', async ({ page }) => {
    await page.getByRole('button', { name: /Use email & password/i }).click();
    await page.getByText(/Magic link/i).click();

    await expect(page.getByPlaceholder(/password/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Send link/i })).toBeVisible();
  });
});
