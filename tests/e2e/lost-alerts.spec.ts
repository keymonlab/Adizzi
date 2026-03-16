import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockLostAlertsApi } from './helpers/api-mocks';
import { MOCK_LOST_ALERTS } from './helpers/mock-data';

test.describe('Lost Alerts Settings', () => {
  test('displays alerts screen header and description', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockLostAlertsApi(page, MOCK_LOST_ALERTS);

    await page.goto('/settings/lost-alerts');

    // Header title
    await expect(page.getByText('분실물 알림')).toBeVisible({ timeout: 15_000 });

    // Description line below the header
    await expect(
      page.getByText('새 분실물 게시물이 알림 조건과 일치하면 알려드려요.'),
    ).toBeVisible({ timeout: 10_000 });

    // Add button is always rendered in the header
    await expect(page.getByText('+ 추가')).toBeVisible({ timeout: 10_000 });
  });

  test('displays all alert keyword badges', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockLostAlertsApi(page, MOCK_LOST_ALERTS);

    await page.goto('/settings/lost-alerts');

    await expect(page.getByText('분실물 알림')).toBeVisible({ timeout: 15_000 });

    // Each alert card shows its keywords as badges
    for (const alert of MOCK_LOST_ALERTS) {
      for (const keyword of alert.keywords) {
        await expect(page.getByText(keyword).first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('shows empty state when no alerts', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockLostAlertsApi(page, []);

    await page.goto('/settings/lost-alerts');

    await expect(page.getByText('분실물 알림')).toBeVisible({ timeout: 15_000 });

    // EmptyState rendered by ListEmptyComponent in lost-alerts.tsx
    await expect(page.getByText('알림이 없어요')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('분실물 키워드를 등록하면')).toBeVisible({ timeout: 10_000 });
  });

  test('displays alert details including category and inactive label', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockLostAlertsApi(page, MOCK_LOST_ALERTS);

    await page.goto('/settings/lost-alerts');

    await expect(page.getByText('분실물 알림')).toBeVisible({ timeout: 15_000 });

    // alert-001: category wallet → '👛 지갑', keywords: '검정색', '장지갑', active
    await expect(page.getByText(/지갑/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('검정색')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('장지갑')).toBeVisible({ timeout: 10_000 });

    // alert-002: category electronics → '📱 전자기기', keywords: '아이폰', '갤럭시', inactive
    await expect(page.getByText(/전자기기/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('아이폰')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('갤럭시')).toBeVisible({ timeout: 10_000 });

    // alert-002 is inactive → '비활성화됨' label rendered
    await expect(page.getByText('비활성화됨')).toBeVisible({ timeout: 10_000 });

    // alert-003: category pet → '🐾 반려동물', keywords: '말티즈', '흰색', active
    await expect(page.getByText(/반려동물/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('말티즈')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('흰색')).toBeVisible({ timeout: 10_000 });
  });

  test('each alert card shows a delete button', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockLostAlertsApi(page, MOCK_LOST_ALERTS);

    await page.goto('/settings/lost-alerts');

    await expect(page.getByText('분실물 알림')).toBeVisible({ timeout: 15_000 });
    // Wait for cards to load
    await expect(page.getByText('검정색')).toBeVisible({ timeout: 10_000 });

    // Each AlertRow renders a '삭제' button
    const deleteButtons = page.getByText('삭제');
    await expect(deleteButtons.first()).toBeVisible({ timeout: 10_000 });
    // Three alerts → three delete buttons
    await expect(deleteButtons).toHaveCount(MOCK_LOST_ALERTS.length, { timeout: 10_000 });
  });
});
