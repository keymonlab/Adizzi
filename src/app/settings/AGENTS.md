<!-- Parent: ../AGENTS.md -->
# settings — User Settings & Preferences

Settings screens accessible from profile tab. Routes: edit-profile, neighborhood, contacts, lost-alerts.

## Files

### edit-profile.tsx
Change display_name, handle, avatar. Syncs form state from `useAuth().profile`. Handle validation via HandleInput (checks uniqueness). Avatar picker via expo-image-picker, uploads to Supabase storage, updates avatar_url. Calls `updateProfile()` and `refreshProfile()`. Back button or drawer close on save.

### neighborhood.tsx
Re-verify GPS location to switch neighborhoods. Same flow as verify-location screen (permission, reverse-geocoding, updates neighborhood_id). Confirms before switching.

### contacts.tsx
Sync phone contacts for friend matching. Lists contacts (read-only), shows sync status, uploads phone number hashes to phone_hashes table via `syncContacts()` mutation. Privacy-preserving (numbers hashed, not stored).

### lost-alerts.tsx
Subscribe to category + keyword alerts. Form: category dropdown, keyword input. Creates lost_alert record via mutation. List subscriptions with delete action. Matched via Supabase edge function `match-lost-alerts` (triggers push notifications).

## Key Hooks

- `useAuth()` — user, profile, refreshProfile
- Custom mutations — `updateProfile()`, `syncContacts()`, create/delete lost_alert

## Key Services

- `users.service` — updateProfile
- `contacts.service` — syncContacts (hashes phone numbers)
- `lost-alerts.service` — create, delete alerts

Updated: 2026-03-17
