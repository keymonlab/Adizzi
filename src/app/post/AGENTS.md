<!-- Parent: ../AGENTS.md -->
# post — Post Detail View

Dynamic route `/post/[id]` for viewing single post's full details.

## Files

### [id].tsx
Displays post with images (ImageSlider), title, author card, status badge, category/location meta, description, claim button. Comments section (read-only list + input for auth users). Three-dot menu: delete (own posts) or report (others). Report modal supports 5 reasons (spam, inappropriate, fraud, harassment, other). Soft-deletes via `softDeletePost()`. Calls `usePost(id)` for post data and `useAuth()` for ownership check.

## Sections

1. Header — back, title, menu button
2. ImageSlider — carousel of post images
3. Post metadata — title, author card (avatar, name, handle), category icon, location name, time ago
4. Description text
5. ClaimButton — routes to claims form (lost) or claim detail (found)
6. Comments section — shows count, list via CommentList, input via CommentInput
7. Menu modal — delete/report actions with confirmation
8. Report modal — radio reason select + optional description, submits via `createReport()`

## Key Hooks

- `usePost(id)` — fetches post detail (author nested, comment_count)
- `useAuth()` — current user for ownership
- CommentList/CommentInput — nested components

Updated: 2026-03-17
