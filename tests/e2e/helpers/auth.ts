import { Page } from '@playwright/test';
import { mockSupabaseAuth, mockUsersApi } from './api-mocks';
import { MOCK_SESSION, MOCK_USER, MOCK_USER_NOT_ONBOARDED, MOCK_USER_NOT_VERIFIED } from './mock-data';

const STORAGE_KEY = 'sb-iqmnoebrlbanarxopziw-auth-token';

/**
 * Inject Supabase session into localStorage so the client recognizes the user as authenticated.
 * MUST be called BEFORE page.goto().
 */
async function injectSession(page: Page, session: any) {
  await page.addInitScript((args: { key: string; session: any }) => {
    localStorage.setItem(args.key, JSON.stringify(args.session));
  }, { key: STORAGE_KEY, session });
}

/**
 * Set up mocks for a fully authenticated, onboarded, verified user.
 * Call this BEFORE page.goto() so routes are intercepted from the start.
 */
export async function setupAuthenticatedUser(page: Page, userOverrides?: Partial<typeof MOCK_USER>) {
  const user = { ...MOCK_USER, ...userOverrides };
  const session = {
    ...MOCK_SESSION,
    user: { ...MOCK_SESSION.user, id: user.id },
  };

  // Inject session into localStorage (critical for web auth)
  await injectSession(page, session);

  // Also mock HTTP endpoints for token refresh and API calls
  await mockSupabaseAuth(page, session);
  await mockUsersApi(page, user);
}

/**
 * Set up mocks for an authenticated but NOT onboarded user.
 */
export async function setupNotOnboardedUser(page: Page) {
  const user = MOCK_USER_NOT_ONBOARDED;
  const session = {
    ...MOCK_SESSION,
    user: { ...MOCK_SESSION.user, id: user.id },
  };

  await injectSession(page, session);
  await mockSupabaseAuth(page, session);
  await mockUsersApi(page, user);
}

/**
 * Set up mocks for an onboarded but NOT location-verified user.
 */
export async function setupNotVerifiedUser(page: Page) {
  const user = MOCK_USER_NOT_VERIFIED;
  const session = {
    ...MOCK_SESSION,
    user: { ...MOCK_SESSION.user, id: user.id },
  };

  await injectSession(page, session);
  await mockSupabaseAuth(page, session);
  await mockUsersApi(page, user);
}

/**
 * Clear auth state - for unauthenticated test scenarios.
 * MUST be called BEFORE page.goto().
 */
export async function clearAuthState(page: Page) {
  await page.addInitScript((key: string) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
}
