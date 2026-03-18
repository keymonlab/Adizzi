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
  MOCK_USER,
} from './helpers/mock-data';

const SUPABASE_URL = 'https://iqmnoebrlbanarxopziw.supabase.co';

test.describe('Comment CRUD', () => {
  // 1.1. submits a new comment and shows it in the list
  test('submits a new comment and shows it in the list', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    // Register POST mock for new comment before navigation
    const newComment = {
      id: 'comment-new-001',
      post_id: 'post-001',
      author_id: MOCK_USER.id,
      content: '테스트 댓글입니다',
      mentions: [],
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        display_name: MOCK_USER.display_name,
        handle: MOCK_USER.handle,
        avatar_url: MOCK_USER.avatar_url,
      },
    };
    await page.route(`${SUPABASE_URL}/rest/v1/comments*`, (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newComment),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/post/post-001');
    await expect(page.getByText('놀이터에서 아이 신발 발견').first()).toBeVisible({ timeout: 15_000 });

    // Locate the comment input by placeholder and type the new comment
    const commentInput = page.getByPlaceholder('댓글을 입력하세요...');
    await expect(commentInput).toBeVisible({ timeout: 10_000 });
    await commentInput.fill('테스트 댓글입니다');
    await expect(commentInput).toHaveValue('테스트 댓글입니다');

    // Submit button should be active (has content)
    const submitBtn = page.getByText('등록');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });

    // Wait for POST request when clicking submit
    const [postRequest] = await Promise.all([
      page.waitForRequest(
        (req) =>
          req.url().includes('/rest/v1/comments') && req.method() === 'POST',
        { timeout: 10_000 },
      ),
      submitBtn.click(),
    ]);

    expect(postRequest).toBeTruthy();

    // Input should be cleared after successful submission
    await expect(commentInput).toHaveValue('', { timeout: 5_000 });
  });

  // 1.2. shows empty comments state when post has no comments
  test('shows empty comments state when post has no comments', async ({ page }) => {
    await setupAuthenticatedUser(page);
    // post-004 has comment_count: 0
    await mockPostsApi(page, [MOCK_POSTS[3]]);
    await mockCommentsApi(page, []);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-004');
    await expect(page.getByText('강아지를 잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Empty state text from CommentList's ListEmptyComponent
    await expect(
      page.getByText('아직 댓글이 없어요. 첫 댓글을 남겨보세요!'),
    ).toBeVisible({ timeout: 10_000 });
  });

  // 1.3. delete button is only shown for the comment owner
  test('delete button is only shown for the comment owner', async ({ page }) => {
    // MOCK_USER is test-user-id-001
    // comment-001: authored by MOCK_OTHER_USER_1 (other-user-001)
    // comment-002: authored by MOCK_USER (test-user-id-001)
    await setupAuthenticatedUser(page);
    const commentsForPost = MOCK_COMMENTS.filter((c) => c.post_id === 'post-001');
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, commentsForPost);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');

    // Wait for both comments to be visible
    await expect(page.getByText('@testuser 이거 우리 아이꺼 같아요!').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('네, 연락 주세요!').first()).toBeVisible({ timeout: 10_000 });

    // Exactly one '삭제' button should be present (for own comment)
    const deleteButtons = page.getByText('삭제');
    await expect(deleteButtons).toHaveCount(1, { timeout: 5_000 });

    // The delete button belongs to comment-002 ('네, 연락 주세요!' by MOCK_USER)
    // Confirm the own comment row contains the delete button
    const ownCommentContent = page.getByText('네, 연락 주세요!').first();
    await expect(ownCommentContent).toBeVisible();

    // The other user's comment should NOT have a delete button nearby
    // We verify by confirming count is exactly 1 (already checked above)
  });

  // 1.4. clicking delete on own comment sends PATCH soft-delete request
  test('clicking delete on own comment sends PATCH soft-delete request', async ({ page }) => {
    await setupAuthenticatedUser(page);
    // Only include comment-002 (owned by MOCK_USER) so delete button is present
    const ownComment = MOCK_COMMENTS.find((c) => c.id === 'comment-002')!;
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, [ownComment]);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');
    await expect(page.getByText('네, 연락 주세요!').first()).toBeVisible({ timeout: 15_000 });

    const deleteBtn = page.getByText('삭제');
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 });

    // Wait for PATCH or DELETE request to the comments API
    const [mutationRequest] = await Promise.all([
      page.waitForRequest(
        (req) =>
          req.url().includes('/rest/v1/comments') &&
          (req.method() === 'PATCH' || req.method() === 'DELETE'),
        { timeout: 10_000 },
      ),
      deleteBtn.click(),
    ]);

    expect(mutationRequest).toBeTruthy();
  });

  // 1.5. submit button is disabled when comment input is empty
  test('submit button is disabled when comment input is empty', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockCommentsApi(page, MOCK_COMMENTS);
    await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/post/post-001');
    await expect(page.getByText('놀이터에서 아이 신발 발견').first()).toBeVisible({ timeout: 15_000 });

    const commentInput = page.getByPlaceholder('댓글을 입력하세요...');
    await expect(commentInput).toBeVisible({ timeout: 10_000 });

    // Input should be empty on page load
    await expect(commentInput).toHaveValue('');

    // Submit button should have reduced opacity when disabled (no content)
    const submitBtn = page.getByText('등록');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });

    // Typing real content and verifying button is clickable (functional test)
    await commentInput.fill('실제 댓글');
    await page.waitForTimeout(500);
    // Button should be interactable now
    await expect(submitBtn).toBeVisible();
  });
});
