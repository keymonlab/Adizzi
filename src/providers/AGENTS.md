<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/providers

React context providers that manage global app state. Composed in a strict hierarchy in `src/app/_layout.tsx`.

## Purpose

Centralize global state (authentication, notifications, realtime subscriptions) in reusable context providers. Components access this state via hooks; never import providers directly.

## Key Files

| File | Purpose |
|------|---------|
| `AuthProvider.tsx` | Supabase session, user profile, auth state (`isAuthenticated`, `isOnboarded`, `isVerified`) |
| `NotificationProvider.tsx` | Push notification registration and token management |
| `RealtimeProvider.tsx` | Supabase realtime subscriptions for live updates |

## Provider Hierarchy

```
SafeAreaProvider
  ↓
QueryClientProvider
  ↓
AuthProvider (session, user profile)
  ↓
NotificationProvider (push setup)
  ↓
RealtimeProvider (subscriptions)
  ↓
Slot (Expo Router outlet)
```

## For AI Agents

**AuthProvider behavior:**
- Initializes Supabase session on app startup
- Fetches user profile from `users` table
- Manages `isAuthenticated`, `isOnboarded`, `isVerified` flags
- Redirects unauthenticated users to `/auth` routes
- Tracks location verification state

**NotificationProvider behavior:**
- Registers device for push notifications on mount
- Handles token refresh when token expires
- Stores push token in database via `notifications.service.ts`
- Cleanup: unregister on unmount

**RealtimeProvider behavior:**
- Subscribes to realtime channels after auth is ready
- Listens for changes to posts, claims, comments
- Unsubscribes cleanly on unmount to prevent memory leaks
- Triggers React Query cache invalidation on DB changes

**Consumption pattern:**
```typescript
import { useAuth } from '@/hooks/useAuth';
const { user, isVerified } = useAuth();
```

**Initialization order:**
1. AuthProvider checks session (restores if exists)
2. NotificationProvider waits for AuthProvider then registers token
3. RealtimeProvider waits for both, then subscribes to channels

## Dependencies

- React Context API
- Supabase client (`@supabase/supabase-js`)
- Expo Notifications
- TanStack React Query (cache invalidation)
