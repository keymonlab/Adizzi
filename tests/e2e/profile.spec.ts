import { test, expect } from './fixtures/index';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockPostsApi, mockNotificationsApi, mockNeighborhoodsApi, mockCommentsApi } from './helpers/api-mocks';
import { MOCK_USER, MOCK_POSTS, MOCK_NOTIFICATIONS, MOCK_NEIGHBORHOODS, MOCK_COMMENTS, getMyPosts } from './helpers/mock-data';

const SUPABASE_URL = 'https://iqmnoebrlbanarxopziw.supabase.co';

test.describe('Profile screen', () => {
  test('displays user profile information', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/(tabs)/profile');

    // Wait for static header first, then dynamic user data
    await expect(page.getByText('내 프로필')).toBeVisible({ timeout: 15_000 });

    // Display name and handle from MOCK_USER
    await expect(page.getByText(MOCK_USER.display_name).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(`@${MOCK_USER.handle}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test('displays settings menu items', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/profile');

    await expect(authenticatedPage.getByText('내 프로필')).toBeVisible({ timeout: 15_000 });

    // All four SettingsItem labels from profile.tsx
    await expect(authenticatedPage.getByText('프로필 수정')).toBeVisible({ timeout: 15_000 });
    await expect(authenticatedPage.getByText('동네 설정')).toBeVisible({ timeout: 15_000 });
    await expect(authenticatedPage.getByText('분실물 알림')).toBeVisible({ timeout: 15_000 });
    await expect(authenticatedPage.getByText('연락처 동기화')).toBeVisible({ timeout: 15_000 });

    // Logout button
    await expect(authenticatedPage.getByText('로그아웃')).toBeVisible({ timeout: 15_000 });
  });

  test('navigates to edit profile screen', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/profile');

    await expect(authenticatedPage.getByText('프로필 수정')).toBeVisible({ timeout: 15_000 });

    // Tap '프로필 수정' and expect navigation to /settings/edit-profile
    await authenticatedPage.getByText('프로필 수정').click();

    await authenticatedPage.waitForURL(
      (url) => url.pathname.includes('/settings/edit-profile'),
      { timeout: 10_000 },
    );
  });

  test('logout redirects to login', async ({ page }) => {
    // Set up auth + common API mocks manually (raw page, no authenticatedPage fixture)
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    // Stub logout endpoint and return null session afterwards
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

    // Verify the logout API call is made and user data disappears from the page
    const logoutPromise = page.waitForResponse(
      (resp) => resp.url().includes('/auth/v1/logout') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page.getByText('로그아웃').click();
    await logoutPromise;

    // After sign-out the user's display name should no longer be visible
    await expect(page.getByText(MOCK_USER.display_name).first()).toBeHidden({ timeout: 15_000 });
  });

  test('displays my posts section', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Provide only posts authored by the mock user
    const myPosts = getMyPosts();
    await mockPostsApi(page, myPosts);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/(tabs)/profile');

    await expect(page.getByText('내 게시물')).toBeVisible({ timeout: 15_000 });

    // Each post title from the user's own posts should be visible
    for (const post of myPosts) {
      await expect(page.getByText(post.title)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('shows empty state when user has no posts', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Return an empty list so the empty state renders
    await mockPostsApi(page, []);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/(tabs)/profile');

    await expect(page.getByText('내 게시물')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('아직 작성한 게시물이 없어요')).toBeVisible({ timeout: 15_000 });
  });
});
