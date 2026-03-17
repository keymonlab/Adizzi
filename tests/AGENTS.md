<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# Adizzi Tests - Agent Guide

This directory contains Playwright end-to-end (E2E) tests for the Adizzi lost-and-found community app. This guide helps AI agents run, debug, and extend the test suite.

## Quick Start

Run all E2E tests:
```bash
npx playwright test
```

Run a specific test file:
```bash
npx playwright test tests/e2e/auth.spec.ts
```

Run tests matching a pattern:
```bash
npx playwright test -g "displays header"
```

View HTML report after a test run:
```bash
npx playwright show-report
```

## Architecture

Tests use **Playwright** with custom fixtures and helpers to mock Supabase APIs and geolocation. The test environment simulates a web browser at 390x844px (mobile viewport).

### Configuration

**File:** `playwright.config.ts` (at repo root)

- **Test dir:** `tests/e2e/`
- **Base URL:** `http://localhost:8081`
- **Viewport:** 390x844 (mobile)
- **Timeout:** 30s per test, 10s action timeout, 15s navigation timeout
- **Auto-start:** Expo web server on port 8081 (`npx expo start --web`)
- **Retries:** 1 retry on failure
- **Workers:** 4 parallel workers (2 in CI)
- **Reporter:** HTML report + console list
- **Screenshots:** On failure only
- **Browser:** Chromium

Before running tests, ensure the Expo dev server is NOT already running. Playwright will start it automatically.

## Test Organization

```
tests/e2e/
  ├── fixtures/
  │   └── index.ts                 # Custom test fixtures (authenticatedPage, unauthenticatedPage)
  ├── helpers/
  │   ├── auth.ts                  # Auth setup helpers (setupAuthenticatedUser, etc.)
  │   ├── api-mocks.ts             # Route mocking for Supabase APIs
  │   ├── geolocation.ts           # Geolocation mocking (mock coords, Seoul locations)
  │   └── mock-data.ts             # Mock database rows (users, posts, comments, claims, etc.)
  ├── auth.spec.ts                 # Login, onboarding, location verification flows
  ├── home-feed.spec.ts            # Feed display, post cards, filtering
  ├── post-detail.spec.ts          # Post detail page, comments
  ├── claims.spec.ts               # Claiming items with verification questions
  ├── create-post.spec.ts          # Creating lost/found posts
  ├── profile.spec.ts              # User profile page
  ├── edit-profile.spec.ts         # Profile editing (name, avatar, handle)
  ├── notifications.spec.ts        # Notification tab, mark as read
  ├── lost-alerts.spec.ts          # Lost alert creation, management
  ├── verify-location.spec.ts      # Location verification flow
  ├── neighborhood-settings.spec.ts # Neighborhood selection and settings
  └── navigation.spec.ts           # Tab navigation and routing
```

## Core Concepts

### Test Fixtures

Located in `tests/e2e/fixtures/index.ts`, custom fixtures set up common test scenarios:

**authenticatedPage**
- Full auth: user is logged in, onboarded, location verified
- All API mocks pre-configured (posts, notifications, neighborhoods, comments)
- Suitable for testing authenticated features (feed, profile, claims)

**unauthenticatedPage**
- No auth state: user sees login screen
- Auth endpoints return 401/unauthenticated responses
- Suitable for testing login and onboarding flows

Usage in tests:
```typescript
test('example', async ({ authenticatedPage: page }) => {
  await page.goto('/');
  // page is a Playwright Page with auth mocked
});
```

### Auth Helpers

Located in `tests/e2e/helpers/auth.ts`:

**setupAuthenticatedUser(page, userOverrides?)**
- Injects Supabase session into localStorage (critical for web auth)
- Mocks HTTP endpoints for token refresh and user profile
- Call BEFORE `page.goto()`

**setupNotOnboardedUser(page)**
- Auth is valid, but user hasn't completed onboarding (no display_name, handle, neighborhood)
- Redirects to onboarding screen

**setupNotVerifiedUser(page)**
- Auth + onboarding complete, but location not verified (`location_verified: false`)
- Redirects to location verification flow

**clearAuthState(page)**
- Removes session from localStorage
- Renders user unauthenticated
- Call BEFORE `page.goto()`

### API Mocking Helpers

Located in `tests/e2e/helpers/api-mocks.ts`. All mocks intercept Supabase REST API calls:

**mockSupabaseAuth(page, session)**
- Mocks `/auth/v1/session`, `/auth/v1/token`, `/auth/v1/user`, `/auth/v1/logout`

**mockUnauthenticated(page)**
- Returns 401 for all auth endpoints
- Session is null

**mockPostsApi(page, posts, options?)**
- GET: returns posts (or filtered by `?id=eq.<id>`)
- POST: returns created post (merged with mock data)
- PATCH: returns updated post
- DELETE: returns empty success

**mockUsersApi(page, profile)**
- GET: returns user profile
- PATCH: returns updated profile

**mockCommentsApi(page, comments)**
- GET: returns comments (or filtered by `?post_id=eq.<id>`)
- POST: returns created comment
- PATCH: returns updated comment
- DELETE: returns empty success

**mockNotificationsApi(page, notifications)**
- GET: returns notifications (or filtered by `?user_id=eq.<id>`)
- PATCH: marks notifications as read

**mockClaimsApi(page, claims)**
- GET: returns claims (or filtered by `?post_id=eq.<id>`)
- POST: returns created claim
- PATCH: returns updated claim
- DELETE: returns empty success

**mockNeighborhoodsApi(page, neighborhoods)**
- GET: returns neighborhoods (or filtered by `?id=eq.<id>`)

**mockLostAlertsApi(page, alerts)**
- GET: returns lost alerts (or filtered by `?id=eq.<id>`)
- POST: returns created alert
- PATCH: returns updated alert
- DELETE: returns empty success

**mockStorageApi(page)**
- POST/PUT: simulates successful image upload, returns mock Key
- GET: returns 1x1 transparent PNG
- DELETE: returns success message

**mockRpc(page, functionName, response)**
- Mocks PostGIS and edge function RPC calls
- Example: `mockRpc(page, 'find_neighborhood_by_point', null)` for location verification

**mockAllApis(page, overrides?)**
- Convenience function: mocks all APIs at once with optional data overrides
- Accepts: `posts`, `user`, `notifications`, `comments`, `claims`, `neighborhoods`, `lostAlerts`, `session`

### Mock Data

Located in `tests/e2e/helpers/mock-data.ts`. Provides realistic Korean neighborhood lost-and-found data:

**Users:**
- `MOCK_USER` — fully verified (handle: 'testuser', neighborhood: '역삼동')
- `MOCK_USER_NOT_ONBOARDED` — no name/handle/neighborhood
- `MOCK_USER_NOT_VERIFIED` — onboarded but location not verified
- `MOCK_OTHER_USER_1` — neighbor account (handle: 'neighbor1')
- `MOCK_OTHER_USER_2` — another neighbor (handle: 'goodperson')

**Posts:**
- 5 sample posts (found shoes, lost wallet, found keys, lost pet, found electronics)
- Include author joins, comment counts, verification questions
- Mix of `active` and `resolved` statuses

**Comments:**
- 3 sample comments on posts with author joins and mentions

**Claims:**
- 3 sample claims (pending, verified, rejected) with claimant joins

**Notifications:**
- 6 sample notifications (mention, comment, new_post, claim, resolved, lost_alert_match)
- Include actor and post relations

**Lost Alerts:**
- 3 sample alerts (wallet, electronics, pet) with mix of active/inactive

**Neighborhoods:**
- 3 Seoul neighborhoods (역삼동, 서초동, 삼동)

**Helper functions:**
- `getPostsByType(type)` — filter posts by 'lost' or 'found'
- `getPostsByStatus(status)` — filter posts by 'active' or 'resolved'
- `getMyPosts()` — get posts authored by MOCK_USER
- `getUnreadNotificationCount()` — count unread notifications
- `getActiveLostAlerts()` — get active lost alerts

### Geolocation Mocking

Located in `tests/e2e/helpers/geolocation.ts`:

**mockGeolocation(context, latitude, longitude, page?)**
- Grants geolocation permission
- Stubs navigator.geolocation to return mocked coordinates
- Call BEFORE `page.goto()`
- Use for location verification and reverse geocoding tests

**mockGeolocationDenied(context, page?)**
- Denies geolocation permission
- Stubs navigator.geolocation.getCurrentPosition to call error callback
- Call BEFORE `page.goto()`

**Pre-defined Seoul locations:**
```typescript
SEOUL_GANGNAM      // 강남역 (37.4979, 127.0276)
SEOUL_YEOKSAM      // 역삼동 (37.4837, 127.0324)
SEOUL_SEOCHO       // 서초동 (37.4919, 127.0078)
OUTSIDE_SERVICE    // 부산 (35.1796, 129.0756) — outside service area
```

## Writing Tests

### Basic Test Template

```typescript
import { test, expect } from './fixtures';
import { setupAuthenticatedUser } from './helpers/auth';
import { mockPostsApi } from './helpers/api-mocks';
import { MOCK_POSTS } from './helpers/mock-data';

test.describe('Feature name', () => {
  test('does something specific', async ({ authenticatedPage: page }) => {
    // Setup: authenticatedPage fixture pre-configures all mocks
    await page.goto('/');

    // Assert: expect visible elements
    await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });

    // Interact: click, type, fill
    await page.getByRole('button', { name: '작성하기' }).click();

    // Assert: navigation or state change
    await page.waitForURL((url) => url.pathname.includes('/create-post'));
  });

  test('handles edge case with custom setup', async ({ page }) => {
    // Custom setup: skip fixture, use helpers directly
    await setupAuthenticatedUser(page);
    await mockPostsApi(page, []); // override with empty posts

    await page.goto('/');

    await expect(page.getByText('아직 게시물이 없어요')).toBeVisible();
  });
});
```

### Best Practices

1. **Use fixtures when possible** — `authenticatedPage` and `unauthenticatedPage` save setup code
2. **Call mocks BEFORE `page.goto()`** — route interception must be active before navigation
3. **Use generous timeouts** — 15s for initial page load, 10s for interactions
4. **Prefer `getByRole` over `getByText`** — more maintainable, matches accessibility semantics
5. **Mock all APIs upfront** — include neighborhoods, posts, comments even if unused by the specific test
6. **Use `waitForURL` for navigation assertions** — more reliable than checking URL after click
7. **Test in Korean** — UI strings are in Korean; use `getByText('우리 동네')` not `getByText('My Neighborhood')`
8. **Handle soft deletes** — remember that posts/comments are soft-deleted (check `deleted_at`)

### Common Patterns

**Test list with filtering:**
```typescript
test('filters posts by category', async ({ authenticatedPage: page }) => {
  await page.goto('/');
  await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });

  // Click category filter tab
  await page.getByText('신발').click();

  // Assert filtered posts
  const posts = MOCK_POSTS.filter(p => p.category === 'shoes');
  for (const post of posts) {
    await expect(page.getByText(post.title).first()).toBeVisible({ timeout: 10_000 });
  }
});
```

**Test modal/form interaction:**
```typescript
test('creates a post', async ({ authenticatedPage: page }) => {
  await page.goto('/');

  // Open create post screen
  await page.getByRole('button', { name: '글 쓰기' }).click();
  await page.waitForURL((url) => url.pathname.includes('/create-post'));

  // Fill form
  await page.getByPlaceholder('제목').fill('우산 찾습니다');
  await page.getByPlaceholder('설명').fill('검은색 우산...');

  // Submit
  await page.getByRole('button', { name: '등록' }).click();

  // Assert redirect to feed or detail
  await page.waitForURL((url) => !url.pathname.includes('/create-post'));
});
```

**Test with claim/verification:**
```typescript
test('claims item with verification', async ({ authenticatedPage: page }) => {
  const targetPost = MOCK_POSTS.find(p => p.verification_question);
  await page.goto(`/post/${targetPost.id}`);

  // Click claim button
  await page.getByRole('button', { name: '내 물품입니다' }).click();

  // Answer verification question
  await page.getByPlaceholder('답변').fill('Nike');

  // Submit
  await page.getByRole('button', { name: '확인' }).click();

  // Assert claim submitted
  await expect(page.getByText('확인 중입니다')).toBeVisible({ timeout: 10_000 });
});
```

## Debugging Tests

### Run a single test
```bash
npx playwright test tests/e2e/auth.spec.ts -g "shows login page"
```

### Debug mode (opens Inspector)
```bash
npx playwright test --debug
```

### View test traces (record on failure)
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Check what mocks are active
Add console logs in test:
```typescript
test('example', async ({ page }) => {
  await page.on('request', (req) => console.log(req.url()));
  await page.goto('/');
});
```

### Screenshot on failure
Playwright automatically captures screenshots on failure. View in HTML report:
```bash
npx playwright show-report
```

### Use page.pause() to stop execution
```typescript
test('example', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Pauses here, allows Inspector interaction
  await page.getByText('버튼').click();
});
```

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Mock not intercepting requests | Mock called AFTER `page.goto()` | Call all mocks BEFORE navigation |
| 401 Unauthorized errors | Session not in localStorage | Use `setupAuthenticatedUser()` or `authenticatedPage` fixture |
| Geolocation permissions denied | Location not mocked before page load | Call `mockGeolocation()` BEFORE `page.goto()` |
| Test times out waiting for element | Selector is wrong or element never renders | Check Korean text spelling, use `--debug` to inspect DOM |
| Playwright server already running | Port 8081 in use | Kill existing Expo process: `lsof -i :8081` then `kill -9 <PID>` |
| Random failures in CI | Race condition or timing issue | Increase timeout or add `waitForURL()` checks |

## Running Tests in CI

The config uses 2 workers in CI (set via `process.env.CI`). Ensure:
- All mocks are called BEFORE navigation
- Timeouts are generous (15s for initial load)
- Tests don't share state (each test should be independent)

Example CI command:
```bash
CI=1 npx playwright test
```

## Related Files

- `playwright.config.ts` — Playwright configuration (base URL, viewport, timeouts, reporters)
- `CLAUDE.md` (parent) — Project architecture, routing, data layer patterns
- `tests/e2e/` — All test specifications
- `src/` — Application source code

## Next Steps for Agents

1. **Run tests:** `npx playwright test` to establish baseline
2. **Read a spec:** Open `tests/e2e/auth.spec.ts` to see fixture and helper usage
3. **Add a test:** Use the template above to write a new test for an untested feature
4. **Debug:** Use `--debug` or `.pause()` if a test fails
5. **Review mocks:** Check `helpers/mock-data.ts` for available fixtures before writing custom data

See [e2e/AGENTS.md](./e2e/AGENTS.md) for test spec details and patterns.
