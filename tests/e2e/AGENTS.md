<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# Adizzi E2E Tests - Spec Details

This document provides details about each test spec file and common patterns used across the test suite.

## Test Specs Overview

### auth.spec.ts

**Purpose:** Test authentication flows (login, onboarding, location verification)

Tests:
- `shows login page with adizzi branding` — Verifies "어디찌" text and tagline appear
- `shows social login buttons` — Checks for "카카오로 시작하기" and "구글로 시작하기" buttons
- `shows dev login button` — Confirms "Dev Login" button exists (for testing)
- `shows terms footer text` — Verifies terms agreement text displays
- `authenticated user reaches home tabs` — Fully authenticated user sees home feed
- `not-onboarded user redirects to onboarding` — User without display_name sees onboarding
- `not-verified user redirects to verify-location` — User without location verification sees location screen
- `dev login authenticates and redirects away from login` — Dev login button works and navigates away

**Key setup helpers:**
- `setupNotOnboardedUser()` — Auth valid, no profile data
- `setupNotVerifiedUser()` — Auth + onboarded, but location not verified
- `mockRpc(page, 'find_neighborhood_by_point', null)` — Mock geolocation RPC call

**Pattern:** Tests use both `unauthenticatedPage` (login screen) and custom setup (other auth states)

---

### home-feed.spec.ts

**Purpose:** Test feed display, post cards, filtering, and navigation

Tests:
- `displays header and post cards` — Verifies "우리 동네" header and all mock posts visible
- `displays category filter with all tabs` — Checks "전체" and category tabs (신발, 지갑, 열쇠, 반려동물, 전자기기)
- `shows empty state when no posts` — Displays "아직 게시물이 없어요" when posts array is empty
- `navigates to post detail when clicking a post card` — Click post → URL changes to `/post/:id`
- `post card shows author handle and location` — Verifies `@handle` and `location_name` visible

**Key setup:**
- Uses `authenticatedPage` fixture (all mocks pre-configured)
- Some tests override mocks (e.g., empty posts)

**Pattern:** Tests category filter tabs by scrolling and checking DOM attachment (not just visibility)

---

### post-detail.spec.ts

**Purpose:** Test post detail page, comments, claim button text

Tests:
- `displays post content with images` — Title, description, images visible
- `displays author info and metadata` — Author name, handle, timestamp, location
- `shows comments section` — Comments list with author names
- `displays claim button for found posts` — Found post shows "내 물품입니다" button
- `displays claim button for lost posts` — Lost post shows "찾았어요" button
- `navigates to claims page when claim button clicked` — Click claim → `/claims/:postId`

**Key setup:**
- Uses `authenticatedPage` fixture
- Custom setup for posts with/without images
- Mock comments via `mockCommentsApi()`

**Pattern:** Tests verify claim button text changes based on `post_type` (found vs. lost)

---

### claims.spec.ts

**Purpose:** Test claiming items with verification questions

Tests:
- `displays verification question for claim` — Shows question text on claims page
- `submits claim with correct answer` — Answer verification question, claim succeeds
- `shows error on incorrect answer` — Wrong answer shows error, attempt count increments
- `disables form after 3 failed attempts` — Max 3 attempts enforced, then claim rejected
- `shows pending claim status` — Claim in `pending` state shows "확인 중입니다"
- `shows verified claim status` — Claim in `verified` state shows success message

**Key setup:**
- Uses mock posts with `verification_question` and `verification_answer_hash`
- Posts use SHA-256 hashed answers (see `src/lib/crypto.ts`)
- Mock claims via `mockClaimsApi()` with different statuses

**Pattern:** Tests state transitions: pending → verified or rejected based on answer correctness

---

### create-post.spec.ts

**Purpose:** Test creating lost and found posts

Tests:
- `navigates to create-post screen` — Tab or button click → `/create-post`
- `creates a found post` — Fill form with title, description, category, images → redirects to feed
- `creates a lost post with verification question` — Adds verification question for found items
- `shows category picker` — All categories selectable (shoes, pet, wallet, keys, electronics, clothing, bag, toy, other)
- `shows image upload` — Can select images from device
- `validates required fields` — Title/description required, shows error if missing

**Key setup:**
- Uses `authenticatedPage` fixture
- Mock image upload via `mockStorageApi()`
- Mock post creation via `mockPostsApi()` with POST method

**Pattern:** Tests form submission and redirect to feed or post detail after creation

---

### profile.spec.ts

**Purpose:** Test user profile page and statistics

Tests:
- `displays user info` — Name, handle, neighborhood visible
- `shows post count statistics` — Total posts, found posts, lost posts
- `shows claimed items count` — How many items user has claimed
- `navigates to edit profile` — Click edit → `/settings/edit-profile`
- `shows my posts list` — Lists posts authored by current user
- `shows logout button` — Logout option present

**Key setup:**
- Uses `authenticatedPage` fixture with `MOCK_USER`
- Mock user profile via `mockUsersApi()`
- Mock posts via `mockPostsApi()` (filtered to user's posts)

**Pattern:** Tests read-only profile display and navigation to edit screens

---

### edit-profile.spec.ts

**Purpose:** Test editing user profile (name, handle, avatar)

Tests:
- `displays current profile data` — Current name, handle pre-filled in form
- `updates display name` — Change name → confirm → persists
- `updates handle` — Change handle (unique check) → persists
- `uploads avatar image` — Select image → uploads → preview updates
- `shows validation errors` — Handle too short/long, name required
- `navigates back to profile after save` — Save → redirects to `/profile`

**Key setup:**
- Custom setup with `setupAuthenticatedUser()`
- Mock user update via `mockUsersApi()` PATCH
- Mock image upload via `mockStorageApi()`

**Pattern:** Tests form interaction, validation, and state persistence

---

### notifications.spec.ts

**Purpose:** Test notifications tab and reading/clearing

Tests:
- `displays notifications list` — All notification types visible
- `shows unread badge on tab` — Unread count visible on notifications tab icon
- `marks notification as read` — Click notification → shows as read
- `filters by notification type` — Tabs for mentions, comments, claims, posts, alerts
- `navigates to post from notification` — Click notification → opens post detail
- `shows notification metadata` — Actor name, post title, timestamp

**Key setup:**
- Uses `authenticatedPage` fixture
- Mock notifications via `mockNotificationsApi()`
- Include notifications with different `type` values: `mention`, `comment`, `new_post`, `claim`, `resolved`, `lost_alert_match`

**Pattern:** Tests notification display, interaction, and navigation

---

### lost-alerts.spec.ts

**Purpose:** Test lost alert creation, management, and matching

Tests:
- `creates a lost alert` — Select category and keywords → creates alert
- `displays active alerts list` — Shows user's active lost alerts
- `deactivates alert` — Toggle alert off → sets `active: false`
- `deletes alert` — Confirm delete → alert removed
- `shows matched posts for alert` — Alerts trigger notifications when new posts match keywords
- `filters alerts by category` — View alerts by shoes, wallet, pet, electronics, etc.

**Key setup:**
- Custom setup with auth + mock lost alerts via `mockLostAlertsApi()`
- Mock posts that match keywords
- Mock notifications for matches

**Pattern:** Tests CRUD operations on lost alerts and post matching

---

### verify-location.spec.ts

**Purpose:** Test location verification and neighborhood selection

Tests:
- `requests geolocation permission` — Shows "위치 권한이 필요해요" if denied
- `finds neighborhood by geolocation` — Mocked geolocation → finds correct neighborhood
- `shows neighborhood options` — If multiple neighborhoods nearby, show picker
- `confirms neighborhood selection` — Select neighborhood → verify → proceed to feed
- `handles location unavailable` — Shows "위치를 가져올 수 없어요" error
- `handles no neighborhood found` — Shows "근처 동네를 찾을 수 없어요" if outside service area

**Key setup:**
- `setupNotVerifiedUser()` — Redirects to location verification
- `mockGeolocation(context, lat, lng, page)` — Mock GPS coordinates
- `mockGeolocationDenied(context, page)` — Test permission denial
- `mockRpc(page, 'find_neighborhood_by_point', result)` — Mock neighborhood lookup
- Use Seoul locations: `SEOUL_GANGNAM`, `SEOUL_YEOKSAM`, `SEOUL_SEOCHO`, `OUTSIDE_SERVICE`

**Pattern:** Tests geolocation mocking and neighborhood RPC lookup

---

### neighborhood-settings.spec.ts

**Purpose:** Test neighborhood selection and switching in settings

Tests:
- `displays current neighborhood` — Shows user's verified neighborhood
- `lists available neighborhoods` — All neighborhoods in service area visible
- `switches neighborhood` — Select new neighborhood → confirm → updates profile
- `shows neighborhood description` — District, city info for each neighborhood
- `confirms neighborhood change` — Warning dialog before switching

**Key setup:**
- Uses `authenticatedPage` fixture
- Mock neighborhoods via `mockNeighborhoodsApi()` with multiple options
- Mock user update via `mockUsersApi()` PATCH with new `neighborhood_id`

**Pattern:** Tests neighborhood picker and profile update

---

### navigation.spec.ts

**Purpose:** Test tab navigation and routing structure

Tests:
- `navigates between tabs` — Feed ↔ Map ↔ Create ↔ Notifications ↔ Profile
- `maintains scroll position when switching tabs` — Tab cache behavior
- `shows correct active tab indicator` — Visual indication of current tab
- `deeplink to post detail` — Direct URL `/post/:id` works
- `deeplink to claims page` — Direct URL `/claims/:postId` works
- `back button navigates correctly` — Back button goes to previous screen

**Key setup:**
- Uses `authenticatedPage` fixture
- Tests routing via `page.goto()` with various URLs
- Verifies tab visibility and focus

**Pattern:** Tests Expo Router navigation and tab persistence

---

### onboarding.spec.ts

**Purpose:** Test onboarding flow for new users

Tests:
- `shows onboarding screen for new users` — "프로필 설정" screen displays
- `collects display name and handle` — Form with name and handle fields
- `validates unique handle` — Handle duplication check
- `shows neighborhood selection in onboarding` — Pick neighborhood before feed access
- `completes onboarding flow` — Fill all fields → confirm → redirected to location verification
- `shows terms and privacy policy` — Links to legal documents

**Key setup:**
- `setupNotOnboardedUser()` — Auth valid but no profile data
- Mock user creation/update via `mockUsersApi()` PATCH
- Mock neighborhood lookup via `mockNeighborhoodsApi()`

**Pattern:** Tests multi-step onboarding form with validation

---

## Common Test Patterns

### Fixture Usage

**authenticatedPage** — Use for most tests
```typescript
test('example', async ({ authenticatedPage: page }) => {
  await page.goto('/');
  // Pre-mocked: posts, notifications, neighborhoods, comments, claims
});
```

**unauthenticatedPage** — Use for login, logout, pre-auth flows
```typescript
test('login page', async ({ unauthenticatedPage: page }) => {
  await page.goto('/');
  // No auth, shows login screen
});
```

**Custom setup** — Use when fixture doesn't match test needs
```typescript
test('not-onboarded user', async ({ page }) => {
  await setupNotOnboardedUser(page);
  await page.goto('/');
  // Shows onboarding screen
});
```

### Element Selection

Prefer `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText`:
```typescript
// Best: by role (semantic)
await page.getByRole('button', { name: '작성하기' }).click();

// Good: by placeholder (form inputs)
await page.getByPlaceholder('제목').fill('Lost Phone');

// Acceptable: by text (UI labels)
await expect(page.getByText('우리 동네')).toBeVisible();

// Last resort: by test ID (requires data-testid in code)
await page.getByTestId('post-card').click();
```

### Waiting and Assertions

Use generous timeouts for reliability:
```typescript
// Page load: 15s
await expect(page.getByText('우리 동네')).toBeVisible({ timeout: 15_000 });

// Interactions: 10s
await expect(page.getByText('로딩 중...')).toBeHidden({ timeout: 10_000 });

// Navigation: 10s with waitForURL
await page.waitForURL((url) => url.pathname.includes('/post/'), { timeout: 10_000 });
```

### Mocking Patterns

**Mock before navigation (critical):**
```typescript
await setupAuthenticatedUser(page);
await mockPostsApi(page, MOCK_POSTS);
await page.goto('/'); // NOW mocks are active
```

**Override specific APIs:**
```typescript
const customPosts = MOCK_POSTS.slice(0, 2); // Subset
await mockPostsApi(page, customPosts);
```

**Mock with empty data:**
```typescript
await mockPostsApi(page, []); // Empty feed for "no posts" test
```

**Chain multiple mocks:**
```typescript
await mockPostsApi(page, MOCK_POSTS);
await mockCommentsApi(page, MOCK_COMMENTS);
await mockNotificationsApi(page, MOCK_NOTIFICATIONS);
```

### Korean Text Testing

All UI strings are in Korean. Use exact Korean text:
```typescript
// Correct
await expect(page.getByText('우리 동네')).toBeVisible();
await page.getByText('작성하기').click();

// Wrong (English)
await expect(page.getByText('My Neighborhood')).toBeVisible(); // ❌ Won't find it
```

## Adding New Tests

1. **Choose the right spec file** — Feature determines which file (e.g., post claiming → claims.spec.ts)
2. **Use the fixture template** — Start with `authenticatedPage` unless testing auth/pre-auth
3. **Mock required APIs** — Include posts, neighborhoods, and any feature-specific data
4. **Write readable assertions** — Use `getByRole` and be specific about timeouts
5. **Test edge cases** — Empty state, errors, validation, permissions
6. **Use mock data helpers** — Don't hardcode; reference `MOCK_POSTS`, etc.

Example:
```typescript
import { test, expect } from './fixtures';
import { mockPostsApi } from './helpers/api-mocks';
import { MOCK_POSTS } from './helpers/mock-data';

test.describe('New feature', () => {
  test('does something', async ({ authenticatedPage: page }) => {
    await page.goto('/new-feature');

    await expect(page.getByText('Feature title')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Action' }).click();

    await expect(page.getByText('Success!')).toBeVisible({ timeout: 10_000 });
  });
});
```

## Debugging Failed Tests

1. **Check mock setup** — Ensure mocks called BEFORE `page.goto()`
2. **Verify Korean text** — Copy-paste from app, not translated version
3. **Use --debug mode** — `npx playwright test --debug` opens inspector
4. **Screenshot on failure** — Check HTML report for auto-captured screenshots
5. **Review timeouts** — Increase if test times out (network, rendering)
6. **Check geolocation mocks** — Especially for location verification tests

Run single test with debug:
```bash
npx playwright test tests/e2e/auth.spec.ts -g "shows login" --debug
```

## Performance Notes

- **Parallel execution** — Tests run in 4 workers (2 in CI) for speed
- **Auto-start Expo** — Dev server auto-starts; reuses if already running
- **Mock all APIs** — Don't make real API calls; use mocks for speed and reliability
- **Screenshot only on failure** — Reduces test run time

## References

- `tests/e2e/fixtures/index.ts` — Custom test fixtures
- `tests/e2e/helpers/*.ts` — Mocking and setup helpers
- `tests/e2e/helpers/mock-data.ts` — Sample data
- `playwright.config.ts` — Test configuration
- Parent: [../AGENTS.md](../AGENTS.md)
