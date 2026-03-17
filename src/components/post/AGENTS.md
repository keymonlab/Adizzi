<!-- Parent: ../AGENTS.md -->

# src/components/post

Post creation and claiming components for lost/found items.

**Last updated:** 2026-03-17

## Components

### CategoryPicker.tsx
Category selection grid for post creation.

- 9-item grid (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other)
- Single-select with highlight on chosen category
- Icons and Korean labels
- Returns selected category value

### ClaimButton.tsx
Claim/found button with state awareness.

- Text differs by post type: "분실물 신청" (lost), "발견자입니다" (found)
- Disabled if user already claimed or time-locked
- Shows loading state during claim submission
- Navigates to VerificationForm on tap

### ImagePicker.tsx
Photo selection from camera or gallery.

- Triggers native photo picker (expo-image-picker)
- Supports multiple selection (up to 5 images)
- Preview thumbnails
- Returns array of image URIs

### ImageSlider.tsx
Horizontal carousel for post images.

- Swipeable image gallery
- Page indicator (current/total)
- Tap to full-screen view
- Used in post detail and creation screens

### LocationPicker.tsx
Map-based location selection with Kakao geocoding.

- Shows map with initial user location
- Tap map to place marker
- Reverse geocoding updates address text
- Returns `{lat, lng, address, neighborhood}`

### VerificationForm.tsx
Question/answer form for post claims with SHA-256 hashing.

- User defines verification question during post creation
- Claimant answers question; max 3 attempts
- SHA-256 hash of answer compared against stored hash
- Returns verification submission status

## Data flow

**Post creation:** User selects category → picks images → places location → sets verification question → submits post

**Claiming:** User taps claim button → VerificationForm appears → answers question → answer hashed and compared → success creates claim or failure decrements attempts

## Related

- `hooks/useCreatePost.ts` — post creation mutation
- `hooks/useClaimPost.ts` — claim submission mutation
- `src/lib/crypto.ts` — SHA-256 hashing utility
- `src/app/(tabs)/create.tsx` — create post screen
