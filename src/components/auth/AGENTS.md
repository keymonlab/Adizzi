<!-- Parent: ../AGENTS.md -->

# src/components/auth

Authentication-related UI components for login and account setup flows.

**Last updated:** 2026-03-17

## Components

### HandleInput.tsx
Username/handle input with real-time validation.

- Input field with debounced validation
- Checks handle availability against user database
- Displays validation error/success state
- Used in onboarding flow (`src/app/(auth)/onboarding`)

### SocialLoginButton.tsx
Social login buttons (Kakao, Apple) for authentication entry points.

- Kakao and Apple OAuth flows via Supabase auth
- Platform-aware: uses expo-auth-session for native, web SDK for web
- Loading and error states during auth flow
- Integrates with AuthProvider context

## Data flow

1. User taps social login button
2. OAuth provider (Kakao/Apple) returns session token
3. Supabase authenticates and creates/updates user
4. AuthProvider updates app state (`isAuthenticated`, user profile)
5. Router navigates to onboarding or main feed based on `isOnboarded` flag

## Related

- `src/contexts/AuthProvider.tsx` — session and user profile state
- `src/app/(auth)/` — login and onboarding screens
