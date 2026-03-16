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

test.describe('Home feed', () => {
  test('displays header and post cards', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('내 동네 분실물')).toBeVisible({ timeout: 10_000 });

    // All mock post titles should be visible
    for (const post of MOCK_POSTS) {
      await expect(page.getByText(post.title).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('displays category filter with all tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });

    // '전체' is always the first tab
    await expect(page.getByText('전체')).toBeVisible({ timeout: 10_000 });

    // Verify a sample of category labels from CATEGORIES constant.
    // Some tabs may be scrolled out of view in the horizontal ScrollView, so
    // assert they exist in the DOM (attached) rather than requiring visibility.
    await expect(page.getByText('전자기기').first()).toBeAttached({ timeout: 10_000 });
    await expect(page.getByText('지갑').first()).toBeAttached({ timeout: 10_000 });
    await expect(page.getByText('열쇠').first()).toBeAttached({ timeout: 10_000 });
    await expect(page.getByText('신발').first()).toBeAttached({ timeout: 10_000 });
    await expect(page.getByText('반려동물').first()).toBeAttached({ timeout: 10_000 });
  });

  test('shows empty state when no posts', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, []);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/');

    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });
    // PostList ListEmptyComponent
    await expect(page.getByText('아직 게시물이 없어요')).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to post detail when clicking a post card', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    const targetPost = MOCK_POSTS[0];
    await expect(page.getByText(targetPost.title).first()).toBeVisible({ timeout: 15_000 });

    await page.getByText(targetPost.title).first().click();

    await page.waitForURL(
      (url) => url.pathname.includes(`/post/${targetPost.id}`),
      { timeout: 10_000 },
    );
  });

  test('post card shows author handle and location', async ({ authenticatedPage: page }) => {
    await page.goto('/');

    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });

    const post = MOCK_POSTS[0]; // '놀이터에서 아이 신발 발견', handle: testuser, location: 역삼동 놀이터
    await expect(page.getByText(`@${post.author.handle}`).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/역삼동 놀이터/).first()).toBeVisible({ timeout: 10_000 });
  });
});
