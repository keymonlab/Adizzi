import { BrowserContext, Page } from '@playwright/test';

/**
 * Mock browser geolocation API to return specific coordinates.
 *
 * Uses both Playwright's context-level geolocation (for the Permissions API)
 * AND an addInitScript stub on the page (for reliable interception of
 * expo-location / navigator.geolocation calls before app code runs).
 *
 * Must be called BEFORE page.goto().
 */
export async function mockGeolocation(
  context: BrowserContext,
  latitude: number,
  longitude: number,
  page?: Page,
) {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude, longitude });

  // Also stub navigator.geolocation at the JS level so expo-location's
  // internal calls are intercepted even if it caches permissions differently.
  if (page) {
    await page.addInitScript(
      ({ lat, lon }: { lat: number; lon: number }) => {
        const position = {
          coords: {
            latitude: lat,
            longitude: lon,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          } as GeolocationCoordinates,
          timestamp: Date.now(),
          toJSON() { return this; },
        } as GeolocationPosition;

        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (
              success: PositionCallback,
              _error?: PositionErrorCallback | null,
              _options?: PositionOptions,
            ) => {
              setTimeout(() => success(position), 0);
            },
            watchPosition: (
              success: PositionCallback,
              _error?: PositionErrorCallback | null,
              _options?: PositionOptions,
            ) => {
              setTimeout(() => success(position), 0);
              return 0;
            },
            clearWatch: () => {},
          } as Geolocation,
          writable: true,
          configurable: true,
        });
      },
      { lat: latitude, lon: longitude },
    );
  }
}

/**
 * Mock geolocation permission as denied.
 * Also stubs navigator.geolocation.getCurrentPosition to call the error
 * callback with PERMISSION_DENIED so expo-location detects denial correctly.
 *
 * Must be called BEFORE page.goto().
 */
export async function mockGeolocationDenied(context: BrowserContext, page?: Page) {
  await context.clearPermissions();

  if (page) {
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
                  code: 1, // PERMISSION_DENIED
                  message: 'User denied geolocation',
                  PERMISSION_DENIED: 1,
                  POSITION_UNAVAILABLE: 2,
                  TIMEOUT: 3,
                } as GeolocationPositionError);
              }
            }, 0);
          },
          watchPosition: (
            _success: PositionCallback,
            error?: PositionErrorCallback | null,
            _options?: PositionOptions,
          ) => {
            setTimeout(() => {
              if (error) {
                error({
                  code: 1,
                  message: 'User denied geolocation',
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
  }
}

// Common Seoul locations for testing
export const SEOUL_GANGNAM = { latitude: 37.4979, longitude: 127.0276 }; // 강남역
export const SEOUL_YEOKSAM = { latitude: 37.4837, longitude: 127.0324 }; // 역삼동
export const SEOUL_SEOCHO = { latitude: 37.4919, longitude: 127.0078 }; // 서초동
export const OUTSIDE_SERVICE = { latitude: 35.1796, longitude: 129.0756 }; // 부산 (서비스 외 지역)
