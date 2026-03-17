<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# Supabase Directory Guide

This directory contains Adizzi's database schema, edge functions, and local development configuration.

## Directory Structure

| Path | Purpose |
|------|---------|
| `config.toml` | Supabase CLI configuration (ports, auth settings, functions path) |
| `seed.sql` | Database seed data (neighborhoods, test users, sample posts) |
| `full-migration.sql` | Combined schema (generated; use migrations/ instead) |
| `migrations/` | Sequential SQL migrations (ordered execution required) |
| `functions/` | Edge functions written in TypeScript/Deno |

## Migrations

Migrations must run **in numeric order**. Do not reorder or skip.

| File | Purpose |
|------|---------|
| `00001_enable_extensions.sql` | Enable PostGIS, UUID extensions |
| `00002_create_tables.sql` | Create all 9 tables: users, posts, comments, claims, notifications, lost_alerts, phone_hashes, contacts_matches, reports |
| `00003_create_indexes.sql` | Performance indexes on foreign keys, timestamps, location, text search |
| `00004_create_rls_policies.sql` | Row-level security (RLS) for all tables |
| `00005_create_functions.sql` | SQL helper functions (e.g., `match_keywords_to_post()`) |
| `00006_create_triggers.sql` | Triggers for `updated_at` timestamps and notifications |
| `00007_create_storage_buckets.sql` | Storage buckets for post images and avatars |
| `00008_fix_rls_recursion.sql` | RLS policy fixes to prevent recursive queries |
| `00009_add_post_type_and_categories.sql` | Add `post_type` (lost/found) column and expand categories |

### Running Migrations

**Reset to clean state:**
```bash
supabase db reset
```
This runs all migrations in order, then loads `seed.sql`.

**Start/stop local Supabase:**
```bash
supabase start      # Start local dev instance
supabase stop       # Stop local instance
```

**View current schema:**
```bash
supabase db pull    # Download schema from remote (if configured)
```

## Database Schema Overview

### Core Tables

**users**
- References `auth.users` (Supabase Auth)
- Fields: `handle`, `display_name`, `avatar_url`, `neighborhood_id`, `location_verified`, `push_token`
- RLS: Users see other users in same neighborhood only

**posts**
- Author-scoped to user via `author_id`
- Scoped to neighborhood via `neighborhood_id`
- Soft-delete: `deleted_at IS NULL` always required in queries
- Location: PostGIS `POINT(lng lat)` format
- Verification: `verification_question` + `verification_answer_hash` (SHA-256)
- Categories: shoes, toy, clothing, bag, electronics, wallet, keys, pet, other
- Post types: lost, found
- RLS: Users see posts from same neighborhood only

**claims**
- Link `post_id` (claimed item) to `claimant_id` (user claiming it)
- Tracking: `answer_hash` (verification answer), `status` (pending/verified/rejected), `failed_attempts` (max 3)
- Unique constraint: one claim per (post, claimant) pair

**comments**
- Associated with posts and authors
- Soft-delete: `deleted_at IS NULL` required
- Mentions: `mentions` UUID array for @-mentions
- RLS: Users see comments from posts in same neighborhood

**lost_alerts**
- User subscription to `category` + `keywords` within their neighborhood
- Edge function `match-lost-alerts` triggers on new posts
- Status: `active` boolean for enable/disable

**notifications**
- Recipient scoped: recipient_id
- Types: new_post, comment, mention, claim, resolved, lost_alert_match
- Triggers created on posts/comments/claims to auto-insert notifications

**phone_hashes**
- Privacy-preserving contact matching
- Stores SHA-256 hashes of phone numbers
- Used by edge function `sync-contacts` for friend discovery

**contacts_matches** & **reports**
- contacts_matches: matched phone contacts → users
- reports: user reports (abuse, spam, etc.)

### Key Constraints

- All timestamps use TIMESTAMPTZ (timezone-aware)
- Foreign keys use ON DELETE CASCADE (except neighborhoods, which use ON DELETE RESTRICT on posts)
- Soft-delete pattern: always filter `WHERE deleted_at IS NULL`
- PostGIS location: `SRID 4326` (WGS84 lat/lon), stored as `POINT(lng lat)`

## Row-Level Security (RLS)

RLS is **enabled on all tables**. Every query is filtered by the authenticated user's neighborhood.

### Key Policies

**users table**
- SELECT: Same neighborhood only
- UPDATE: Own row only

**posts table**
- SELECT: Not soft-deleted + same neighborhood
- INSERT: Authenticated user as author
- UPDATE: Author only (status changes)
- DELETE: Author only

**comments table**
- SELECT: Not soft-deleted + same neighborhood
- INSERT: Authenticated user as author
- UPDATE/DELETE: Author only

**claims table**
- SELECT: Post author or claimant can view
- INSERT: Authenticated user as claimant
- UPDATE: Post author (to verify/reject)

**notifications table**
- SELECT: Own notifications only
- UPDATE: Mark as read (own only)

**lost_alerts table**
- SELECT: Own alerts only
- INSERT/UPDATE/DELETE: Own alerts only

**phone_hashes table**
- INSERT: By authenticated user (via sync-contacts function)
- SELECT: Service-role only (never client-visible)

**contacts_matches table**
- SELECT: Service-role only (never client-visible)

### Testing RLS

```bash
# Connect as authenticated user (requires valid JWT)
supabase functions serve

# Check which rows are visible under RLS
SELECT * FROM posts;  -- Only same-neighborhood posts shown
```

## Edge Functions

All functions are in `functions/*/index.ts`. Deploy with `supabase functions deploy <name>`.

### match-lost-alerts

**Trigger**: When a new post is created
**Purpose**: Find matching lost alerts and create notifications

**Logic**:
1. Extract post `category` and keywords from `title` + `description`
2. Query `lost_alerts` where category matches + keywords overlap
3. Create notification for each matching user
4. Type: `lost_alert_match`

**Environment**: Uses SUPABASE_SERVICE_ROLE_KEY (server-to-server auth)

### send-push

**Trigger**: Called by notification creation (via HTTP)
**Purpose**: Send push notification to user's device

**Logic**:
1. Look up user's `push_token`
2. Call Expo notification API
3. Handle failures (invalid tokens)

**Environment**: EXPO_ACCESS_TOKEN required

### verify-claim

**Trigger**: When claimant submits verification answer
**Purpose**: Validate claim answer against hashed original

**Logic**:
1. Hash submitted answer with SHA-256
2. Compare to post's `verification_answer_hash`
3. Increment `failed_attempts` if wrong
4. Reject claim after 3 failures
5. Mark verified if correct, create notification

**Security**: Service role validates; client never sees original answer

### sync-contacts

**Trigger**: User initiates contact sync from phone
**Purpose**: Privacy-preserving friend matching

**Logic**:
1. Client sends hashed phone numbers
2. Function stores in `phone_hashes` table
3. Queries `contacts_matches` to find mutual matches
4. Returns matched user IDs (not full contact info)
5. No raw phone numbers ever stored

**Privacy**: Always hash on client; server never sees raw numbers

## For AI Agents: Working Patterns

### Adding a New Table

1. Create migration file: `00NNN_create_my_table.sql`
2. Define table with proper foreign keys and constraints
3. Add RLS policy in existing migration or new one
4. Add to `00003_create_indexes.sql` if indexed columns exist
5. Add triggers for `updated_at` if needed
6. Test: `supabase db reset`

### Adding a New Column

1. Create migration: `00NNN_add_column_to_table.sql`
2. Use `ALTER TABLE` with proper defaults
3. Test: `supabase db reset`

### Fixing RLS Issues

- Check `00004_create_rls_policies.sql` for policy definitions
- Remember: policies are cumulative (multiple policies on same table/action = OR logic)
- Test with: `supabase functions serve` → open Studio → test with different users
- If recursion error occurs: see `00008_fix_rls_recursion.sql` for patterns

### Debugging Queries

```bash
supabase start

# Connect to local DB
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run query as service role (no RLS)
SELECT * FROM posts;

# Or connect to Studio UI at http://localhost:54323
```

### Adding an Edge Function

1. Create directory: `functions/my-function/`
2. Add `index.ts` with `serve()` handler
3. Import from `https://deno.land/std/` and `https://esm.sh/`
4. Handle CORS preflight (`OPTIONS` requests)
5. Validate service role key if needed
6. Test: `supabase functions serve`
7. Deploy: `supabase functions deploy my-function`

### Location Queries

PostGIS format: `POINT(lng lat)` in SRID 4326 (WGS84).

```sql
-- Create point from lat/lng
SELECT ST_GeomFromText('POINT(' || lng || ' ' || lat || ')', 4326);

-- Distance in meters
SELECT ST_Distance(
  location::geography,
  ST_GeomFromText('POINT(' || search_lng || ' ' || search_lat || ')', 4326)::geography
) AS distance_m
FROM posts
WHERE neighborhood_id = $1
ORDER BY distance_m ASC;
```

## Configuration

### config.toml

- **API port**: 54321 (PostgREST)
- **DB port**: 54322 (PostgreSQL)
- **Studio port**: 54323 (UI)
- **Auth URL**: http://127.0.0.1:3000 (Expo dev server)
- **Functions**: Served from `supabase/functions/` directory
- **Storage**: 50 MiB file size limit

### Environment Variables

Required for edge functions:
- `SUPABASE_SERVICE_ROLE_KEY` — Service role secret (server-only)
- `EXPO_ACCESS_TOKEN` — For `send-push` function (Expo API)

## Common Tasks

### Reset Database
```bash
supabase db reset
# Runs all migrations in order, loads seed.sql
```

### Update Schema Locally
```bash
# Edit migration files, then:
supabase db reset
```

### View Database Changes
```bash
# Before:
supabase db pull

# After migration:
supabase db reset && supabase db pull
```

### Test a Query
```bash
supabase start
# Open Studio at http://localhost:54323
# Switch to authenticated user context
# Write and test query
```

### Add Test Data
Edit `seed.sql` and run:
```bash
supabase db reset
```

## Important Notes for Agents

- **Migration order matters**: Never reorder numbered files.
- **Always filter soft-deletes**: Use `WHERE deleted_at IS NULL` on posts, comments.
- **RLS is always on**: Queries from clients are automatically filtered by neighborhood.
- **Location format**: Use `POINT(lng lat)` not `POINT(lat lng)`.
- **Hashed answers**: Verification answers are SHA-256 hashed client-side before sending.
- **Service role auth**: Edge functions use service role for unrestricted DB access; always validate requests.
- **Push tokens**: Users can be without push_token; handle gracefully in `send-push`.
- **Categories**: As of 00009 migration, valid categories are: shoes, toy, clothing, bag, electronics, wallet, keys, pet, other.

## References

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- PostGIS Docs: https://postgis.net/docs/
- Deno Docs: https://deno.land/manual
- RLS Examples: https://supabase.com/docs/guides/auth/row-level-security
