<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# AGENTS.md - Adizzi Routing (Expo Router)

This document provides AI agent guidance for working with the Adizzi routing layer. The app uses **Expo Router** file-based routing with a hierarchical structure: root → auth flow → main tabs → detail/modal screens.

## Directory Structure & Route Map

### Root Layout & Redirect

**File: `_layout.tsx`**
- Root layout component wrapping all routes
- Provider hierarchy: `SafeAreaProvider → QueryClientProvider → AuthProvider → NotificationProvider → RealtimeProvider → Slot`
- Deep link handling for OAuth redirects (Kakao, Google)
- Query client configured with 5-minute staleTime, 10-minute gcTime

**File: `index.tsx`**
- Root redirect based on auth state
- Routes authenticated users to auth flow or main app depending on status:
  - Not authenticated → `/(auth)/login`
  - Authenticated but not onboarded → `/(auth)/onboarding`
  - Onboarded but location not verified → `/(auth)/verify-location`
  - Full access → `/(tabs)`
- Shows loading spinner while determining auth state

### Pre-Auth Flow: `(auth)/`

**File: `(auth)/_layout.tsx`**
- Stack navigator for sequential auth screens
- No header animation (headerShown: false)
- No screen transition animation (animation: 'none')

**File: `(auth)/login.tsx`**
- Social login with Kakao and Google OAuth
- Dev login button in development builds (test@adizzi.dev)
- Hero section with app name (어디찌), tagline, and description
- Handles OAuth provider state management
- On success, redirects to onboarding

**File: `(auth)/onboarding.tsx`**
- User profile setup after OAuth signup
- Collects display_name, handle, avatar upload
- On completion, advances to location verification

**File: `(auth)/verify-location.tsx`**
- GPS-based neighborhood detection with fallback to manual selection
- Shows detected neighborhood name and city/district
- Accuracy warning if GPS precision > 1000m
- Manual selection modal with neighborhood search
- Confirms neighborhood and updates user profile with neighborhood_id
- Routes to `/(tabs)` on success

### Main App: `(tabs)/`

**File: `(tabs)/_layout.tsx`**
- Tab navigator with 5 tabs: Home, Map, Create, Notifications, Profile
- Custom tab icons using emoji (🏠 🗺️ ➕ 🔔 👤)
- Unread notification badge on Notifications tab
- Tab styling: white background, primary tint color, custom font size

**File: `(tabs)/index.tsx` — Feed**
- Home tab: feed of lost/found posts for user's neighborhood
- Category filter selector
- Infinite scroll pagination with `usePosts()` hook
- Tap post → navigate to `/post/[id]`

**File: `(tabs)/map.tsx` — Map**
- Kakao Maps display of neighborhood posts
- Post markers with filtering
- Tap marker → navigate to `/post/[id]`

**File: `(tabs)/create.tsx` — Create Post**
- New post form: select post_type (lost/found), category, images, title, description
- Location auto-filled from user's verified neighborhood
- On success, returns to feed

**File: `(tabs)/notifications.tsx` — Notifications**
- List of user notifications (claims, comments, lost alerts)
- Marks notifications as read on tap
- Tap notification → navigates to relevant detail screen

**File: `(tabs)/profile.tsx` — Profile**
- User profile display with avatar, handle, display_name
- User's own posts list
- Link to settings: `/settings/edit-profile`, `/settings/neighborhood`, `/settings/contacts`, `/settings/lost-alerts`

### Detail & Modal Routes

**File: `post/[id].tsx` — Post Detail**
- Displays full post: images, title, author, category, location, description
- Comments section with infinite scroll
- Claim button (for found posts)
- Report/delete menu (own posts can delete, others can report)
- Comment input fixed at bottom
- Uses hooks: `usePost()`, `useComments()`, `useAuth()`
- Routes back via `router.back()`

**File: `claims/[postId].tsx` — Claims Management**
- Displays post summary (thumbnail, title, status badge)
- List of claims for the post with claimant info and status badges
- Approve/reject buttons for pending claims
- Uses hooks: `useClaimsForPost()`, `useApproveClaim()`, `useRejectClaim()`, `usePost()`
- Only accessible to post author
- Routes back via `router.back()`

### Settings Routes

**File: `settings/edit-profile.tsx`**
- Edit display_name, handle, avatar
- Form submission updates user profile
- Routes back to profile

**File: `settings/neighborhood.tsx`**
- Change verified neighborhood
- Search and select from neighborhood list
- Updates neighborhood_id in user profile

**File: `settings/contacts.tsx`**
- Sync phone contacts for friend matching
- Privacy-preserving hashing (phone_hashes table)
- List of synced contacts

**File: `settings/lost-alerts.tsx`**
- Subscribe to lost item alerts by category + keyword
- Create alert → matched via Supabase edge function `match-lost-alerts`
- Receive push notifications on match

## Routing Conventions

### Dynamic Routes (File-Based Params)

Segments in brackets become route params accessible via `useLocalSearchParams()`:

```typescript
// Route: /post/[id]
const { id } = useLocalSearchParams<{ id: string }>();

// Route: /claims/[postId]
const { postId } = useLocalSearchParams<{ postId: string }>();
```

### Navigation Patterns

**Push to detail:**
```typescript
router.push(`/post/${postId}`);
router.push(`/claims/${postId}`);
```

**Replace (auth flow):**
```typescript
router.replace('/(auth)/login');
router.replace('/(tabs)');
```

**Go back:**
```typescript
router.back();
```

### Layout Groups

Routes grouped in parentheses are not part of URL structure:

- `(auth)` — Sequential auth flow (no tabs)
- `(tabs)` — Tab navigator (mutually exclusive screens)
- Settings routes are individual files (not a group)

## Key Behaviors

### Auth State Routing

Root `index.tsx` checks `isAuthenticated`, `isOnboarded`, `isVerified` from `useAuth()` hook and routes accordingly. This ensures users can't skip auth or location verification steps.

### Location Verification

`(auth)/verify-location.tsx` uses:
- `useLocation()` to request device GPS
- `useNeighborhoodByLocation()` to query PostGIS for nearest neighborhood
- Falls back to manual selection via `useNeighborhoods()`
- Calls `updateLocationVerification()` service to confirm choice

### Feed Pagination

`(tabs)/index.tsx` uses `usePosts()` hook with cursor-based pagination (composite cursor on `created_at`, `id`). Infinite scroll via FlatList `onEndReached`.

### Claims Management

`claims/[postId].tsx` is only accessible from post detail screen when user is the post author. Mutations use `useApproveClaim()` and `useRejectClaim()` hooks.

### Comments & Reporting

Post detail screen has:
- Inline comment list (with infinite scroll) and input
- Report modal for post/comment reporting
- Delete confirmation for own posts
- Uses `useComments()` and reporting service for submissions

## Korean UI Strings

All user-facing text is in Korean:

- Login: 로그인에 실패했습니다, 로그인 오류
- Feed: 우리 동네, 내 동네 분실물
- Create: 게시물 작성
- Notifications: 알림
- Profile: 프로필
- Post detail: 게시물 상세, 댓글, 신고하기, 삭제하기
- Claims: 소유 요청 관리, 대기중, 인증됨, 거절됨
- Location: 위치를 확인하고 있어요, 이 동네가 맞으세요?, 동네 선택
- Settings: 프로필 수정, 동네 변경, 연락처 동기화, 분실물 알림

## Environment & Types

**useLocalSearchParams():**
Always type-cast with generic: `useLocalSearchParams<{ id: string }>()`

**useAuth():**
Returns: `{ user, profile, loading, isAuthenticated, isOnboarded, isVerified, signIn, signOut, refreshProfile }`

**useLocation():**
Returns: `{ location, loading, error, hasPermission, requestLocation }`

**Soft Delete:**
Posts use `deleted_at` column. Always filter: `.is('deleted_at', null)` in queries.

## Testing Routes

### Manual Navigation Tests

```bash
# Start dev server
npx expo start --ios

# Test auth flow
# 1. Login → Onboarding → Verify Location → Feed
# 2. Create post from feed
# 3. Tap post → detail screen
# 4. Tap claimant → claims screen (if own post)
# 5. Tap profile → settings

# Test deep links (OAuth redirect)
# Set EXPO_PUBLIC_SUPABASE_URL in env.local
# OAuth flow should redirect to /post/[id] or home on success
```

### E2E Tests

```bash
npx playwright test
```

See `tests/e2e/` for route-specific test suites.

## Common Agent Tasks

### Adding a New Tab

1. Create file `(tabs)/newtab.tsx` with screen component
2. Add `<Tabs.Screen name="newtab" options={{...}} />` to `(tabs)/_layout.tsx`
3. Import icon or emoji for tab bar

### Adding a Settings Screen

1. Create `settings/newsetting.tsx` component
2. Link from profile: `router.push('/settings/newsetting')`
3. Navigation back via `router.back()`

### Modifying Auth Flow

1. Edit screen components in `(auth)/`
2. Update redirect logic in `index.tsx` if adding new state checks
3. Keep Stack layout in `(auth)/_layout.tsx` with all screens

### Fixing Navigation Issues

- Check `useLocalSearchParams()` type-casting
- Verify `router.push()` / `router.replace()` URLs match actual routes
- Ensure auth guards are in `index.tsx`, not individual screens
- Test with `npx expo start --ios` or `--android` to verify deep links

## Reference

- **Expo Router docs:** https://docs.expo.dev/routing/introduction/
- **useAuth hook:** `src/hooks/useAuth.ts`
- **Route auth checks:** `src/app/index.tsx`
- **Provider hierarchy:** `src/app/_layout.tsx`
