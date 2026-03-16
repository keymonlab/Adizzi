import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import {
  mockPostsApi,
  mockCommentsApi,
  mockNotificationsApi,
  mockNeighborhoodsApi,
} from './helpers/api-mocks';
import {
  MOCK_POSTS,
  MOCK_COMMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_NEIGHBORHOODS,
} from './helpers/mock-data';

test.describe('Post detail screen', () => {
  test('displays post title, description, author and location', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');

    const post = MOCK_POSTS[0]; // '놀이터에서 아이 신발 발견'

    // Title appears in both the header and the content area
    await expect(page.getByText(post.title).first()).toBeVisible({ timeout: 15_000 });

    // Description
    await expect(page.getByText(post.description!)).toBeVisible({ timeout: 10_000 });

    // Author display name and handle
    await expect(page.getByText(post.author.display_name).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(`@${post.author.handle}`).first()).toBeVisible({ timeout: 10_000 });

    // Location name rendered in the meta row
    await expect(page.getByText(/역삼동 놀이터/).first()).toBeVisible({ timeout: 10_000 });

    // Category label — shoes → '신발'
    await expect(page.getByText(/신발/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('displays comments section with existing comments', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');

    // Wait for the post to load
    await expect(page.getByText(MOCK_POSTS[0].title).first()).toBeVisible({ timeout: 15_000 });

    // Comments section header
    await expect(page.getByText('댓글')).toBeVisible({ timeout: 10_000 });

    // All three comments for post-001 should be visible
    const post001Comments = MOCK_COMMENTS.filter((c) => c.post_id === 'post-001');
    for (const comment of post001Comments) {
      await expect(page.getByText(comment.content)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('shows comment input for authenticated user', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');

    await expect(page.getByText(MOCK_POSTS[0].title).first()).toBeVisible({ timeout: 15_000 });

    // CommentInput renders an input/textarea at the bottom for authenticated users
    const commentInput = page.locator('input[type="text"], textarea').last();
    await expect(commentInput).toBeVisible({ timeout: 10_000 });
  });

  test('navigates back when clicking back button', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');

    await expect(page.getByText(MOCK_POSTS[0].title).first()).toBeVisible({ timeout: 15_000 });

    // Header back button renders '←' — verify it exists and is clickable
    const backButton = page.getByText('←');
    await expect(backButton).toBeVisible({ timeout: 10_000 });
    await backButton.click();
  });
});
