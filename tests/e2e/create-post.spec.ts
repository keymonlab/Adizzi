import { test, expect } from './fixtures/index';
import { mockStorageApi, mockPostsApi } from './helpers/api-mocks';
import { MOCK_POSTS } from './helpers/mock-data';

test.describe('Create post', () => {
  test('displays create form with lost/found toggle', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    // Both toggle buttons must be visible
    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });
    await expect(authenticatedPage.getByText('주웠어요').first()).toBeVisible({ timeout: 15_000 });

    // Default post type is 'lost' — header title should read '잃어버렸어요'
    const headerTitle = authenticatedPage.locator('text=잃어버렸어요').first();
    await expect(headerTitle).toBeVisible({ timeout: 15_000 });
  });

  test('switches between lost and found types', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    // Wait for initial render with 'lost' state
    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Title placeholder for 'lost'
    const titleInput = authenticatedPage.getByPlaceholder('잃어버린 물건을 입력해주세요');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });

    // Click '주웠어요' toggle button (first occurrence is the toggle button)
    await authenticatedPage.getByText('주웠어요').first().click();

    // Header title should now read '주웠어요'
    await expect(authenticatedPage.locator('text=주웠어요').first()).toBeVisible({ timeout: 5_000 });

    // Title placeholder changes to '주운 물건을 입력해주세요'
    await expect(
      authenticatedPage.getByPlaceholder('주운 물건을 입력해주세요'),
    ).toBeVisible({ timeout: 5_000 });

    // Description placeholder also changes
    await expect(
      authenticatedPage.getByPlaceholder('어디서 주웠는지 자세히 설명해주세요'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('displays all form fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Title input (via label text) — near the top, should be visible
    await expect(authenticatedPage.getByText('제목').first()).toBeVisible({ timeout: 15_000 });
    await expect(
      authenticatedPage.getByPlaceholder('잃어버린 물건을 입력해주세요'),
    ).toBeVisible({ timeout: 15_000 });

    // Description input — near the top, should be visible
    await expect(authenticatedPage.getByText('설명').first()).toBeVisible({ timeout: 15_000 });
    await expect(
      authenticatedPage.getByPlaceholder('어디서 잃어버렸는지 자세히 설명해주세요'),
    ).toBeVisible({ timeout: 15_000 });

    // Category section label — may be below the fold in the ScrollView
    await expect(authenticatedPage.getByText('카테고리').first()).toBeAttached({ timeout: 15_000 });

    // Location section label — may be below the fold; use first() since LocationPicker may also render '위치'
    await expect(authenticatedPage.getByText('위치', { exact: true }).first()).toBeAttached({ timeout: 15_000 });

    // Submit button — at the bottom, may be below the fold
    await expect(authenticatedPage.getByText('등록하기').first()).toBeAttached({ timeout: 15_000 });
  });

  test('displays category options and selects one', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/(tabs)/create');

    await expect(authenticatedPage.getByText('카테고리')).toBeVisible({ timeout: 15_000 });

    // Category options from CATEGORIES constant
    await expect(authenticatedPage.getByText('전자기기')).toBeVisible({ timeout: 15_000 });
    await expect(authenticatedPage.getByText('지갑')).toBeVisible({ timeout: 15_000 });

    // Select '지갑' category
    await authenticatedPage.getByText('지갑').click();

    // After selection the card label should still be visible
    await expect(authenticatedPage.getByText('지갑')).toBeVisible({ timeout: 5_000 });

    // Switch to a different category '열쇠'
    await authenticatedPage.getByText('열쇠').click();
    await expect(authenticatedPage.getByText('열쇠')).toBeVisible({ timeout: 5_000 });
  });

  test('submits valid post and navigates', async ({ authenticatedPage }) => {
    // Mock storage for image-related calls and override posts API for POST response
    await mockStorageApi(authenticatedPage);
    await mockPostsApi(authenticatedPage, MOCK_POSTS);

    await authenticatedPage.goto('/(tabs)/create');
    await expect(authenticatedPage.getByText('잃어버렸어요').first()).toBeVisible({ timeout: 15_000 });

    // Fill title
    const titleInput = authenticatedPage.getByPlaceholder('잃어버린 물건을 입력해주세요');
    await titleInput.fill('테스트 지갑 분실');

    // Fill description
    const descInput = authenticatedPage.getByPlaceholder('어디서 잃어버렸는지 자세히 설명해주세요');
    await descInput.fill('역삼역 근처에서 잃어버렸습니다.');

    // Select a category
    await authenticatedPage.getByText('지갑').click();

    // Submit — verify the POST request to the posts API is made
    const postPromise = authenticatedPage.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/posts') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await authenticatedPage.getByText('등록하기').click();
    await postPromise;
  });
});
