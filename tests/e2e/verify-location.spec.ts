import { test, expect } from './fixtures';
import { setupNotVerifiedUser } from './helpers/auth';
import { mockKakaoReverseGeocode, mockNeighborhoodsApi } from './helpers/api-mocks';
import { MOCK_NEIGHBORHOODS, MOCK_USER } from './helpers/mock-data';
import {
  mockGeolocation,
  mockGeolocationDenied,
  SEOUL_YEOKSAM,
  OUTSIDE_SERVICE,
} from './helpers/geolocation';

test.describe('verify-location screen', () => {
  test('shows loading state on initial entry', async ({ page, context }) => {
    await mockGeolocation(context, SEOUL_YEOKSAM.latitude, SEOUL_YEOKSAM.longitude, page);
    await setupNotVerifiedUser(page);
    // Delay the Kakao API so we can catch the loading state before it resolves
    await page.route('**/dapi.kakao.com/v2/local/geo/coord2regioncode.json*', (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            documents: [{
              region_type: 'H',
              region_1depth_name: MOCK_NEIGHBORHOODS[0].city,
              region_2depth_name: MOCK_NEIGHBORHOODS[0].district,
              region_3depth_name: MOCK_NEIGHBORHOODS[0].name,
            }],
          }),
        });
      }, 2000);
    });
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/');

    await expect(page.getByText('위치를 확인하고 있어요...')).toBeVisible({ timeout: 15_000 });
  });

  test('shows found neighborhood when GPS matches', async ({ page, context }) => {
    await mockGeolocation(context, SEOUL_YEOKSAM.latitude, SEOUL_YEOKSAM.longitude, page);
    await setupNotVerifiedUser(page);
    await mockKakaoReverseGeocode(page, MOCK_NEIGHBORHOODS[0]);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/');

    await expect(page.getByText('역삼동')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('이 동네가 맞으세요?')).toBeVisible();
    await expect(page.getByText('맞아요')).toBeVisible();
    await expect(page.getByText('다시 찾기')).toBeVisible();
  });

  test('shows not-found state when no neighborhood matches GPS coordinates', async ({ page, context }) => {
    await mockGeolocation(context, OUTSIDE_SERVICE.latitude, OUTSIDE_SERVICE.longitude, page);
    await setupNotVerifiedUser(page);
    await mockKakaoReverseGeocode(page, null);

    await page.goto('/');

    await expect(page.getByText('근처 동네를 찾을 수 없어요')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('다시 시도')).toBeVisible();
    await expect(page.getByText('직접 선택하기')).toBeVisible();
  });

  test('confirms neighborhood and redirects to home tabs', async ({ page, context }) => {
    await mockGeolocation(context, SEOUL_YEOKSAM.latitude, SEOUL_YEOKSAM.longitude, page);
    await setupNotVerifiedUser(page);
    await mockKakaoReverseGeocode(page, MOCK_NEIGHBORHOODS[0]);
    await mockNeighborhoodsApi(page, MOCK_NEIGHBORHOODS);

    await page.goto('/');

    await expect(page.getByText('이 동네가 맞으세요?')).toBeVisible({ timeout: 15_000 });

    // Verify the PATCH request is made when confirming the neighborhood
    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/users') && resp.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await page.getByText('맞아요').click();
    await patchPromise;

    // After confirming, the verify-location prompt should be gone
    await expect(page.getByText('이 동네가 맞으세요?')).toBeHidden({ timeout: 15_000 });
  });

  test('shows permission-denied error when geolocation is denied', async ({ page, context }) => {
    await mockGeolocationDenied(context, page);
    await setupNotVerifiedUser(page);

    await page.goto('/');

    await expect(page.getByText('위치 권한이 필요해요')).toBeVisible({ timeout: 15_000 });
  });

  test('shows generic error when geolocation position is unavailable', async ({ page, context }) => {
    // Grant the permission but make getCurrentPosition fail with POSITION_UNAVAILABLE
    await context.grantPermissions(['geolocation']);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (
            _success: PositionCallback,
            error?: PositionErrorCallback | null,
            _options?: PositionOptions,
          ) => {
            setTimeout(() => {
              if (error) {
                error({
                  code: 2, // POSITION_UNAVAILABLE
                  message: 'Position unavailable',
                  PERMISSION_DENIED: 1,
                  POSITION_UNAVAILABLE: 2,
                  TIMEOUT: 3,
                } as GeolocationPositionError);
              }
            }, 0);
          },
          watchPosition: (_success: PositionCallback, error?: PositionErrorCallback | null) => {
            setTimeout(() => {
              if (error) {
                error({
                  code: 2,
                  message: 'Position unavailable',
                  PERMISSION_DENIED: 1,
                  POSITION_UNAVAILABLE: 2,
                  TIMEOUT: 3,
                } as GeolocationPositionError);
              }
            }, 0);
            return 0;
          },
          clearWatch: () => {},
        } as Geolocation,
        writable: true,
        configurable: true,
      });
    });
    await setupNotVerifiedUser(page);

    await page.goto('/');

    await expect(page.getByText('위치를 가져올 수 없어요')).toBeVisible({ timeout: 15_000 });
  });
});
