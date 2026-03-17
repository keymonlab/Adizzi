<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/services

Raw Supabase query functions that return typed data. Never imported directly by components—only by hooks.

## Purpose

Encapsulate all Supabase database and edge function calls in a typed service layer. Services handle query building, error handling, and data transformation; hooks wrap these services for caching and state management.

## Key Files

| File | Purpose |
|------|---------|
| `auth.service.ts` | Sign up, login, logout, password reset, session management |
| `claims.service.ts` | Create claims, verify answers, check claim status |
| `comments.service.ts` | Add, fetch, delete post comments with pagination |
| `contacts.service.ts` | Sync phone contacts, compute hashes for friend matching |
| `lost-alerts.service.ts` | Create, update, delete lost-item alerts; manage subscriptions |
| `neighborhoods.service.ts` | Fetch neighborhoods by location, verify user neighborhood |
| `notifications.service.ts` | Store push token, delete token, send test notifications |
| `posts.service.ts` | Create, fetch, update, delete posts; handle image uploads |
| `reports.service.ts` | Report posts or comments for abuse/spam |
| `users.service.ts` | Fetch user profile, update profile, manage blocked users |

## For AI Agents

**Patterns used:**

- All functions are async and return typed data or throw errors
- Supabase queries use `.throwOnError()` to surface failures
- Soft-delete filter: always check `.is('deleted_at', null)` for posts/comments
- Pagination: cursor-based using `(created_at, id)` composite cursors
- Data transformation happens here (e.g., hashing, formatting) before return
- Edge functions called via `.rpc()` (e.g., `verify-claim`, `match-lost-alerts`)

**Example service function:**
```typescript
export async function fetchPosts(
  supabase: SupabaseClient,
  limit: number = 20,
  cursor?: string
) {
  const query = supabase
    .from('posts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (cursor) {
    const [createdAt, id] = cursor.split('_');
    query.lt('created_at', createdAt).lt('id', id);
  }

  return query.limit(limit).throwOnError();
}
```

**When adding new services:**
1. Define request/response types in `src/types/`
2. Accept `SupabaseClient` as first parameter (for testability)
3. Return typed data; throw errors for failures
4. Use consistent query builder patterns
5. Test with both success and error cases

## Dependencies

- `@supabase/supabase-js` (SupabaseClient type)
- Types from `src/types/database.types.ts`
- Supabase libraries (`lib/supabase.ts`)
