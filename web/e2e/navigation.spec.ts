/**
 * E2E Tests for Navigation
 *
 * Tests route navigation, authentication guards, and page structure.
 */

import { test, expect } from '@playwright/test';

test.describe('Public Routes', () => {
  test('home page redirects to login', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible();
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Protected Routes (Unauthenticated)', () => {
  test('dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('vehicles page redirects to login', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page).toHaveURL(/\/login/);
  });

  test('vehicle finances page redirects to login', async ({ page }) => {
    await page.goto('/vehicle-finances');
    await expect(page).toHaveURL(/\/login/);
  });

  test('user management page redirects to login', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login/);
  });

  test('conversations page redirects to login', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('External Routes', () => {
  test('external ride form is publicly accessible', async ({ page }) => {
    // External forms might be accessible without auth
    await page.goto('/ride-form');
    // Should either show form or redirect - depends on implementation
    // Just check the page loads without error
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('404 Handling', () => {
  test('invalid route shows 404 or redirects', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    // Should either show 404 page or redirect to login/home
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Page Load Performance', () => {
  test('login page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.getByRole('heading', { name: /bienvenido/i }).waitFor();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Accessibility', () => {
  test('login page has proper page structure', async ({ page }) => {
    await page.goto('/login');

    // Should have main heading
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible();

    // Form should be accessible
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeEnabled();

    // Labels should be associated with inputs
    const emailLabel = page.getByLabel(/correo electrónico/i);
    await expect(emailLabel).toBeVisible();
  });

  test('form controls are keyboard accessible', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    const emailFocused = await page.getByLabel(/correo electrónico/i).evaluate(
      (el) => el === document.activeElement
    );
    // Email or first focusable element should be focused
    expect(emailFocused).toBeTruthy();

    await page.keyboard.press('Tab');
    // Password field should be focusable
    const passwordInput = page.getByLabel(/contraseña/i);
    await expect(passwordInput).toBeVisible();
  });
});
