<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/types

TypeScript type definitions for the app, database schema, and navigation.

## Purpose

Provide centralized, type-safe definitions for all app entities. Ensures type consistency across services, hooks, and components. Database types are manually maintained (not auto-generated from Supabase).

## Key Files

| File | Purpose |
|------|---------|
| `app.types.ts` | App-level types (User, Post, Claim, Comment, etc.) |
| `database.types.ts` | Manually maintained Supabase DB schema types (NOT auto-generated) |
| `navigation.types.ts` | Route and navigation types for Expo Router |

## For AI Agents

**Important: `database.types.ts` is manually maintained.**

Do NOT use Supabase's auto-generation tool. Instead:
1. When the database schema changes, manually update `database.types.ts`
2. Match the Supabase database exactly (table names, column names, types)
3. Use Supabase TypeScript type syntax for consistency

**Type organization:**

- **`app.types.ts`**: Public-facing types used throughout the app
  - `User` — authenticated user with profile
  - `Post` — lost/found item listing with category, location, images
  - `Claim` — user's claim attempt on a post
  - `Comment` — post comment with soft-delete support
  - `LostAlert` — category+keyword subscription
  - `Neighborhood` — geographic area scoped by coordinates

- **`database.types.ts`**: Maps directly to Supabase tables
  - `Tables` — all table row types
  - `Enums` — database enums (e.g., `post_type`, `category`)
  - `Views` — any materialized views or query definitions
  - `Functions` — edge function argument and return types

- **`navigation.types.ts`**: Expo Router types
  - Route parameters (e.g., `{ postId: string }`)
  - Stack navigation types
  - Deep linking types

**When adding new types:**
1. First add to `database.types.ts` if it's a new table/column
2. Create app-level wrapper in `app.types.ts` if needed
3. Use strict `null` vs `undefined` semantics
4. Document complex fields with JSDoc comments

**Example:**
```typescript
// database.types.ts
export interface Tables {
  posts: {
    Row: {
      id: string;
      user_id: string;
      post_type: 'lost' | 'found';
      category: PostCategory;
      location: string; // PostGIS WKT: POINT(lng lat)
      created_at: string;
      deleted_at: string | null;
    };
  };
}

// app.types.ts
export interface Post extends Database['public']['Tables']['posts']['Row'] {
  // Can add computed fields here
}
```

## Dependencies

- TypeScript (strict mode enabled)
- Supabase TypeScript types (for reference)
