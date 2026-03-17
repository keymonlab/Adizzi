<!-- Parent: ../AGENTS.md -->

# src/components/map

Map display components with platform-aware implementations.

**Last updated:** 2026-03-17

## Components

### MapView.tsx
Kakao Maps on web, react-native-maps on native. Displays posts as markers.

- Web: Kakao Maps SDK (HTML canvas)
- Native (iOS/Android): `react-native-maps` with custom styling
- Renders all neighborhood posts as markers
- Filters posts by category and location bounds
- On marker tap, shows MiniCard preview

### PostMarker.tsx
Map pin for individual post location.

- Custom marker image (lost=orange, found=green, claimed=gray)
- Tap gesture shows post preview
- Animated bounce on first render

### MiniCard.tsx
Compact post preview on map marker tap.

- Thumbnail image, category, title, status
- "View Details" button navigates to post
- Dismissible with swipe or tap outside

## Platform differences

| Web | Native |
|-----|--------|
| Kakao Maps SDK | react-native-maps |
| Mouse click events | Tap/gesture handlers |
| HTML canvas | Native MapKit (iOS), Google Maps (Android) |

## Data flow

1. Map screen mounts
2. MapView loads neighborhood posts
3. Renders PostMarker for each post location
4. User taps marker
5. MiniCard appears with preview
6. User taps "View Details" or navigates to post detail

## Related

- `hooks/useMapPosts.ts` — fetch posts for current map bounds
- `src/app/(tabs)/map.tsx` — map screen
- `services/posts.service.ts` — post location queries
