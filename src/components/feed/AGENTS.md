<!-- Parent: ../AGENTS.md -->

# src/components/feed

Main feed display components with infinite scroll and filtering.

**Last updated:** 2026-03-17

## Components

### CategoryFilter.tsx
Horizontal scrollable category chip filter.

- Chips for all categories (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other)
- Single-select or multi-select mode
- Animated active state indicator
- Applies filter to feed query via parent state

### PostCard.tsx
Post preview card with image, status, and location.

- Thumbnail image (first from post) or placeholder
- Category badge and post type indicator (lost/found)
- Title and description truncated
- Location text from reverse geocoding
- Tap navigates to post detail (`post/[id]`)

### PostList.tsx
Infinite scroll feed with cursor-based pagination.

- Uses `usePostsFeed` hook with cursor pagination
- Renders list of PostCard components
- Auto-loads next page when user scrolls near bottom
- Respects neighborhood scope and category filters
- Handles loading, error, and empty states

### PostStatusBadge.tsx
Visual indicator for post status (lost/found/claimed).

- Color-coded badge: gray (claimed), orange (lost), green (found)
- Displays localized Korean text
- Used in PostCard and post detail screens

## Data flow

1. Feed screen mounts with selected neighborhood
2. PostList loads initial posts via cursor query
3. User scrolls, PostList auto-fetches next page
4. User selects category filter, PostList re-queries
5. User taps PostCard, navigates to detail view

## Related

- `hooks/useFeedPosts.ts` — feed query with cursor pagination
- `hooks/usePostCategory.ts` — category filter state
- `src/app/(tabs)/index.tsx` — feed screen
