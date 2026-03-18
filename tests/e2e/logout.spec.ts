import { test, expect } from './fixtures/index';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockPostsApi, mockNotificationsApi, mockNeighborhoodsApi, mockCommentsApi } from './helpers/api-mocks';
import { MOCK_USER, MOCK_POSTS, MOCK_NOTIFICATIONS, MOCK_NEIGHBORHOODS, MOCK_COMMENTS } from './helpers/mock-data';

const SUPABASE_URL = 'https://iqmnoebrlbanarxopziw.supabase.co';

test.describe('Logout', () => {
  test('10.1. logout button is visible on profile tab', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/(tabs)/profile');

    await expect(page.getByText('로그아웃')).toBeVisible({ timeout: 15_000 });
  });

  test('10.2. clicking logout sends POST to auth/v1/logout', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    // Override logout endpoint to return 200 and subsequent session to return null
    await page.route(`${SUPABASE_URL}/auth/v1/logout`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    });
    await page.route(`${SUPABASE_URL}/auth/v1/session`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { session: null } }),
      });
    });

    await page.goto('/(tabs)/profile');

    await expect(page.getByText('로그아웃')).toBeVisible({ timeout: 15_000 });

    // Register listener before clicking
    const logoutPromise = page.waitForResponse(
      (resp) => resp.url().includes('/auth/v1/logout') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page.getByText('로그아웃').click();
    await logoutPromise;

    // User's display name should no longer be visible after logout
    await expect(page.getByText(MOCK_USER.display_name).first()).toBeHidden({ timeout: 15_000 });
  });

  test('10.3. after logout, navigating to / redirects to login', async ({ page }) => {
    // Set up as an already-logged-out state by using unauthenticated mocks
    await page.addInitScript((key: string) => {
      localStorage.removeItem(key);
    }, 'sb-iqmnoebrlbanarxopziw-auth-token');

    await page.route(`${SUPABASE_URL}/auth/v1/session`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { session: null } }),
      });
    });
    await page.route(`${SUPABASE_URL}/auth/v1/user`, (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not authenticated' }),
      });
    });
    await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid Refresh Token' }),
      });
    });

    await page.goto('/');

    // Should be redirected to the login screen
    await expect(
      page.getByText('어디찌').first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
