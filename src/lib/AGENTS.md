<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/lib

Low-level utility libraries and client initialization for Supabase, cryptography, storage, and location services.

## Purpose

Provide foundational utilities that services depend on: Supabase client setup, cryptographic hashing, location/geocoding helpers, contact privacy hashing, notifications setup, and storage operations. These are shared across the services layer.

## Key Files

| File | Purpose |
|------|---------|
| `contacts.ts` | Hash phone contacts for privacy-preserving friend matching |
| `crypto.ts` | SHA-256 hashing for claim verification answers |
| `location.ts` | PostGIS helpers and Kakao Maps reverse geocoding |
| `notifications.ts` | Push notification initialization and registration |
| `storage.ts` | Supabase Storage helpers (upload, delete, sign URLs) |
| `supabase.ts` | Supabase client initialization and configuration |

## For AI Agents

**Key patterns:**

- **Supabase client** (`supabase.ts`): Singleton initialized once, exported for use in services
- **Crypto** (`crypto.ts`): Deterministic SHA-256 hashing for claim answers; same input always produces same hash
- **Location** (`location.ts`): Kakao Maps API for reverse geocoding; stores locations as PostGIS WKT (`POINT(lng lat)`)
- **Storage** (`storage.ts`): Handles image uploads to Supabase Storage, generates signed URLs for image display
- **Contacts** (`contacts.ts`): Hash phone numbers with salt for privacy; enables matching without exposing raw numbers
- **Notifications** (`notifications.ts`): Setup push token registration, handle token refresh on app startup

**Error handling:**
- Services catch errors from these utilities and propagate to hooks
- Location errors should fallback gracefully (user can retry or manually enter address)
- Crypto operations are synchronous; no async overhead

## Dependencies

- `@supabase/supabase-js` (Supabase client)
- `expo-notifications` (push notification setup)
- `expo-location` (device location access)
- `expo-file-system` (local file operations)
- `crypto-js` or Node.js `crypto` (hashing)
- Kakao Maps API (reverse geocoding)
