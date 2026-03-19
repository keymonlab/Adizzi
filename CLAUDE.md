# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Adizzi (어디찌)?

A Korean neighborhood-based lost-and-found community app. Users post lost or found items scoped to their verified neighborhood, claim items via verification questions, and receive notifications. The app name is 어디찌 (Adizzi). All UI strings are in Korean.

## Commands

```bash
npx expo start                        # Start dev server (Expo Go)
npx expo start --web                  # Web browser
npx expo start --ios                  # iOS simulator
npx expo start --android              # Android emulator
npx tsc --noEmit                      # Type-check
npx playwright test                   # Run all E2E tests (web)
npx playwright test tests/e2e/auth.spec.ts  # Run single E2E test
npm run test:ios                      # Run all Maestro mobile tests
npm run test:ios:single .maestro/flows/some.yaml  # Run single Maestro test
npm run clean:cache                   # Clear Metro/watchman/node_modules cache
npm run clean:expo-go                 # Clear Expo Go cache on iOS simulator
```

Supabase (local):
```bash
supabase start              # Start local Supabase
supabase db reset           # Reset DB and run all migrations + seed
supabase functions serve    # Serve edge functions locally
```

## Architecture

**Expo Router + React Native** app with **Supabase** backend and **TanStack React Query** for data fetching.

### Path alias

`@/*` maps to `src/*` (configured in tsconfig.json). Note: `supabase/functions/**` is excluded from TypeScript compilation.

### Provider hierarchy (src/app/_layout.tsx)

`SafeAreaProvider → QueryClientProvider → AuthProvider → NotificationProvider → RealtimeProvider → Slot`

- **AuthProvider** — manages Supabase session, user profile, and auth state (`isAuthenticated`, `isOnboarded`, `isVerified`)
- **NotificationProvider** — push notification registration and handling
- **RealtimeProvider** — Supabase realtime subscriptions; invalidates React Query caches on postgres_changes for `notifications`, `posts`, `comments`, and `claims` tables

### Auth flow

OAuth providers: `kakao` and `google`. On native, uses `expo-web-browser` for OAuth redirect flow. On web, uses standard Supabase OAuth redirect. Session is stored via `expo-secure-store` (native) or `localStorage` (web). Auth state machine: unauthenticated → authenticated (no profile) → onboarded (has handle + display_name) → verified (location_verified = true).

### Routing (Expo Router file-based)

- `src/app/(auth)/` — login, onboarding, verify-location (pre-auth flow)
- `src/app/(tabs)/` — main app tabs: feed (index), map, create post, notifications, profile
- `src/app/post/[id].tsx` — post detail
- `src/app/claims/[postId].tsx` — claims for a post
- `src/app/settings/` — edit-profile, neighborhood, contacts, lost-alerts

### Data layer pattern

`services/*.service.ts` → raw Supabase queries (return typed data)
`hooks/use*.ts` → React Query wrappers around services (handle caching, pagination, mutations)
Components consume hooks, never call services directly.

React Query defaults: `staleTime: 5min`, `gcTime: 10min`. Mutations invalidate related query keys (e.g., `useCreatePost` invalidates `['posts', neighborhoodId]`).

### Key domain concepts

- **Posts** have a `post_type` (`lost` | `found`), a `category` (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other), and a `status` (`active` | `resolved`)
- **Claims** use a verification question/answer flow with SHA-256 hashed answers (`src/lib/crypto.ts`). Max 3 attempts per claim. Status: `pending` | `verified` | `rejected`
- **Neighborhoods** scope all posts. Users must verify their location before accessing the feed.
- **Lost alerts** — users subscribe to category+keyword alerts; matched via Supabase edge function `match-lost-alerts` (called fire-and-forget after post creation)
- **Contacts** — phone contacts are hashed for privacy-preserving friend matching (`phone_hashes` table)
- **Notifications** — types: `new_post`, `comment`, `mention`, `claim`, `resolved`, `lost_alert_match`
- Soft-delete pattern: posts/comments use `deleted_at` column, always filter with `.is('deleted_at', null)`
- Feed pagination uses cursor-based approach with `(created_at, id)` composite cursor
- Config constants in `src/constants/config.ts`: `FEED_PAGE_SIZE=20`, `MAX_IMAGES=5`, `MAX_CLAIM_ATTEMPTS=3`

### Supabase

- Edge functions: `match-lost-alerts`, `send-push`, `sync-contacts`, `verify-claim`
- Migrations in `supabase/migrations/` (sequential numbered files, 00001–00009)
- Database types in `src/types/database.types.ts` (manually maintained, not auto-generated — update this file when changing the schema)
- Domain types in `src/types/app.types.ts` (PostType, Category, PostStatus, ClaimStatus, NotificationType, ReportStatus)
- Location stored as PostGIS WKT (`POINT(lng lat)`) — see `toWKT()` in `posts.service.ts`
- Maps use Kakao Maps API with reverse geocoding

### E2E tests (Playwright)

Tests in `tests/e2e/`. Custom Playwright fixtures in `tests/e2e/fixtures/index.ts` provide `authenticatedPage` and `unauthenticatedPage`. Auth is mocked by injecting Supabase session into localStorage and intercepting API routes. Mock data in `tests/e2e/helpers/mock-data.ts`. Tests run against `http://localhost:8081` (web export via `npx expo start --web --port 8081`).

### Environment variables

Required in `env.local` (prefixed with `EXPO_PUBLIC_`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
