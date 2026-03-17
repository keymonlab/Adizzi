import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockNeighborhoodsApi } from './helpers/api-mocks';
import { MOCK_NEIGHBORHOODS, MOCK_USER } from './helpers/mock-data';

test.describe('Neighborhood settings screen', () => {
  test('displays current neighborhood', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/settings/neighborhood');

    // Header title
    await expect(page.getByText('동네 설정')).toBeVisible({ timeout: 15_000 });

    // Current neighborhood section label (may appear in multiple places)
    await expect(page.getByText('현재 동네').first()).toBeVisible({ timeout: 10_000 });

    // MOCK_USER.neighborhood_id is 'neighborhood-001' → name '역삼동'
    const currentNeighborhood = MOCK_NEIGHBORHOODS.find(
      (n) => n.id === MOCK_USER.neighborhood_id,
    )!;
    await expect(page.getByText(currentNeighborhood.name).first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows all sections', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/settings/neighborhood');

    await expect(page.getByText('동네 설정')).toBeVisible({ timeout: 15_000 });

    // GPS section label
    await expect(page.getByText('GPS로 동네 인증')).toBeVisible({ timeout: 10_000 });

    // GPS re-verify button
    await expect(page.getByText('동네 다시 인증하기')).toBeVisible({ timeout: 10_000 });

    // Manual selection section label
    await expect(page.getByText('직접 선택')).toBeVisible({ timeout: 10_000 });

    // Warning text
    await expect(
      page.getByText('동네를 변경하면 이전 동네의 게시물은 보이지 않아요'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows neighborhood list for manual selection', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/settings/neighborhood');

    await expect(page.getByText('직접 선택')).toBeVisible({ timeout: 15_000 });

    // All neighborhoods from MOCK_NEIGHBORHOODS should appear in the list
    for (const neighborhood of MOCK_NEIGHBORHOODS) {
      await expect(page.getByText(neighborhood.name).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('navigates back', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/settings/neighborhood');

    await expect(page.getByText('동네 설정')).toBeVisible({ timeout: 15_000 });

    // Header back button renders '< 뒤로' — verify it exists and is clickable
    const backButton = page.getByText('< 뒤로');
    await expect(backButton).toBeVisible({ timeout: 10_000 });
    await backButton.click();
  });
});
