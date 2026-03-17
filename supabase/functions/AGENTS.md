<!-- Parent: ../AGENTS.md -->

# Supabase Edge Functions

Timestamp: 2026-03-17

Deno-based serverless functions deployed to Supabase. Each function handles a specific backend task for the Adizzi lost-and-found app.

## Overview

All functions:
- Use Deno runtime (not Node.js)
- Require `SUPABASE_SERVICE_ROLE_KEY` or JWT authentication via Authorization header
- Return JSON responses with appropriate HTTP status codes
- Handle CORS preflight OPTIONS requests
- Deployed with `supabase functions deploy`

## Functions

### match-lost-alerts

**Path**: `match-lost-alerts/index.ts`

Matches newly created posts against user lost alert subscriptions based on category and keywords.

**Trigger**: Called by the `posts` trigger when a new post is created.

**Request**:
```typescript
POST /functions/v1/match-lost-alerts
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
Content-Type: application/json

{
  "post_id": "uuid"
}
```

**Logic**:
1. Fetch the post by ID (must exist and have not been deleted)
2. Query `lost_alerts` table for active alerts in the same neighborhood and category
3. Filter alerts where any keyword matches post title or description (case-insensitive)
4. Create notifications in the `notifications` table for matching alert owners (excluding post author)
5. Invoke `send-push` function to send push notifications
6. Return count of matched alerts and notifications sent

**Response**:
```json
{
  "matched": 2,
  "notified": 2
}
```

**Error Cases**:
- `405` — Method not allowed (must be POST)
- `401` — Unauthorized (missing or invalid service role key)
- `400` — Invalid post_id in request body
- `404` — Post not found
- `500` — Database or Expo Push API failure

---

### send-push

**Path**: `send-push/index.ts`

Sends push notifications to users via Expo Push Service. Called by other functions or the app backend.

**Request**:
```typescript
POST /functions/v1/send-push
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
Content-Type: application/json

{
  "recipient_ids": ["uuid1", "uuid2"],
  "title": "분실물 알림 매칭",
  "body": "\"신발\" 게시물이 회원님의 분실물 알림과 일치합니다.",
  "data": {
    "type": "lost_alert_match",
    "post_id": "uuid"
  }
}
```

**Logic**:
1. Validate service role key via Authorization header
2. Fetch `push_token` from `users` table for each recipient ID
3. Filter out null/empty tokens
4. Build Expo messages and send to Expo Push API
5. Count successful vs. failed deliveries
6. Return results

**Response**:
```json
{
  "sent": 2,
  "failed": 0,
  "total": 2
}
```

**Error Cases**:
- `405` — Method not allowed
- `401` — Unauthorized
- `400` — Invalid or missing required fields (recipient_ids must be non-empty array, title/body required)
- `500` — Database query error or Expo API failure

**Notes**:
- Returns 200 with `sent: 0` if no valid push tokens found (not an error)
- Expo API response includes ticket status (`ok` or `error`) for each message

---

### sync-contacts

**Path**: `sync-contacts/index.ts`

Privacy-preserving phone contact synchronization using HMAC-SHA256 hashes.

**Request**:
```typescript
POST /functions/v1/sync-contacts
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "contacts": [
    { "phone": "010-1234-5678", "name": "Alice" },
    { "phone": "010-9876-5432", "name": "Bob" }
  ]
}
```

**Logic**:
1. Verify JWT via anon client (extract user ID from `auth.getUser()`)
2. Normalize phone numbers (Korean 010 → +82, clean formatting)
3. Hash each phone with HMAC-SHA256 using `HMAC_SECRET_KEY` (from env)
4. Query `phone_hashes` table for matching hashes
5. Upsert matches into `contacts_matches` table (excluding self)
6. Fetch matched user profiles from `users` table
7. Return list of matched users with contact names

**Response**:
```json
{
  "matches": [
    {
      "user_id": "uuid",
      "display_name": "Alice",
      "handle": "@alice",
      "avatar_url": "https://...",
      "contact_name": "Alice"
    }
  ]
}
```

**Error Cases**:
- `405` — Method not allowed
- `401` — Missing/invalid Authorization header or JWT
- `400` — contacts not an array, empty array, or exceeds 500 items
- `500` — Database query or upsert failure

**Constraints**:
- Max 500 contacts per sync (enforced)
- Each contact requires `phone` and `name` strings
- Phone normalization handles Korean (+82) and standard formats

**Environment Variables**:
- `HMAC_SECRET_KEY` — Secret for HMAC-SHA256 hashing (must be kept secure)

---

### verify-claim

**Path**: `verify-claim/index.ts`

Verifies claim answers using SHA-256 hash comparison. Max 3 failed attempts per claim.

**Request**:
```typescript
POST /functions/v1/verify-claim
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "post_id": "uuid",
  "answer": "correct answer"
}
```

**Logic**:
1. Verify JWT via anon client (extract claimant user ID)
2. Fetch post (must exist, not deleted) and check verification question + hashed answer
3. Check existing claim for this user + post
   - If verified already: return 400 "Already verified"
   - If 3+ failed attempts: return 403 "Maximum attempts exceeded"
4. **No verification question**: Mark claim as pending, notify post author, return pending status
5. **Has verification question**: Compare normalized answer (trimmed, lowercase) against hash
   - If matches: Mark claim as verified, notify post author
   - If no match: Increment failed attempts, return remaining attempts (max 3 total)

**Response (Verified)**:
```json
{
  "status": "verified",
  "message": "Answer matched. Claim verified."
}
```

**Response (Pending)**:
```json
{
  "status": "pending",
  "message": "Claim submitted to post author"
}
```

**Response (Failed)**:
```json
{
  "error": "Answer does not match",
  "remaining_attempts": 2
}
```

**Error Cases**:
- `405` — Method not allowed
- `401` — Missing/invalid Authorization header or JWT
- `400` — Invalid post_id, answer required but post has verification question, or already verified
- `403` — Maximum 3 attempts exceeded
- `404` — Post not found
- `500` — Database upsert or notification failure

**Notes**:
- Uses string comparison (not cryptographic hash validation on answer)
- Stores `verification_answer_hash` directly in posts table for comparison
- Creates notifications for post author on both pending and verified states
- Claim record upserted to track status and failed attempts per user per post

---

## Deployment

Deploy all functions or specific ones:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy match-lost-alerts
supabase functions deploy send-push
supabase functions deploy sync-contacts
supabase functions deploy verify-claim
```

## Local Testing

Serve functions locally:

```bash
supabase functions serve
```

Then call via HTTP:

```bash
curl -X POST http://localhost:54321/functions/v1/match-lost-alerts \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"post_id":"12345"}'
```

## Environment Variables

Required in Supabase dashboard under **Edge Functions > Environment Variables**:

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (highly sensitive)
- `SUPABASE_ANON_KEY` — Anon key for public client
- `HMAC_SECRET_KEY` — Secret for phone contact hashing (sync-contacts)

## Dependencies

All functions use ES modules from:
- `https://deno.land/std@0.177.0/` — Deno standard library
- `https://esm.sh/@supabase/supabase-js@2` — Supabase JS client
