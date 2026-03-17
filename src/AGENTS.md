<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# AGENTS.md - Adizzi Source Code Structure

This document provides AI agent guidance for working with the Adizzi (`어디찌`) app source code. Adizzi is a Korean neighborhood-based lost-and-found community app built with Expo Router, React Native, Supabase, and TanStack React Query.

## Directory Structure

### Core Directories

- **[app/](./app/)** — Expo Router file-based routing
  - `(auth)/` — Pre-auth flow: login, onboarding, verify-location
  - `(tabs)/` — Main app tabs: feed (index), map, create post, notifications, profile
  - `post/[id].tsx` — Post detail view
  - `claims/[postId].tsx` — Claims management for a post
  - `settings/` — User settings: edit-profile, neighborhood, contacts, lost-alerts
  - `_layout.tsx` — Root layout with provider hierarchy

- **[components/](./components/)** — React Native components organized by domain
  - `auth/` — Authentication-related components
  - `comments/` — Comment display and input
  - `feed/` — Feed list and item components
  - `map/` — Map display and interaction
  - `notifications/` — Notification UI components
  - `post/` — Post creation and display
  - `ui/` — Reusable UI primitives

- **[hooks/](./hooks/)** — React Query wrappers around services
  - Data fetching, caching, mutations, and pagination
  - Never use services directly in components; always consume via hooks
  - Hooks handle all data layer logic

- **[services/](./services/)** — Raw Supabase query functions
  - One service file per domain (auth, posts, claims, etc.)
  - Return typed data, no business logic
  - Never call services directly from components (use hooks instead)

- **[lib/](./lib/)** — Utility libraries
  - `supabase.ts` — Supabase client configuration
  - `crypto.ts` — SHA-256 hashing for claim verification
  - `location.ts` — Location utilities and PostGIS helpers
  - `contacts.ts` — Phone contact hashing for privacy
  - `notifications.ts` — Push notification setup
  - `storage.ts` — Local storage helpers

- **[providers/](./providers/)** — Context providers
  - `AuthProvider.tsx` — Supabase session, user profile, auth state
  - `NotificationProvider.tsx` — Push notification registration and handling
  - `RealtimeProvider.tsx` — Supabase realtime subscriptions
  - Applied in order: `SafeAreaProvider → QueryClientProvider → AuthProvider → NotificationProvider → RealtimeProvider → Slot`

- **[types/](./types/)** — TypeScript type definitions
  - `database.types.ts` — Manually maintained Supabase schema types
  - `app.types.ts` — Application-specific types
  - `navigation.types.ts` — Expo Router navigation types

- **[constants/](./constants/)** — App constants
  - `categories.ts` — Post categories (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other)
  - `colors.ts` — Design tokens
  - `layout.ts` — Layout dimensions
  - `config.ts` — App configuration

- **[utils/](./utils/)** — Helper functions
  - `format.ts` — String and data formatting
  - `mention.ts` — User mention parsing and linking
  - `validation.ts` — Input validation

## Critical Patterns & Rules

### Data Layer Pattern (MANDATORY)

```
services/*.service.ts → hooks/use*.ts → components
```

**Components MUST:**
- Consume only from hooks (e.g., `usePost()`, `usePosts()`, `useClaims()`)
- Never import or call services directly
- Never make raw Supabase queries

**Hooks MUST:**
- Wrap services with React Query
- Handle caching, pagination, mutations
- Return typed data and loading/error states

**Services MUST:**
- Contain only raw Supabase queries
- Return typed data
- Have no business logic

### Path Alias

All imports use `@/*` mapped to `src/*`:
```typescript
import { usePost } from '@/hooks/usePost';
import { Button } from '@/components/ui/Button';
import { post } from '@/services/posts.service';
```

### Provider Hierarchy

Root layout (`src/app/_layout.tsx`) wraps all routes with providers in this exact order:

1. **SafeAreaProvider** — Safe area padding
2. **QueryClientProvider** — React Query client
3. **AuthProvider** — Session, user profile, auth state (`isAuthenticated`, `isOnboarded`, `isVerified`)
4. **NotificationProvider** — Push notification registration
5. **RealtimeProvider** — Supabase realtime subscriptions
6. **Slot** — Expo Router outlet

### Korean UI Strings

All user-facing text in the UI is in Korean. When modifying UI components:
- Check existing Korean strings in related components first
- Ask for Korean translations if adding new user-facing text
- Store translations in component files or a dedicated i18n constants file if one exists

### Key Domain Concepts

- **Posts** — `post_type` is `lost` | `found`, `category` is one of: shoes, toy, clothing, bag, electronics, wallet, keys, pet, other
- **Claims** — Verification question/answer flow with SHA-256 hashed answers (`src/lib/crypto.ts`). Max 3 attempts per claim.
- **Neighborhoods** — All posts are scoped to a neighborhood. Users must verify location before accessing feed.
- **Lost Alerts** — Users subscribe to category+keyword alerts; matched via Supabase edge function `match-lost-alerts`
- **Contacts** — Phone contacts hashed for privacy-preserving friend matching (`phone_hashes` table)
- **Soft Delete** — Posts and comments use `deleted_at` column. Always filter with `.is('deleted_at', null)`.
- **Feed Pagination** — Cursor-based with `(created_at, id)` composite cursor

### Supabase Details

- **Database Types** — `src/types/database.types.ts` (manually maintained, not auto-generated)
- **Location** — PostGIS WKT format: `POINT(lng lat)`
- **Maps** — Kakao Maps API with reverse geocoding
- **Edge Functions** — `match-lost-alerts`, `send-push`, `sync-contacts`, `verify-claim`
- **Migrations** — Sequential numbered files in `supabase/migrations/`

## Common Tasks

### Adding a New Feature

1. Define types in `types/` (extend `database.types.ts` if needed)
2. Create service functions in `services/` (raw Supabase queries)
3. Create hooks in `hooks/` (React Query wrappers)
4. Build UI components in `components/`
5. Integrate into routes in `app/`
6. Always follow the data layer pattern: services → hooks → components

### Modifying Existing Data Fetching

- Change queries in `services/*.service.ts`
- Update hooks in `hooks/use*.ts` to reflect new data shape
- Test with TypeScript: `npx tsc --noEmit`

### Working with Authentication

- Auth state and session: `AuthProvider` and `useAuth()` hook
- User profile accessed via `useAuth()` hook
- Auth checks happen automatically in `(auth)/` and `(tabs)/` route guards

### Working with Notifications

- Registration logic: `NotificationProvider` and `useNotifications()` hook
- Push delivery: Supabase edge function `send-push`

### Working with Realtime

- Supabase subscriptions: `RealtimeProvider`
- Use hooks that handle realtime data (e.g., `usePost()` for real-time updates)

## Environment

- **Framework** — Expo Router + React Native
- **Backend** — Supabase (local and cloud)
- **State Management** — TanStack React Query
- **Type Safety** — TypeScript with strict mode
- **Languages** — UI: Korean, Code comments: English

## Commands

```bash
# Development
npx expo start              # Start Expo dev server
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator
npx expo start --web        # Web browser

# Testing & Type Checking
npx tsc --noEmit            # Type-check all TypeScript
npx playwright test         # Run E2E tests

# Supabase (local)
supabase start              # Start local Supabase
supabase db reset           # Reset DB and run migrations + seed
supabase functions serve    # Serve edge functions locally
```

## Verification Checklist for Agents

When implementing features or modifying code:

- [ ] Data layer pattern followed: services → hooks → components
- [ ] All imports use `@/*` path alias
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] No direct service calls from components
- [ ] Korean UI strings used for user-facing text
- [ ] Soft-delete pattern applied to posts/comments (`.is('deleted_at', null)`)
- [ ] Location handling uses PostGIS WKT format `POINT(lng lat)`
- [ ] Claim verification uses SHA-256 hashing from `lib/crypto.ts`
