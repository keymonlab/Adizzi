import { test, expect } from './fixtures';
import { setupNotOnboardedUser, setupNotVerifiedUser } from './helpers/auth';
import { mockSupabaseAuth, mockUsersApi, mockPostsApi, mockNeighborhoodsApi, mockRpc } from './helpers/api-mocks';
import { MOCK_USER, MOCK_SESSION, MOCK_POSTS, MOCK_NEIGHBORHOODS } from './helpers/mock-data';

test.describe('Auth flow', () => {
  test('shows login page with adizzi branding', async ({ unauthenticatedPage: page }) => {
    await page.goto('/');
    await expect(page.getByText('우리 동네 분실물 찾기')).toBeVisible({ timeout: 15_000 });
  });

  test('shows social login buttons', async ({ unauthenticatedPage: page }) => {
    await page.goto('/');
    await expect(page.getByText('우리 동네 분실물 찾기')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('카카오로 시작하기')).toBeVisible();
    await expect(page.getByText('구글로 시작하기')).toBeVisible();
  });

  test('shows dev login button', async ({ unauthenticatedPage: page }) => {
    await page.goto('/');
    await expect(page.getByText('Dev Login', { exact: false })).toBeVisible({ timeout: 15_000 });
  });

  test('shows terms footer text', async ({ unauthenticatedPage: page }) => {
    await page.goto('/');
    await expect(page.getByText('로그인하면 이용약관에 동의하게 됩니다')).toBeVisible({ timeout: 15_000 });
  });

  test('authenticated user reaches home tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    // Fully authenticated + onboarded + verified user should reach the tabs layout
    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });
  });

  test('not-onboarded user redirects to onboarding', async ({ page }) => {
    await setupNotOnboardedUser(page);
    await page.goto('/');
    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });
  });

  test('not-verified user redirects to verify-location', async ({ page }) => {
    await setupNotVerifiedUser(page);
    await mockRpc(page, 'find_neighborhood_by_point', null);
    await page.goto('/');
    // The screen starts in loading state then transitions based on geolocation result.
    // Accept any of the three possible non-loading states as well as the initial loading text.
    await expect(
      page
        .getByText('위치를 확인하고 있어요...')
        .or(page.getByText('위치 권한이 필요해요'))
        .or(page.getByText('위치를 가져올 수 없어요'))
        .or(page.getByText('근처 동네를 찾을 수 없어요')),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('dev login authenticates and redirects away from login', async ({ page }) => {
    await mockSupabaseAuth(page, MOCK_SESSION);
    await mockUsersApi(page, MOCK_USER);
    await mockPostsApi(page, MOCK_POSTS);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/');

    const devButton = page.getByText('Dev Login', { exact: false });
    await devButton.waitFor({ state: 'visible', timeout: 15_000 });
    await devButton.click();

    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
  });
});
