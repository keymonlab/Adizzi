<!-- Parent: ../AGENTS.md -->

# Supabase Migrations

Timestamp: 2026-03-17

Sequential SQL migration files that define the Adizzi database schema. Migrations run in order and are tracked by Supabase to ensure idempotency.

## Overview

- **Sequential numbering**: `00001_`, `00002_`, etc. (5-digit zero-padded)
- **Order matters**: Always run migrations in order; never skip or reorder
- **Testing**: Run `supabase db reset` locally to apply all migrations + seed
- **Row Level Security (RLS)**: All tables have RLS enabled with policies
- **Soft deletes**: Posts and comments use `deleted_at` column; always filter with `.is('deleted_at', null)`

## Migrations

### 00001_enable_extensions.sql

Enables PostgreSQL extensions required by the app.

**Extensions**:
- `uuid-ossp` — Generate UUIDs
- `postgis` — Geospatial data (locations stored as `POINT(lng lat)`)
- `pgcrypto` — Cryptographic functions
- `moddatetime` — Auto-update `updated_at` timestamps

---

### 00002_create_tables.sql

Creates all core tables for the app.

**Tables**:

1. **neighborhoods** — Geographic boundaries for posts
   - `id` (UUID, PK)
   - `name`, `city`, `district` (TEXT)
   - `boundary` (GEOMETRY Polygon with SRID 4326)
   - `created_at` (TIMESTAMPTZ)

2. **users** — User profiles (references `auth.users`)
   - `id` (UUID, PK, FK to auth.users)
   - `handle` (TEXT UNIQUE)
   - `display_name`, `avatar_url` (TEXT)
   - `neighborhood_id` (FK to neighborhoods)
   - `location_verified` (BOOLEAN)
   - `push_token` (TEXT, for Expo push notifications)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

3. **posts** — Lost or found item posts
   - `id` (UUID, PK)
   - `author_id` (FK to users)
   - `neighborhood_id` (FK to neighborhoods)
   - `post_type` (ENUM: lost, found)
   - `category` (TEXT: shoes, toy, clothing, bag, electronics, wallet, keys, pet, other)
   - `title`, `description` (TEXT)
   - `location` (GEOMETRY POINT(lng lat))
   - `image_urls` (JSONB array of URLs)
   - `verification_question`, `verification_answer_hash` (TEXT, optional)
   - `is_resolved` (BOOLEAN)
   - `deleted_at` (TIMESTAMPTZ, soft delete)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

4. **comments** — User comments on posts
   - `id` (UUID, PK)
   - `post_id` (FK to posts)
   - `author_id` (FK to users)
   - `content` (TEXT)
   - `deleted_at` (TIMESTAMPTZ, soft delete)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

5. **claims** — Users claiming posts with verification flow
   - `id` (UUID, PK)
   - `post_id` (FK to posts)
   - `claimant_id` (FK to users)
   - `status` (ENUM: pending, verified, rejected)
   - `failed_attempts` (INT, max 3)
   - `created_at`, `updated_at` (TIMESTAMPTZ)
   - Composite unique: `(post_id, claimant_id)`

6. **notifications** — Activity feed notifications
   - `id` (UUID, PK)
   - `recipient_id` (FK to users)
   - `actor_id` (FK to users, who triggered the notification)
   - `type` (ENUM: lost_alert_match, claim, comment, post)
   - `post_id` (FK to posts, optional)
   - `read` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

7. **lost_alerts** — User subscriptions to lost item alerts
   - `id` (UUID, PK)
   - `user_id` (FK to users)
   - `neighborhood_id` (FK to neighborhoods)
   - `category` (TEXT)
   - `keywords` (JSONB array of keyword strings)
   - `active` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

8. **phone_hashes** — Hashed phone numbers for privacy-preserving contact matching
   - `id` (UUID, PK)
   - `user_id` (FK to users)
   - `phone_hash` (TEXT, HMAC-SHA256 hash)
   - `created_at` (TIMESTAMPTZ)

9. **contacts_matches** — Matched contacts from sync-contacts function
   - `id` (UUID, PK)
   - `user_id` (FK to users, who synced)
   - `matched_user_id` (FK to users, contact match)
   - `contact_name` (TEXT, original contact name)
   - `updated_at` (TIMESTAMPTZ)
   - Composite unique: `(user_id, matched_user_id)`

10. **reports** — Post/comment reports for moderation
    - `id` (UUID, PK)
    - `post_id` (FK to posts, optional)
    - `comment_id` (FK to comments, optional)
    - `reporter_id` (FK to users)
    - `reason` (TEXT)
    - `status` (ENUM: pending, reviewed, dismissed)
    - `created_at`, `updated_at` (TIMESTAMPTZ)

---

### 00003_create_indexes.sql

Performance indexes for common queries.

**Indexes**:
- `posts` on `(neighborhood_id, created_at DESC, id DESC)` — Feed pagination
- `posts` on `(author_id)` — User posts
- `comments` on `(post_id, created_at)` — Post comments
- `claims` on `(post_id)` — Post claims
- `notifications` on `(recipient_id, created_at DESC)` — User notifications
- `lost_alerts` on `(user_id)` — User alerts
- `phone_hashes` on `(phone_hash)` — Contact matching
- `contacts_matches` on `(user_id, matched_user_id)` — Matched contacts

---

### 00004_create_rls_policies.sql

Row Level Security (RLS) policies restrict data access.

**Key policies**:
- **users**: Select own profile, view public profiles in same neighborhood
- **posts**: Select own, select in same neighborhood, create in verified neighborhood only
- **comments**: Select all in same neighborhood, create own, delete own
- **claims**: Select own, create own, select post author can view all
- **notifications**: Select own only
- **lost_alerts**: Select own, create own, delete own
- **phone_hashes**: Select own, insert own
- **contacts_matches**: Select own, upsert via service role (from sync-contacts function)
- **reports**: Create own, admins can view all

RLS is enabled on all tables. Service role key bypasses RLS.

---

### 00005_create_functions.sql

Database functions for business logic.

**Functions**:
- Utility functions for common queries (pagination helpers, aggregate functions)
- Search functions for posts (keyword search, category filter)

---

### 00006_create_triggers.sql

Triggers for automatic actions.

**Triggers**:
- `update_posts_updated_at` — Auto-update `posts.updated_at` on row change
- `update_users_updated_at` — Auto-update `users.updated_at` on row change
- `update_comments_updated_at` — Auto-update `comments.updated_at` on row change
- `update_claims_updated_at` — Auto-update `claims.updated_at` on row change
- `update_lost_alerts_updated_at` — Auto-update `lost_alerts.updated_at` on row change
- `update_notifications_updated_at` — Auto-update `notifications.updated_at` on row change
- `on_posts_insert` — Invoke `match-lost-alerts` function when new post created (only for `post_type = 'found'`)
- `on_claims_update` — Update `posts.is_resolved = true` when a claim is verified

---

### 00007_create_storage_buckets.sql

Supabase Storage buckets for image uploads.

**Buckets**:
- **post-images** — Post thumbnail and detail images
  - Policy: Users can upload to own posts only
  - Policy: Anyone can view (public read)

---

### 00008_fix_rls_recursion.sql

Fixes RLS policy recursion issues (common in Supabase self-referential queries).

**Changes**: Adjusts policies on tables with self-referential foreign keys (e.g., notifications, claims).

---

### 00009_add_post_type_and_categories.sql

Adds `post_type` enum and categories to posts table.

**Enum values**:
- `post_type`: `'lost'`, `'found'`

**Categories** (used in category filter):
- `shoes`, `toy`, `clothing`, `bag`, `electronics`, `wallet`, `keys`, `pet`, `other`

---

## Writing New Migrations

### Naming Convention

```
XXXXXX_description_in_snake_case.sql
```

Example: `00010_add_ratings_table.sql`

### Template

```sql
-- Brief description of changes

-- 1. Create new table or modify existing
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- columns...
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own" ON new_table
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Add index if needed
CREATE INDEX idx_new_table_user_id ON new_table(user_id);

-- 4. Add trigger if needed (e.g., update timestamps)
CREATE TRIGGER update_new_table_updated_at
    BEFORE UPDATE ON new_table
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at);
```

### Best Practices

1. **Always enable RLS** on new tables
2. **Always use composite keys** for junction tables (e.g., `(user_id, item_id)`)
3. **Always add timestamps**: `created_at` (immutable), `updated_at` (auto-updated via trigger)
4. **Test locally**: `supabase db reset` before pushing
5. **Idempotent DDL**: Use `IF NOT EXISTS`, `IF EXISTS` to handle reruns
6. **Document foreign keys**: Always add ON DELETE clauses (CASCADE, SET NULL, RESTRICT)
7. **Soft deletes**: Use `deleted_at TIMESTAMPTZ` for audit trails, filter with `.is('deleted_at', null)` in queries

---

## Testing Migrations

Reset the local database and run all migrations + seed:

```bash
supabase db reset
```

This will:
1. Drop all tables
2. Run all migrations in order
3. Load seed data from `seed.sql`

---

## Troubleshooting

**Migration fails**: Check `supabase log` for error details
**Constraint violations**: Ensure foreign key order (parent tables first)
**RLS blocks queries**: Check that policies allow the authenticated user's role
**Performance issues**: Add indexes from `00003_create_indexes.sql` or create new ones
