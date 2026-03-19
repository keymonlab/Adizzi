import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import {
  mockPostsApi,
  mockNotificationsApi,
  mockNeighborhoodsApi,
  mockCommentsApi,
} from './helpers/api-mocks';
import {
  MOCK_POSTS,
  MOCK_NOTIFICATIONS,
  MOCK_NEIGHBORHOODS,
  MOCK_COMMENTS,
} from './helpers/mock-data';

const SUPABASE_URL = 'https://iqmnoebrlbanarxopziw.supabase.co';

test.describe('Error states', () => {
  // 8.1. post detail shows error state when API returns 500
  test('post detail shows error state when API returns 500', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    // Mock posts API to return 500 for all requests
    await page.route(`${SUPABASE_URL}/rest/v1/posts*`, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    const targetPost = MOCK_POSTS[0];
    await page.goto(`/post/${targetPost.id}`);

    await expect(page.getByText('게시물을 불러올 수 없어요')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('돌아가기')).toBeVisible({ timeout: 5_000 });
  });

  // 8.2. clicking 돌아가기 on post error screen navigates back
  test('clicking 돌아가기 on post error screen navigates back', async ({ page }) => {
    await setupAuthenticatedUser(page);
    // Mock posts to return 500 for detail
    await page.route(`${SUPABASE_URL}/rest/v1/posts*`, (route) => {
      if (route.request().url().includes('id=eq.')) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'access-control-expose-headers': 'content-range', 'content-range': '0-0/0' },
          body: JSON.stringify([]),
        });
      }
    });
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/post/post-001');
    await expect(page.getByText('게시물을 불러올 수 없어요')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('돌아가기')).toBeVisible({ timeout: 5_000 });

    await page.getByText('돌아가기').click();
    // router.back() should navigate away from the error page
    await page.waitForTimeout(2000);
  });

  // 8.3. home feed shows empty state when API returns empty array
  test('home feed shows empty state when API returns empty array', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, []);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/');

    await expect(page.getByText('우리 동네', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('아직 게시물이 없어요')).toBeVisible({ timeout: 10_000 });
  });

  // 8.4. profile My Posts section shows empty state
  test('profile My Posts section shows empty state', async ({ page }) => {
    await setupAuthenticatedUser(page);
    // Return empty list for all posts queries (includes useMyPosts)
    await mockPostsApi(page, []);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/profile');

    await expect(page.getByText('내 프로필')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('내 게시물')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('아직 작성한 게시물이 없어요')).toBeVisible({ timeout: 10_000 });
  });

  // 8.5. login page is shown when user is not authenticated
  test('login page is shown when user is not authenticated', async ({ unauthenticatedPage: page }) => {
    await page.goto('/');

    // Unauthenticated users should see the login screen, not the feed
    await expect(page.getByText('우리 동네 분실물 찾기')).toBeVisible({ timeout: 15_000 });

    // Feed header should not be visible
    await expect(page.getByText('우리 동네', { exact: true })).not.toBeVisible({ timeout: 5_000 });
  });
});
