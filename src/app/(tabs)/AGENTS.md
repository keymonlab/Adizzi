<!-- Parent: ../AGENTS.md -->
# (tabs) — Main App Navigation

Main app tab screens after authentication. Tab bar: 홈/지도/등록/알림/프로필 (emoji icons).

## Files

### _layout.tsx
Tabs navigator with NotificationsTabIcon (shows unreadCount badge). Tab options: Home (🏠), Map (🗺️), Create (➕), Notifications (🔔), Profile (👤). Uses `useUnreadCount(user?.id)` to drive badge.

### index.tsx (Home/Feed)
Shows posts in user's neighborhood with cursor-based pagination. CategoryFilter dropdown selects post type (lost/found/all). Calls `usePosts(neighborhood_id, selectedCategory)` with infinite scroll. Routes to post detail on press.

### map.tsx
Kakao Maps display with post markers. Pins show lost/found posts in neighborhood. Marker click opens post detail. Calls `usePost()` for position data.

### create.tsx
Form to create lost/found post. Fields: title, description, category, images (picker), post_type toggle (lost/found). Calls mutation `useCreatePost()`. Uploads images to Supabase storage, stores URLs in post. Routes to feed on success.

### notifications.tsx
Infinite scrolled list of notifications (push/in-app). Mark as read, dismiss. Calls `useNotifications()` and `useMutation` for markAsRead/delete.

### profile.tsx
User's own posts, contact info, settings link. Avatar, display_name, handle. Lists user's posts via `usePosts(userId)`. Routes to settings (edit-profile, neighborhood, contacts, lost-alerts).

## Key Hooks

- `usePosts(neighborhoodId, category?)` — cursor-based pagination, returns {posts, fetchNextPage, hasNextPage}
- `useCreatePost()` — mutation for new post
- `useNotifications()` — notification list
- `useUnreadCount(userId)` — unread badge count

Updated: 2026-03-17
