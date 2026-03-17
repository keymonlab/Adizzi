<!-- Parent: ../AGENTS.md -->
# (auth) — Authentication Flow

Pre-authentication screens. Users complete login → onboarding → location verification before accessing main app.

## Files

### _layout.tsx
Stack navigator (headerShown: false, no animation). Routes: login, onboarding, verify-location.

### login.tsx
Kakao/Google OAuth via SocialLoginButton. Shows hero section (Logo: 어디찌, tagline: 우리 동네 분실물 찾기). Dev login for test@adizzi.dev (dev builds only). Calls `useAuth().signIn(provider)` and `useAuth().signInWithEmail()`. Handles OAuth errors via Alert.

### onboarding.tsx
Set display_name and handle after OAuth signup. Auto-suggests handle from email prefix. Validates handle availability via HandleInput component. Calls `useAuth().refreshProfile()` after `updateProfile()`. Routes to verify-location on success.

### verify-location.tsx
GPS-based neighborhood verification. Requests location permission, reverse-geocodes via Kakao Maps API to get neighborhood_id, stores in user profile. Prerequisite before feed access.

## Data Flow

1. login.tsx → signIn() [Supabase OAuth]
2. onboarding.tsx → updateProfile({display_name, handle})
3. verify-location.tsx → updateProfile({neighborhood_id})
4. Routes to (tabs) on completion

## Key Hooks

- `useAuth()` — session, user, profile, signIn, signInWithEmail, refreshProfile
- `handleInput` — validates handle uniqueness via service

Updated: 2026-03-17
