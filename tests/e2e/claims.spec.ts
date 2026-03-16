import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockPostsApi, mockClaimsApi } from './helpers/api-mocks';
import { MOCK_POSTS, MOCK_CLAIMS } from './helpers/mock-data';

test.describe('Claims management screen', () => {
  test('displays claims screen with post info', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, [MOCK_POSTS[0]]);
    await mockClaimsApi(page, MOCK_CLAIMS.filter((c) => c.post_id === 'post-001'));

    await page.goto('/claims/post-001');

    // Header title
    await expect(page.getByText('소유 요청 관리')).toBeVisible({ timeout: 15_000 });

    // Post title shown in the post summary card
    await expect(page.getByText(MOCK_POSTS[0].title).first()).toBeVisible({ timeout: 10_000 });

    // Claims count label — post-001 has 2 claims in MOCK_CLAIMS
    await expect(page.getByText(/요청\s*2건/)).toBeVisible({ timeout: 10_000 });

    // Claimant names from the two post-001 claims
    await expect(page.getByText('이웃주민').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('착한사람').first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows empty state when no claims', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, [MOCK_POSTS[0]]);
    await mockClaimsApi(page, []);

    await page.goto('/claims/post-001');

    await expect(page.getByText('소유 요청 관리')).toBeVisible({ timeout: 15_000 });

    // EmptyState from the claims list
    await expect(page.getByText('아직 소유 요청이 없어요')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('아직 아무도 이 게시물에 소유 요청을 보내지 않았어요.'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('displays claim status badges', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, [MOCK_POSTS[0]]);
    await mockClaimsApi(page, MOCK_CLAIMS.filter((c) => c.post_id === 'post-001'));

    await page.goto('/claims/post-001');

    // Wait for claims to load
    await expect(page.getByText('소유 요청 관리')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('이웃주민').first()).toBeVisible({ timeout: 10_000 });

    // claim-001 status is 'pending' → badge label '대기중'
    await expect(page.getByText('대기중')).toBeVisible({ timeout: 10_000 });

    // claim-002 status is 'verified' → badge label '인증됨'
    await expect(page.getByText('인증됨')).toBeVisible({ timeout: 10_000 });

    // claim-002 verified row indicator only shown for verified claims
    await expect(page.getByText('✓ 인증 답변 일치')).toBeVisible({ timeout: 10_000 });
  });

  test('shows approve and reject buttons for pending claims', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, [MOCK_POSTS[0]]);
    await mockClaimsApi(page, MOCK_CLAIMS.filter((c) => c.post_id === 'post-001'));

    await page.goto('/claims/post-001');

    await expect(page.getByText('소유 요청 관리')).toBeVisible({ timeout: 15_000 });
    // Wait for claim cards to appear
    await expect(page.getByText('이웃주민').first()).toBeVisible({ timeout: 10_000 });

    // claim-001 is pending → action buttons rendered
    await expect(page.getByText('승인').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('거절').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigates back', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, MOCK_POSTS);
    await mockClaimsApi(page, MOCK_CLAIMS.filter((c) => c.post_id === 'post-001'));

    await page.goto('/claims/post-001');

    await expect(page.getByText('소유 요청 관리')).toBeVisible({ timeout: 15_000 });

    // The header back button renders '←' — verify it exists and is clickable
    const backButton = page.getByText('←');
    await expect(backButton).toBeVisible({ timeout: 10_000 });
    await backButton.click();
  });
});
