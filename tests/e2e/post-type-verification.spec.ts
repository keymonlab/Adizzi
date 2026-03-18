import { test, expect } from './fixtures/index';

test.describe('Post type switching and verification form', () => {
  test('verification form only appears when post type is found', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    // Default post type is 'lost' — verification section must not be present
    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });
    await expect(authenticatedPage.getByText('소유 확인 질문 설정')).not.toBeAttached();

    // Switch to found
    await authenticatedPage.getByText('주웠어요').first().click();

    // Verification section must now appear
    await expect(
      authenticatedPage.getByText('소유 확인 질문 설정'),
    ).toBeVisible({ timeout: 5_000 });

    // Switch back to lost — verification section disappears again
    await authenticatedPage.getByText('잃어버렸어요').first().click();
    await expect(authenticatedPage.getByText('소유 확인 질문 설정')).not.toBeAttached();
  });

  test('header title updates immediately when switching post type', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    // Initial state: header shows '잃어버렸어요'
    await expect(authenticatedPage.locator('text=잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Switch to found — header title changes to '주웠어요'
    await authenticatedPage.getByText('주웠어요').first().click();
    await expect(authenticatedPage.locator('text=주웠어요').first()).toBeVisible({ timeout: 5_000 });

    // Switch back to lost — header title reverts to '잃어버렸어요'
    await authenticatedPage.getByText('잃어버렸어요').first().click();
    await expect(authenticatedPage.locator('text=잃어버렸어요').first()).toBeVisible({ timeout: 5_000 });
  });

  test('title and description placeholders change with post type', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    // Wait for initial render
    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Lost placeholders (default)
    await expect(
      authenticatedPage.getByPlaceholder('잃어버린 물건을 입력해주세요'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      authenticatedPage.getByPlaceholder('어디서 잃어버렸는지 자세히 설명해주세요'),
    ).toBeVisible({ timeout: 15_000 });

    // Switch to found
    await authenticatedPage.getByText('주웠어요').first().click();

    // Found placeholders
    await expect(
      authenticatedPage.getByPlaceholder('주운 물건을 입력해주세요'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      authenticatedPage.getByPlaceholder('어디서 주웠는지 자세히 설명해주세요'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('create form validation — missing title shows error', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Click submit without filling title
    await authenticatedPage.getByText('등록하기').first().click();

    // Title validation error from validatePostForm must appear
    await expect(
      authenticatedPage.getByText('제목을 입력해주세요'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('create form validation — missing category shows error', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Fill title so only category is missing
    const titleInput = authenticatedPage.getByPlaceholder('잃어버린 물건을 입력해주세요');
    await titleInput.fill('테스트 제목');

    // Click submit without selecting a category
    await authenticatedPage.getByText('등록하기').first().click();

    // Category validation error from validatePostForm must appear
    await expect(
      authenticatedPage.getByText('카테고리를 선택해주세요'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
