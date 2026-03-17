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

    // Clear using triple-click + delete to avoid Playwright fill() race with useEffect
    await nameInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    // Wait for React to process the empty value
    await page.waitForTimeout(200);
    // Type spaces to prevent useEffect from restoring (prev !== '')
    await nameInput.type('   ');

    // Wait for the save button to become visually disabled (opacity < 0.9)
    const saveButton = page.getByText('저장');
    await expect(saveButton).toBeVisible();

    await page.waitForFunction(() => {
      const el = document.evaluate(
        "//div[contains(text(), '저장')] | //span[contains(text(), '저장')]",
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
      ).singleNodeValue as HTMLElement | null;
      if (!el) return false;
      let node: HTMLElement | null = el;
      while (node) {
        const op = parseFloat(window.getComputedStyle(node).opacity);
        if (op < 0.9) return true;
        node = node.parentElement;
      }
      return false;
    }, { timeout: 5000 });
  });
});
