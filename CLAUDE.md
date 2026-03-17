# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Adizzi (어디찌)?

A Korean neighborhood-based lost-and-found community app. Users post lost or found items scoped to their verified neighborhood, claim items via verification questions, and receive notifications. The app name is 어디찌 (Adizzi). UI strings are in Korean.

## Commands

```bash
npx expo start              # Start dev server (Expo Go)
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator
npx expo start --web        # Web browser
npx playwright test         # Run E2E tests
npx tsc --noEmit            # Type-check
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

`@/*` maps to `src/*` (configured in tsconfig.json).

### Provider hierarchy (src/app/_layout.tsx)

`SafeAreaProvider → QueryClientProvider → AuthProvider → NotificationProvider → RealtimeProvider → Slot`

- **AuthProvider** — manages Supabase session, user profile, and auth state (`isAuthenticated`, `isOnboarded`, `isVerified`)
- **NotificationProvider** — push notification registration and handling
- **RealtimeProvider** — Supabase realtime subscriptions

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

### Key domain concepts

- **Posts** have a `post_type` (`lost` | `found`) and a `category` (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other)
- **Claims** use a verification question/answer flow with SHA-256 hashed answers (`src/lib/crypto.ts`). Max 3 attempts per claim.
- **Neighborhoods** scope all posts. Users must verify their location before accessing the feed.
- **Lost alerts** — users subscribe to category+keyword alerts; matched via Supabase edge function `match-lost-alerts`
- **Contacts** — phone contacts are hashed for privacy-preserving friend matching (`phone_hashes` table)
- Soft-delete pattern: posts/comments use `deleted_at` column, always filter with `.is('deleted_at', null)`
- Feed pagination uses cursor-based approach with `(created_at, id)` composite cursor

### Supabase

- Edge functions: `match-lost-alerts`, `send-push`, `sync-contacts`, `verify-claim`
- Migrations in `supabase/migrations/` (sequential numbered files)
- Database types in `src/types/database.types.ts` (manually maintained, not auto-generated)
- Location stored as PostGIS WKT (`POINT(lng lat)`)
- Maps use Kakao Maps API with reverse geocoding

### Environment variables

Required in `env.local` (prefixed with `EXPO_PUBLIC_`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
