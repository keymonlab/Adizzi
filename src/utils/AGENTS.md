<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/utils

Pure helper functions for formatting, parsing, and validation used across the app.

## Purpose

Provide reusable, side-effect-free utility functions for common tasks: date/text formatting, @ mention parsing, and input validation. These are imported by components, hooks, and services—never depend on React or async operations.

## Key Files

| File | Purpose |
|------|---------|
| `format.ts` | Date formatting, time-ago strings, text truncation |
| `mention.ts` | Parse and extract @mentions from text |
| `validation.ts` | Input validation (email, phone, password, URL) |

## For AI Agents

**Pure functions—no side effects:**
- All utilities are synchronous
- No imports from React, context providers, or services
- All exports are pure functions: same input always produces same output
- Safe to call during render

**`format.ts` examples:**
- `formatDate(date: Date): string` — ISO date format
- `timeAgo(date: Date): string` — relative time ("2h ago", "3d ago")
- `truncate(text: string, length: number): string` — ellipsis truncation
- `phoneFormat(phone: string): string` — Korean phone format (+82)

**`mention.ts` examples:**
- `extractMentions(text: string): string[]` — find all @username mentions
- `replaceWithLinks(text: string): JSX.Element` — convert @mentions to clickable links
- `isValidMention(text: string): boolean` — validate mention format

**`validation.ts` examples:**
- `isValidEmail(email: string): boolean`
- `isValidPhone(phone: string): boolean` — Korean format validation
- `isValidPassword(password: string): boolean` — min 8 chars, alphanumeric
- `isValidPostTitle(title: string): boolean` — 1-100 chars, no spam
- `isValidImageUrl(url: string): boolean`

**When adding utilities:**
1. Keep functions small and focused (single responsibility)
2. Add JSDoc comments with type examples
3. Write unit tests in parallel
4. No async/await, no API calls, no state
5. Handle edge cases (null, undefined, empty strings)

**Testing pattern:**
```typescript
// utils/format.ts
/**
 * Format a date as ISO string
 * @param date - Input date
 * @returns ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// In tests:
expect(formatDate(new Date('2026-03-17'))).toBe('2026-03-17');
```

## Dependencies

- TypeScript (type utilities like `Partial<T>`)
- No external libraries (keep lightweight)
