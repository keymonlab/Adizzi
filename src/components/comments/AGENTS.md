<!-- Parent: ../AGENTS.md -->

# src/components/comments

Post comment system components with mention support and soft-delete filtering.

**Last updated:** 2026-03-17

## Components

### CommentInput.tsx
Comment text input field with @ mention support.

- TextInput with multiline support
- Detects `@` and shows mention suggestions dropdown
- Character limit enforcement
- Submit button state tied to input validation

### CommentList.tsx
Threaded comment display with soft-delete filtering.

- Renders paginated comments for a post
- Filters out soft-deleted comments (`WHERE deleted_at IS NULL`)
- Shows nested replies under parent comments
- Handles loading and empty states
- Pulls data from `usePostComments` hook

### MentionSuggestions.tsx
Autocomplete dropdown triggered by @ mention.

- Searches user profiles by handle prefix
- Shows user avatar and handle in dropdown
- Auto-inserts mention into comment text on select
- Dismisses when text loses `@` or user selects

## Data flow

1. User types `@` in CommentInput
2. MentionSuggestions queries matching users
3. Dropdown appears with suggestions
4. User selects mention, text updated
5. User submits, comment created via mutation hook
6. CommentList refetches and re-renders

## Related

- `hooks/usePostComments.ts` — fetch and mutate comments
- `services/comments.service.ts` — raw Supabase queries
- `src/app/post/[id].tsx` — post detail screen with comment section
