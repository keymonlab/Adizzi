# Components

<!-- Parent: ../AGENTS.md -->

React Native components for the Adizzi (어디찌) lost-and-found community app. All components consume hooks (never call services directly). Korean UI text throughout.

**Last updated:** 2026-03-17

## Overview

Components are organized by domain and follow a consistent pattern: consume typed props, call hooks for data/mutations, render React Native views. No web DOM — all views use `react-native` primitives.

### Architecture

- **Hooks as API**: Components call `use*` hooks from `/hooks/` (e.g., `useComments`, `useAuth`), not services directly.
- **Typed props**: Every component declares explicit `Props` interfaces.
- **StyleSheet**: All components use `react-native` StyleSheet for consistent performance.
- **Constants**: Layout (`Spacing`, `BorderRadius`, `FontSize`), colors (`Colors`), and categories (`CATEGORIES`, `getCategoryIcon`) imported from `/constants/`.

---

## Domain Directories

### [auth/](auth/) — Authentication UI

Components for login and account onboarding (pre-authenticated flow).

| Component | Purpose |
|-----------|---------|
| **HandleInput** | Text input for username (@handle). Validates handle format. |
| **SocialLoginButton** | OAuth provider button (Kakao, Google). Configurable provider, loading state, disabled state. |

**Key props**:
- `SocialLoginButton`: `provider` (kakao \| google), `onPress`, `loading`, `disabled`

**Usage**: Authentication flow in `src/app/(auth)/`

---

### [comments/](comments/) — Post Comments

Components for displaying and managing comments with mention support.

| Component | Purpose |
|-----------|---------|
| **CommentInput** | Textarea for new comments. Handles @mentions with autocomplete suggestions. Enforces max length. |
| **CommentList** | Paginated FlatList of comments. Delete button for own comments. Render mentions in styled text. Long-press to report (non-own comments). |
| **MentionSuggestions** | Dropdown of suggested user handles for @mention autocomplete. |

**Key props**:
- `CommentInput`: `postId`, `onSubmit`, `placeholder`, `maxLength`
- `CommentList`: `postId`, `onReportComment` callback
- `MentionSuggestions`: `query`, `onSelect`, `visible`

**Hooks used**:
- `useComments(postId)` — fetch + paginate
- `useDeleteComment()` — mutate
- `useAuth()` — current user for ownership check

---

### [feed/](feed/) — Post Feed

Components for browsing and filtering posts in the main feed.

| Component | Purpose |
|-----------|---------|
| **CategoryFilter** | Horizontal scrollable tabs: "전체" (all) + category icons. Active tab highlighted. |
| **PostCard** | Card displaying post thumbnail, title, author handle, category, location, metadata (time, comment count). Status badge in corner. Tap to navigate to detail. |
| **PostList** | FlatList wrapper for posts with pagination, pull-to-refresh, empty state. |
| **PostStatusBadge** | Small badge: "활성" (active, green) or "해결됨" (resolved, grayed out). |

**Key props**:
- `CategoryFilter`: `selectedCategory`, `onSelect`
- `PostCard`: `post: PostWithAuthor`, `onPress`
- `PostList`: `posts`, `onLoadMore`, `onRefresh`, `loading`
- `PostStatusBadge`: `status: 'active' \| 'resolved'`

**Hooks used**:
- `usePosts()` — fetch feed posts
- Indirectly through `useAuth()` for neighborhood scope

---

### [map/](map/) — Map Display

Components for rendering posts on an interactive map.

| Component | Purpose |
|-----------|---------|
| **MapView** | Platform-aware map: Kakao Maps (web) via custom HTML overlays, react-native-maps (iOS/Android). Renders post markers with category emoji. Selected marker is larger with a dot indicator. Tap marker to view post. |
| **MiniCard** | Small info card shown on marker tap (mobile). Displays post title, author, category icon, location snippet. |
| **PostMarker** | Circular marker with category emoji. Border color indicates status (active/resolved). Selected markers larger. |

**Key props**:
- `MapView`: `posts`, `initialRegion`, `selectedPostId`, `onMarkerPress`
- `MiniCard`: `post`, `onPress`
- `PostMarker`: `post`, `selected`, `onPress`

**Notes**:
- Web uses Kakao Maps JS SDK (requires `EXPO_PUBLIC_KAKAO_JS_KEY` in env).
- Native uses `react-native-maps` (requires platform-specific setup).
- WKT parser converts PostGIS `POINT(lng lat)` to coordinates.

---

### [notifications/](notifications/) — Push Notifications

Components for notification badge and notification history.

| Component | Purpose |
|-----------|---------|
| **NotificationBadge** | Red badge with unread count, displayed on tab icon or header. Hidden if count is 0. |
| **NotificationItem** | Row displaying one notification: type icon, title, timestamp, read status. Tap to navigate to referenced post or action. |

**Key props**:
- `NotificationBadge`: `count`
- `NotificationItem`: `notification`, `onPress`

**Hooks used**:
- `useNotifications()` — fetch + paginate
- `useMarkNotificationAsRead()` — mutate
- `useUnreadNotificationCount()` — for badge

---

### [post/](post/) — Create/Edit Post

Components for creating a new post or claiming an item (verification flow).

| Component | Purpose |
|-----------|---------|
| **CategoryPicker** | Modal or dropdown to select post category (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other). Shows category label + emoji. |
| **ClaimButton** | Primary CTA for claiming a post. Handles no-question flow (instant) and verification-question flow (modal). Shows status: "발견 확인" (found), "제 물건이에요!" (lost claim). Tracks failed attempts (max 3). Displays "다시 시도하기" for retries. |
| **ImagePicker** | Wrapper around native image picker. Selects multiple images from camera roll or camera. Uploads to Supabase storage. Shows upload progress. |
| **ImageSlider** | Horizontal FlatList of post images with dots pagination indicator. |
| **LocationPicker** | Map-based location selector or address input with autocomplete (reverse geocoding). Shows selected location on map and in text field. |
| **VerificationForm** | Form for setting a verification question/answer when creating a lost post. Input for question text and SHA-256 hashed answer. |

**Key props**:
- `CategoryPicker`: `selected`, `onSelect`, `visible`
- `ClaimButton`: `post: PostWithAuthor`, `userId`
- `ImagePicker`: `onImagesSelected`, `maxImages`
- `ImageSlider`: `imageUrls`
- `LocationPicker`: `initialLocation`, `onLocationSelect`
- `VerificationForm`: `onQuestionChange`, `onAnswerChange`

**Hooks used**:
- `useMyClaimForPost(postId, userId)` — check claim status
- `useSubmitClaim()` — submit answer and verify
- `useCreatePost()`, `useUpdatePost()` — post mutations
- `useUploadImages()` — image upload
- `useLocationSearch()` — reverse geocoding

---

### [ui/](ui/) — Reusable UI Components

Generic, domain-agnostic components used throughout the app.

| Component | Purpose |
|-----------|---------|
| **Avatar** | Circular image or initials fallback. Sizes: sm, md, lg. Loads from `uri` or displays name initials. |
| **Badge** | Colored label: primary, secondary, success, danger. Compact inline indicator. |
| **Button** | Primary CTA button. Variants: primary, secondary, outline, danger. Sizes: sm, md, lg. Loading spinner, disabled state. |
| **Card** | Surface container with rounded corners and shadow. Generic wrapper for grouped content. |
| **EmptyState** | Centered placeholder view: icon, title, description. Used when list is empty or no results. |
| **ErrorBoundary** | Error catch boundary. Displays error message or recovery button. Prevents app crashes on render errors. |
| **Input** | Text/multiline input field. Optional label, placeholder, error text. Focus state styling. |
| **LoadingSpinner** | Centered ActivityIndicator with optional text. Shows while data is loading. |
| **NetworkError** | Error state view for failed network requests. Displays error message and retry button. |

**Key props**:
- `Avatar`: `uri`, `name`, `size: 'sm' \| 'md' \| 'lg'`
- `Badge`: `label`, `variant`, `size`
- `Button`: `title`, `onPress`, `variant`, `size`, `loading`, `disabled`
- `Card`: `children`, `style`
- `EmptyState`: `icon`, `title`, `description`
- `Input`: `label`, `placeholder`, `value`, `onChangeText`, `error`, `multiline`, `maxLength`
- `LoadingSpinner`: `text`
- `NetworkError`: `error`, `onRetry`

**Theme**: All UI components respect `Colors` and `layout` constants for consistent theming.

---

## Key Patterns

### 1. Hook-First Data Fetching

Components never import services. Always use hooks:

```typescript
// ❌ Wrong
import { fetchComments } from '@/services/comments.service';

// ✅ Correct
import { useComments } from '@/hooks/useComments';

export function CommentList({ postId }: Props) {
  const { comments, isLoading } = useComments(postId);
  // ...
}
```

### 2. Typed Props & Return Types

Every component declares an explicit `Props` interface:

```typescript
interface PostCardProps {
  post: PostWithAuthor;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  // ...
}
```

### 3. StyleSheet for Performance

Always use `StyleSheet.create()`. Never inline object styles:

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
});
```

### 4. Platform-Aware Conditionals

Use `Platform.OS` for web-specific behavior:

```typescript
if (Platform.OS === 'web') {
  // Kakao Maps JS SDK
  return <WebMapView {...props} />;
}

// react-native-maps
return <RNMapView {...props} />;
```

### 5. Korean UI Text

All user-facing text is in Korean. Use locale constants where possible:

```typescript
<Text>{post.post_type === 'lost' ? '찾았어요!' : '제 물건이에요!'}</Text>
```

### 6. State Lifting for Shared State

Keep shared state (e.g., selected post ID, active category filter) in parent screens, pass down as props:

```typescript
export function FeedScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  return (
    <>
      <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
      <PostList category={selectedCategory} />
    </>
  );
}
```

---

## File Organization

```
src/components/
├── auth/                    # Login, onboarding
│   ├── HandleInput.tsx
│   └── SocialLoginButton.tsx
├── comments/                # Post comments & mentions
│   ├── CommentInput.tsx
│   ├── CommentList.tsx
│   └── MentionSuggestions.tsx
├── feed/                    # Post feed & filtering
│   ├── CategoryFilter.tsx
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   └── PostStatusBadge.tsx
├── map/                     # Map rendering
│   ├── MapView.tsx
│   ├── MiniCard.tsx
│   └── PostMarker.tsx
├── notifications/           # Push notification UI
│   ├── NotificationBadge.tsx
│   └── NotificationItem.tsx
├── post/                    # Create/edit/claim posts
│   ├── CategoryPicker.tsx
│   ├── ClaimButton.tsx
│   ├── ImagePicker.tsx
│   ├── ImageSlider.tsx
│   ├── LocationPicker.tsx
│   └── VerificationForm.tsx
├── ui/                      # Generic UI primitives
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── Input.tsx
│   ├── LoadingSpinner.tsx
│   └── NetworkError.tsx
└── AGENTS.md                # This file
```

---

## Import Aliases

Use path alias `@/` (maps to `src/`) for all imports:

```typescript
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import type { PostWithAuthor } from '@/services/posts.service';
```

---

## Testing Components

Components should be testable:

1. **Props are pure inputs** — no side effects in component body.
2. **Hooks are mocked** — in tests, mock `useAuth()`, `useComments()`, etc.
3. **Snapshots** — use for structural regression detection.
4. **Integration** — test component + hook together in E2E tests.

Example test:

```typescript
it('renders post card with correct data', () => {
  const post: PostWithAuthor = { /* ... */ };
  const onPress = jest.fn();

  render(<PostCard post={post} onPress={onPress} />);

  expect(screen.getByText(post.title)).toBeTruthy();
  fireEvent.press(screen.getByText(post.title));
  expect(onPress).toHaveBeenCalled();
});
```

---

## Common Tasks

### Add a new UI component

1. Create file in `src/components/ui/{ComponentName}.tsx`.
2. Define `Props` interface.
3. Use `StyleSheet.create()` for styles.
4. Export as named export.
5. Test with preview in Storybook (if available).

### Use a component in a screen

```typescript
import { Button } from '@/components/ui/Button';

export default function MyScreen() {
  return <Button title="Press me" onPress={() => alert('Clicked')} />;
}
```

### Handle loading/error states

```typescript
const { data: posts, isLoading, error } = usePosts();

if (isLoading) return <LoadingSpinner text="불러오는 중..." />;
if (error) return <NetworkError error={error} onRetry={refetch} />;
return <PostList posts={posts} />;
```

---

## Environment Variables

Components may reference:

- `EXPO_PUBLIC_SUPABASE_URL` — API endpoint (used in hooks)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — public anon key (used in hooks)
- `EXPO_PUBLIC_KAKAO_REST_API_KEY` — Kakao Maps reverse geocoding
- `EXPO_PUBLIC_KAKAO_JS_KEY` — Kakao Maps web SDK (prefer over REST key)

Store in `.env.local` (not checked in).

---

## Further Reading

- **Hooks**: See `/src/hooks/` for data layer (useAuth, useComments, usePosts, etc.)
- **Constants**: See `/src/constants/` for colors, layout, categories
- **Services**: See `/src/services/` for raw Supabase queries (not used by components directly)
- **Architecture**: See top-level `/CLAUDE.md` for app overview
