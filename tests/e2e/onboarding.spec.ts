import { test, expect } from './fixtures';
import { setupNotOnboardedUser } from './helpers/auth';
import { MOCK_USER_NOT_ONBOARDED } from './helpers/mock-data';

const SUPABASE_URL = 'https://iqmnoebrlbanarxopziw.supabase.co';

/**
 * checkHandleAvailability uses supabase HEAD + count=exact.
 * Supabase returns count via Content-Range header: "0-0/N" where N is the total.
 * Return N=0 → available, N=1 → taken.
 *
 * IMPORTANT: Content-Range is not a CORS-safelisted header. The mock response
 * must include Access-Control-Expose-Headers so the browser exposes it to JS.
 */
function fulfillHandleCheck(route: any, taken: boolean) {
  const count = taken ? 1 : 0;
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      'content-range': taken ? `0-0/${count}` : `*/${count}`,
      'access-control-expose-headers': 'content-range',
    },
    body: '',
  });
}

test.describe('Onboarding flow', () => {
  test('displays profile setup form', async ({ page }) => {
    await setupNotOnboardedUser(page);
    await page.goto('/');

    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('동네 이웃들에게 보여질 이름과 핸들을 설정하세요')).toBeVisible();

    // Display name input — label "표시 이름", placeholder "홍길동"
    await expect(page.getByPlaceholder('홍길동')).toBeVisible();

    // Handle input — placeholder "handle" inside the HandleInput component
    await expect(page.getByPlaceholder('handle')).toBeVisible();

    // Submit button
    await expect(page.getByText('시작하기')).toBeVisible();
  });

  test('disables submit when display name is empty', async ({ page }) => {
    await setupNotOnboardedUser(page);
    await page.goto('/');

    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });

    // Ensure display name is empty — not-onboarded user has empty display_name
    const displayNameInput = page.getByPlaceholder('홍길동');
    await displayNameInput.fill('');

    // Submit button must be disabled when display name is empty.
    // React Native Web renders TouchableOpacity with aria-disabled="true" when disabled.
    await expect(
      page.getByText('시작하기').locator('xpath=ancestor-or-self::*[@aria-disabled]').first(),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  test('disables submit when handle is too short', async ({ page }) => {
    await setupNotOnboardedUser(page);
    await page.goto('/');

    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });

    // Fill display name so it is not the blocking factor
    await page.getByPlaceholder('홍길동').fill('홍길동');

    // Type a handle shorter than the 3-character minimum.
    // HandleInput strips invalid chars; typing 2 valid chars triggers min-length error.
    const handleInput = page.getByPlaceholder('handle');
    await handleInput.fill('');
    await handleInput.type('ab');

    // Min-length validation message must appear
    await expect(page.getByText('최소 3자 이상이어야 해요')).toBeVisible({ timeout: 5_000 });

    // Submit remains disabled because handleAvailable is false.
    await expect(
      page.getByText('시작하기').locator('xpath=ancestor-or-self::*[@aria-disabled]').first(),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  test('checks handle availability and shows available message', async ({ page }) => {
    await setupNotOnboardedUser(page);

    // checkHandleAvailability sends HEAD with Prefer: count=exact.
    // Profile fetches are GET requests.
    await page.route(`${SUPABASE_URL}/rest/v1/users*`, (route, request) => {
      const method = request.method();
      if (method === 'HEAD') {
        // Availability check — handle is free (count = 0)
        fulfillHandleCheck(route, false);
      } else {
        // GET profile fetch
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_USER_NOT_ONBOARDED]),
        });
      }
    });

    await page.goto('/');
    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });

    const handleInput = page.getByPlaceholder('handle');
    await handleInput.fill('');
    await handleInput.type('newhandle');

    await expect(page.getByText('사용 가능한 핸들이에요')).toBeVisible({ timeout: 5_000 });
  });

  test('shows taken message when handle is already in use', async ({ page }) => {
    await setupNotOnboardedUser(page);

    await page.route(`${SUPABASE_URL}/rest/v1/users*`, (route, request) => {
      const method = request.method();
      if (method === 'HEAD') {
        // Availability check — handle is taken (count = 1)
        fulfillHandleCheck(route, true);
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_USER_NOT_ONBOARDED]),
        });
      }
    });

    await page.goto('/');
    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });

    const handleInput = page.getByPlaceholder('handle');
    await handleInput.fill('');
    await handleInput.type('takenhandle');

    await expect(page.getByText('이미 사용 중인 핸들이에요')).toBeVisible({ timeout: 5_000 });
  });

  test('submits profile and navigates away from onboarding', async ({ page }) => {
    await setupNotOnboardedUser(page);

    await page.route(`${SUPABASE_URL}/rest/v1/users*`, (route, request) => {
      const method = request.method();
      const accept = request.headers()['accept'] || '';
      const isSingle = accept.includes('application/vnd.pgrst.object+json');

      if (method === 'HEAD') {
        // Availability check — handle is free
        fulfillHandleCheck(route, false);
      } else if (method === 'GET') {
        // Profile fetch
        route.fulfill({
          status: 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          body: JSON.stringify(
            isSingle ? MOCK_USER_NOT_ONBOARDED : [MOCK_USER_NOT_ONBOARDED],
          ),
        });
      } else if (method === 'PATCH') {
        // updateProfile success — return updated user so refreshProfile works
        const updated = {
          ...MOCK_USER_NOT_ONBOARDED,
          display_name: '홍길동',
          handle: 'gildong',
        };
        route.fulfill({
          status: 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          body: JSON.stringify(updated),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    await expect(page.getByText('프로필 설정')).toBeVisible({ timeout: 15_000 });

    // Fill display name
    await page.getByPlaceholder('홍길동').fill('홍길동');

    // Fill handle and wait for availability confirmation
    const handleInput = page.getByPlaceholder('handle');
    await handleInput.fill('');
    await handleInput.type('gildong');
    await expect(page.getByText('사용 가능한 핸들이에요')).toBeVisible({ timeout: 5_000 });

    // Submit
    await page.getByText('시작하기').click();

    // Should navigate away from onboarding (to verify-location or main feed)
    await page.waitForURL(
      (url) => !url.pathname.includes('onboarding'),
      { timeout: 15_000 },
    );
  });
});
