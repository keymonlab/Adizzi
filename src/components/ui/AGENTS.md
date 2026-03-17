<!-- Parent: ../AGENTS.md -->

# src/components/ui

Reusable UI primitives and design system base components.

**Last updated:** 2026-03-17

## Components

### Avatar.tsx
User profile image with fallback initials.

- Circular image or colored initials badge
- Supports custom size (sm, md, lg)
- Placeholder on missing image

### Badge.tsx
Small label or status indicator.

- Variants: solid, outline, ghost
- Color options (primary, secondary, success, warning, danger)
- Size options (sm, md, lg)

### Button.tsx
Primary interaction element.

- Variants: solid, outline, ghost, link
- Sizes: sm, md, lg
- Loading state with spinner
- Disabled state styling
- Full-width option

### Card.tsx
Container for grouped content.

- Rounded corners, shadow, padding
- Optional header and footer
- Used throughout app for content sections

### EmptyState.tsx
Placeholder for empty lists or sections.

- Large icon, title, and description
- Optional action button
- Responsive layout

### ErrorBoundary.tsx
React error boundary for crash handling.

- Catches child component errors
- Shows error UI with reset button
- Logs errors to console in development

### Input.tsx
Text input field with validation.

- Supports text, email, password, number types
- Optional label, placeholder, error message
- Character limit indicator
- Keyboard type per input type

### LoadingSpinner.tsx
Animated loading indicator with size options (sm, md, lg) and optional text label.

### NetworkError.tsx
Error UI for network/API failures with retry button.

## Usage

Components use React Native `StyleSheet` (not CSS) for platform support. Import from `@/components/ui`.

## Related

- `src/theme/` — color palette and spacing tokens
