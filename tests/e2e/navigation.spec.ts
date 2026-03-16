import { test, expect } from './fixtures';

test.describe('Tab navigation', () => {
  test('displays all 5 tab labels', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('Home')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Map')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Create')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to Map tab', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Map').click();
    await page.waitForURL((url) => url.pathname.includes('map'), { timeout: 10_000 });
    await expect(page).toHaveURL(/map/);
  });

  test('navigates to Create tab', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Create').click();
    await page.waitForURL((url) => url.pathname.includes('create'), { timeout: 10_000 });
    await expect(page).toHaveURL(/create/);
  });

  test('navigates to Notifications tab', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Notifications').click();
    await page.waitForURL((url) => url.pathname.includes('notifications'), { timeout: 10_000 });
    await expect(page).toHaveURL(/notifications/);
  });

  test('navigates to Profile tab', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Profile').click();
    await page.waitForURL((url) => url.pathname.includes('profile'), { timeout: 10_000 });
    await expect(page).toHaveURL(/profile/);
  });

  test('active tab has aria-selected true', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });

    // Navigate to Map and verify it becomes the active tab
    await page.getByRole('tab', { name: 'Map' }).click();
    await page.waitForURL((url) => url.pathname.includes('map'), { timeout: 10_000 });

    await expect(page.getByRole('tab', { name: 'Map' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: 5_000 },
    );

    // Home tab should no longer be active
    await expect(page.getByRole('tab', { name: 'Home' })).not.toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
