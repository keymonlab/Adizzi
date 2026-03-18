import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockPostsApi, mockClaimsApi, mockCommentsApi, mockNotificationsApi, mockNeighborhoodsApi } from './helpers/api-mocks';
import {
  MOCK_POSTS,
  MOCK_CLAIMS,
  MOCK_COMMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_NEIGHBORHOODS,
  MOCK_USER,
  MOCK_OTHER_USER_1,
  type PostWithAuthor,
  type ClaimWithClaimant,
} from './helpers/mock-data';
import type { PostStatus, ClaimStatus } from '../../src/types/app.types';

// ---------------------------------------------------------------------------
// Shared setup helper
// ---------------------------------------------------------------------------

async function setupPostDetail(
  page: Parameters<typeof mockPostsApi>[0],
  posts: PostWithAuthor[],
  claims: ClaimWithClaimant[],
) {
  await mockPostsApi(page, posts);
  await mockClaimsApi(page, claims);
  await mockCommentsApi(page, MOCK_COMMENTS);
  await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
  await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);
}

// ---------------------------------------------------------------------------
// 3. Claim Button Interactions
// ---------------------------------------------------------------------------

test.describe('Claim button interactions', () => {
  // 3.1 found post shows 제 물건이에요! claim button for non-owner
  test('3.1 found post shows 제 물건이에요! claim button for non-owner', async ({ page }) => {
    // post-005 is a found post authored by MOCK_OTHER_USER_2; logged-in user is MOCK_USER
    const foundPost = MOCK_POSTS.find((p) => p.id === 'post-005')!;

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [foundPost], []);

    await page.goto('/post/post-005');

    await expect(page.getByText(foundPost.title).first()).toBeVisible({ timeout: 15_000 });

    // Non-owner viewing a found post should see 제 물건이에요!
    await expect(page.getByText('제 물건이에요!')).toBeVisible({ timeout: 10_000 });
  });

  // 3.2 lost post shows 찾았어요! claim button for non-owner
  test('3.2 lost post shows 찾았어요! claim button for non-owner', async ({ page }) => {
    // post-002 is a lost post authored by MOCK_OTHER_USER_1; logged-in user is MOCK_USER
    const lostPost = MOCK_POSTS.find((p) => p.id === 'post-002')!;

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [lostPost], []);

    await page.goto('/post/post-002');

    await expect(page.getByText(lostPost.title).first()).toBeVisible({ timeout: 15_000 });

    // Non-owner viewing a lost post should see 찾았어요!
    await expect(page.getByText('찾았어요!')).toBeVisible({ timeout: 10_000 });
  });

  // 3.3 claim button is hidden for post owner
  test('3.3 claim button is hidden for post owner', async ({ page }) => {
    // post-001 is authored by MOCK_USER (the logged-in user)
    const ownPost = MOCK_POSTS.find((p) => p.id === 'post-001')!;

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [ownPost], []);

    await page.goto('/post/post-001');

    await expect(page.getByText(ownPost.title).first()).toBeVisible({ timeout: 15_000 });

    // Owner must not see either claim button
    await expect(page.getByText('제 물건이에요!')).not.toBeVisible();
    await expect(page.getByText('찾았어요!')).not.toBeVisible();
  });

  // 3.4 claim button is hidden when post status is not active
  test('3.4 claim button is hidden when post status is not active', async ({ page }) => {
    // post-003 has status 'resolved' and is authored by MOCK_OTHER_USER_2
    const resolvedPost = MOCK_POSTS.find((p) => p.id === 'post-003')!;

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [resolvedPost], []);

    await page.goto('/post/post-003');

    await expect(page.getByText(resolvedPost.title).first()).toBeVisible({ timeout: 15_000 });

    // Resolved post: no claim button regardless of viewer
    await expect(page.getByText('제 물건이에요!')).not.toBeVisible();
    await expect(page.getByText('찾았어요!')).not.toBeVisible();
  });

  // 3.5 pending claim shows waiting status banner
  test('3.5 pending claim shows waiting status banner', async ({ page }) => {
    // post-004 is a lost post authored by MOCK_OTHER_USER_1; MOCK_USER has a pending claim
    const lostPost = MOCK_POSTS.find((p) => p.id === 'post-004')!;

    const pendingClaim: ClaimWithClaimant = {
      id: 'claim-pending-test',
      post_id: 'post-004',
      claimant_id: MOCK_USER.id,
      answer_hash: null,
      status: 'pending' as ClaimStatus,
      failed_attempts: 0,
      created_at: '2026-03-16T09:00:00Z',
      updated_at: '2026-03-16T09:00:00Z',
      claimant: { display_name: MOCK_USER.display_name, handle: MOCK_USER.handle, avatar_url: null },
    };

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [lostPost], [pendingClaim]);

    await page.goto('/post/post-004');

    await expect(page.getByText(lostPost.title).first()).toBeVisible({ timeout: 15_000 });

    // Pending claim on a lost post: waiting banner text
    await expect(
      page.getByText('발견 신고 중... 글쓴이 확인을 기다리고 있어요'),
    ).toBeVisible({ timeout: 10_000 });
  });

  // 3.6 found post with verification question opens answer modal
  test('3.6 found post with verification question opens answer modal', async ({ page }) => {
    // post-005 is a found post with verification_question authored by MOCK_OTHER_USER_2
    const foundPostWithQuestion = MOCK_POSTS.find((p) => p.id === 'post-005')!;

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [foundPostWithQuestion], []);

    await page.goto('/post/post-005');

    await expect(page.getByText(foundPostWithQuestion.title).first()).toBeVisible({ timeout: 15_000 });

    // Click the claim button
    await page.getByText('제 물건이에요!').click();

    // Verification modal title for found post: '소유 확인'
    await expect(page.getByText('소유 확인')).toBeVisible({ timeout: 10_000 });

    // The question text from post-005
    await expect(page.getByText(foundPostWithQuestion.verification_question!)).toBeVisible({
      timeout: 10_000,
    });

    // Answer input and submit/cancel buttons
    await expect(page.getByPlaceholder('답변을 입력하세요')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('제출')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('취소')).toBeVisible({ timeout: 10_000 });
  });

  // 3.7 max attempts reached shows lockout banner
  test('3.7 max attempts reached shows lockout banner', async ({ page }) => {
    // post-005 is a found post with verification_question authored by MOCK_OTHER_USER_2
    const foundPostWithQuestion = MOCK_POSTS.find((p) => p.id === 'post-005')!;

    // MOCK_USER has a rejected claim with 3 failed attempts (max reached)
    const lockedClaim: ClaimWithClaimant = {
      id: 'claim-locked-test',
      post_id: 'post-005',
      claimant_id: MOCK_USER.id,
      answer_hash: 'hashed-wrong',
      status: 'rejected' as ClaimStatus,
      failed_attempts: 3,
      created_at: '2026-03-16T09:00:00Z',
      updated_at: '2026-03-16T09:15:00Z',
      claimant: { display_name: MOCK_USER.display_name, handle: MOCK_USER.handle, avatar_url: null },
    };

    await setupAuthenticatedUser(page);
    await setupPostDetail(page, [foundPostWithQuestion], [lockedClaim]);

    await page.goto('/post/post-005');

    await expect(page.getByText(foundPostWithQuestion.title).first()).toBeVisible({ timeout: 15_000 });

    // Lockout banner: '인증 횟수를 초과했어요 (3/3)'
    await expect(page.getByText('인증 횟수를 초과했어요 (3/3)')).toBeVisible({ timeout: 10_000 });

    // Claim button must not be present
    await expect(page.getByText('제 물건이에요!')).not.toBeVisible();
  });
});
