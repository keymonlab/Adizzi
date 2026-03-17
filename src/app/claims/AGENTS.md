<!-- Parent: ../AGENTS.md -->
# claims — Ownership Verification Management

Dynamic route `/claims/[postId]` for post owners to review and approve/reject claim attempts.

## Files

### [postId].tsx
List all claims for a post. Post summary (thumbnail, title, status badge) at top. Claims count header. ClaimCard for each claim shows: claimant avatar/name/handle, status badge (pending/verified/rejected), timestamp, and action buttons (approve/reject) for pending claims only.

Approve/Reject flow: confirmation Alert → mutation call → post status transitions to "resolved". `useClaimsForPost(postId)` fetches claims, `useApproveClaim()` and `useRejectClaim()` perform mutations.

Empty state (📭) if no claims. LoadingSpinner on data fetch.

## Sections

1. Header — back button, title "소유 요청 관리"
2. Post summary card — thumbnail, title, status
3. Claims count label
4. Claims list or empty state
5. ClaimCard repeated:
   - Claimant info (avatar, name, handle)
   - Status badge (color-coded)
   - Verification match indicator (verified claims only)
   - Timestamp
   - Action buttons (pending only)

## Key Hooks

- `useClaimsForPost(postId)` — fetches claims array
- `useApproveClaim()` — mutation {claimId, postId}
- `useRejectClaim()` — mutation {claimId, postId}
- `usePost(postId)` — post metadata

Updated: 2026-03-17
