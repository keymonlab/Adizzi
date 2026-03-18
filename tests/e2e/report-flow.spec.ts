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

/** Mock POST /rest/v1/reports to accept a report submission. */
async function mockReportsApi(page: import('@playwright/test').Page) {
  await page.route(`${SUPABASE_URL}/rest/v1/reports*`, (route, request) => {
    if (request.method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    } else {
      route.continue();
    }
  });
}

/** Navigate to a post detail page and wait for it to load. */
async function gotoPost(page: import('@playwright/test').Page, postId: string) {
  await page.goto(`/post/${postId}`);
  // Wait for the post title to appear — indicates the page has rendered
  const post = MOCK_POSTS.find((p) => p.id === postId)!;
  await expect(page.getByText(post.title).first()).toBeVisible({ timeout: 15_000 });
}

/** Open the three-dot options menu on the post detail screen. */
async function openOptionsMenu(page: import('@playwright/test').Page) {
  // The menu button has testID="menu-button" and accessibilityLabel="옵션"
  const menuBtn = page.getByTestId('menu-button');
  await menuBtn.click();
}

// ---------------------------------------------------------------------------
// Setup shared for all report-flow tests
// ---------------------------------------------------------------------------

async function setupPage(page: import('@playwright/test').Page) {
  await setupAuthenticatedUser(page);
  await mockPostsApi(page, MOCK_POSTS);
  await mockCommentsApi(page, MOCK_COMMENTS);
  await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
  await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
  await mockReportsApi(page);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Report flow', () => {
  // post-002 is authored by MOCK_OTHER_USER_1, so MOCK_USER (logged-in user) is NOT the owner
  const NON_OWNED_POST_ID = 'post-002';
  // post-001 is authored by MOCK_USER, so MOCK_USER IS the owner
  const OWNED_POST_ID = 'post-001';

  test('2.1 post options menu shows 신고하기 for non-owner', async ({ page }) => {
    await setupPage(page);
    await gotoPost(page, NON_OWNED_POST_ID);

    await openOptionsMenu(page);

    await expect(page.getByText('신고하기')).toBeVisible({ timeout: 10_000 });
    // Destructive delete option must NOT appear for non-owners
    await expect(page.getByText('삭제하기')).not.toBeVisible();
  });

  test('2.2 post options menu shows 삭제하기 for the post owner', async ({ page }) => {
    // post-001 author_id === MOCK_USER.id
    await setupPage(page);
    await gotoPost(page, OWNED_POST_ID);

    await openOptionsMenu(page);

    await expect(page.getByText('삭제하기')).toBeVisible({ timeout: 10_000 });
    // Report option must NOT appear for the owner
    await expect(page.getByText('신고하기')).not.toBeVisible();
  });

  test('2.3 report modal opens with all reason options', async ({ page }) => {
    await setupPage(page);
    await gotoPost(page, NON_OWNED_POST_ID);

    await openOptionsMenu(page);
    await page.getByText('신고하기').click();

    // Modal title
    await expect(page.getByText('게시물 신고')).toBeVisible({ timeout: 10_000 });

    // All five report reason labels
    await expect(page.getByText('스팸/광고')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('부적절한 내용')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('사기/허위 정보')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('괴롭힘/혐오')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('기타')).toBeVisible({ timeout: 10_000 });

    // Action buttons
    await expect(page.getByText('취소')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('신고하기').last()).toBeVisible({ timeout: 10_000 });
  });

  test('2.4 submitting a report without selecting a reason shows an alert', async ({ page }) => {
    await setupPage(page);
    await gotoPost(page, NON_OWNED_POST_ID);

    await openOptionsMenu(page);
    await page.getByText('신고하기').click();

    // Modal is open — do NOT select any reason
    await expect(page.getByText('게시물 신고')).toBeVisible({ timeout: 10_000 });

    // Click the submit button inside the modal (last '신고하기' text)
    // Note: Alert.alert is a no-op on web (react-native-web stub), so no browser dialog fires.
    // The validation prevents submission: the modal stays open and no API call is made.
    await page.getByText('신고하기').last().click();

    // Modal must still be visible — the report was not submitted
    await expect(page.getByText('게시물 신고')).toBeVisible({ timeout: 5_000 });
  });

  test('2.5 report is submitted successfully with a selected reason', async ({ page }) => {
    await setupPage(page);
    await gotoPost(page, NON_OWNED_POST_ID);

    await openOptionsMenu(page);
    await page.getByText('신고하기').click();

    await expect(page.getByText('게시물 신고')).toBeVisible({ timeout: 10_000 });

    // Select '스팸/광고'
    await page.getByText('스팸/광고').click();

    // Submit the report
    // Note: Alert.alert is a no-op on web (react-native-web stub), so no browser dialog fires.
    // The success path calls handleClose() which clears reportTarget, closing the modal.
    await page.getByText('신고하기').last().click();

    // Modal should be closed after successful submission
    await expect(page.getByText('게시물 신고')).not.toBeVisible({ timeout: 10_000 });
  });

  test('2.6 report modal can be cancelled', async ({ page }) => {
    await setupPage(page);
    await gotoPost(page, NON_OWNED_POST_ID);

    await openOptionsMenu(page);
    await page.getByText('신고하기').click();

    await expect(page.getByText('게시물 신고')).toBeVisible({ timeout: 10_000 });

    // Click the 취소 button
    await page.getByText('취소').click();

    // Modal dismisses — the report modal title is gone
    await expect(page.getByText('게시물 신고')).not.toBeVisible();
  });
});
