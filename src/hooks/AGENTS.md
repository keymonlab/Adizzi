<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/hooks

React Query wrappers around services. Components consume these hooks exclusively—never call services directly.

## Purpose

Provide composable, data-fetching hooks with built-in caching, pagination, and mutation handling via TanStack React Query. Each hook wraps a service layer, abstracting Supabase operations and providing a declarative API for components.

## Key Files

| File | Purpose |
|------|---------|
| `useAuth.ts` | Authentication state and session management |
| `useClaims.ts` | Fetch, create, verify claim mutations |
| `useComments.ts` | Post comments with pagination |
| `useImageUpload.ts` | Image upload to Supabase Storage |
| `useLocation.ts` | Reverse geocoding and location lookup |
| `useLostAlerts.ts` | Subscribe to and manage lost-item alerts |
| `useMentionSearch.ts` | Search users by mention (@) queries |
| `useMyPosts.ts` | User's own posts (created, claimed) |
| `useNeighborhood.ts` | Current neighborhood and location verification |
| `useNotifications.ts` | Push notification state and registration |
| `usePost.ts` | Single post fetch with realtime updates |
| `usePosts.ts` | Feed posts with cursor-based pagination |

## For AI Agents

**Patterns used:**
- All hooks use React Query `useQuery` for fetching, `useMutation` for writes
- Pagination via cursor-based approach: `(created_at, id)` composite cursors
- Realtime hooks subscribe to Supabase `on('*')` channels, unsubscribe on cleanup
- Error handling propagates from services; caller decides error UI

**When adding hooks:**
1. Create service function first (never import service directly in components)
2. Wrap with `useQuery` or `useMutation` using consistent key patterns
3. Handle loading, error, and success states
4. For paginated data, implement cursor-based `hasNextPage` / `fetchNextPage`
5. Test with stale-while-revalidate behavior

**Component consumption pattern:**
```typescript
const { data, isLoading, error } = usePost(postId);
const { mutate: claimPost } = useClaims();
```

## Dependencies

- `@tanstack/react-query` (data fetching, caching)
- Supabase client (via context or direct import)
- Services layer (all fetch logic delegated)
- React Native (hooks compatibility)
