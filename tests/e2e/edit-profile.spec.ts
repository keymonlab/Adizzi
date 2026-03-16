import { test, expect } from './fixtures/index';
import { setupAuthenticatedUser } from './helpers/auth';
import { MOCK_USER } from './helpers/mock-data';

test.describe('Edit profile settings', () => {
  test('displays current profile data in form', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/settings/edit-profile');

    // Header title
    await expect(page.getByText('프로필 수정')).toBeVisible({ timeout: 15_000 });

    // Display name field shows current value from MOCK_USER
    const nameInput = page.getByPlaceholder('표시할 이름을 입력하세요');
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await expect(nameInput).toHaveValue(MOCK_USER.display_name);

    // Handle field shows current handle (placeholder is 'handle' per HandleInput.tsx)
    const handleInput = page.getByPlaceholder('handle');
    await expect(handleInput).toBeVisible({ timeout: 15_000 });
    await expect(handleInput).toHaveValue(MOCK_USER.handle);
  });

  test('saves profile changes', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/settings/edit-profile');

    const nameInput = page.getByPlaceholder('표시할 이름을 입력하세요');
    await nameInput.waitFor({ state: 'visible', timeout: 15_000 });

    // Clear and type a new display name
    await nameInput.clear();
    await nameInput.fill('새로운이름');

    // Tap the save button and verify the PATCH request was made
    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/users') && resp.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await page.getByText('저장').click();
    await patchPromise;
  });

  test('save button does not submit when name is empty', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/settings/edit-profile');

    const nameInput = page.getByPlaceholder('표시할 이름을 입력하세요');
    await nameInput.waitFor({ state: 'visible', timeout: 15_000 });

    // Clear the display name
    await nameInput.clear();

    // Click save — should NOT trigger a PATCH because the button is disabled
    await page.getByText('저장').click();

    // Verify no PATCH was sent by waiting briefly and confirming no network activity
    let patchSent = false;
    page.on('request', (req) => {
      if (req.url().includes('/rest/v1/users') && req.method() === 'PATCH') {
        patchSent = true;
      }
    });

    // Small wait to confirm no request fires
    await page.waitForTimeout(1000);
    expect(patchSent).toBe(false);
  });
});
