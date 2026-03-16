import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockNotificationsApi, mockPostsApi, mockNeighborhoodsApi, mockCommentsApi } from './helpers/api-mocks';
import { MOCK_NOTIFICATIONS, MOCK_POSTS, MOCK_NEIGHBORHOODS, MOCK_COMMENTS } from './helpers/mock-data';

test.describe('Notifications', () => {
  test('displays notifications list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/notifications');

    // Wait for the header to confirm the screen loaded
    await expect(authenticatedPage.getByText('알림', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // Each notification with an actor should show the actor's display name
    const actorNames = MOCK_NOTIFICATIONS.filter((n) => n.actor !== null).map(
      (n) => n.actor!.display_name,
    );
    // Deduplicate — a name may appear in multiple notifications
    const uniqueNames = [...new Set(actorNames)];
    for (const name of uniqueNames) {
      await expect(authenticatedPage.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    }

    // Post titles associated with notifications should also be visible
    const postTitles = MOCK_NOTIFICATIONS.filter((n) => n.post !== null).map(
      (n) => n.post!.title,
    );
    const uniqueTitles = [...new Set(postTitles)];
    for (const title of uniqueTitles) {
      await expect(authenticatedPage.getByText(title).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('displays notification type labels', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/notifications');

    await expect(authenticatedPage.getByText('알림', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // notif-001 is type 'mention' → '회원님을 멘션했어요'
    await expect(authenticatedPage.getByText('회원님을 멘션했어요').first()).toBeVisible({ timeout: 10_000 });

    // notif-002 is type 'comment' → '댓글을 남겼어요'
    await expect(authenticatedPage.getByText('댓글을 남겼어요').first()).toBeVisible({ timeout: 10_000 });

    // notif-003 is type 'new_post' → '새 분실물을 등록했어요'
    await expect(authenticatedPage.getByText('새 분실물을 등록했어요').first()).toBeVisible({ timeout: 10_000 });

    // notif-004 is type 'claim' → '주인이라고 합니다'
    await expect(authenticatedPage.getByText('주인이라고 합니다').first()).toBeVisible({ timeout: 10_000 });

    // notif-006 is type 'lost_alert_match' with no actor → '알 수 없는 사용자' and '분실물 알림과 일치해요'
    await expect(authenticatedPage.getByText('분실물 알림과 일치해요').first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows empty state when no notifications', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNotificationsApi(page, []);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
    await mockCommentsApi(page, MOCK_COMMENTS);

    await page.goto('/(tabs)/notifications');

    await expect(page.getByText('알림', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // EmptyState title and message from the ListEmptyComponent in notifications.tsx
    await expect(page.getByText('새로운 알림이 없어요')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('활동이 생기면 여기에 알림이 표시됩니다')).toBeVisible({ timeout: 10_000 });
  });

  test('shows mark all read button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/notifications');

    await expect(authenticatedPage.getByText('알림', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // '모두 읽음' button is always rendered in the header
    await expect(authenticatedPage.getByText('모두 읽음')).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to post when clicking notification', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/notifications');

    await expect(authenticatedPage.getByText('알림', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // Use the first notification that has a post_id
    const targetNotif = MOCK_NOTIFICATIONS.find((n) => n.post_id !== null)!;
    const targetPostTitle = targetNotif.post!.title;

    // Click the notification item — identified by its post title text
    await authenticatedPage.getByText(targetPostTitle).first().click();

    // URL should change to the post detail route
    await authenticatedPage.waitForURL(
      (url) => url.pathname.includes(`/post/${targetNotif.post_id}`),
      { timeout: 10_000 },
    );
  });
});
