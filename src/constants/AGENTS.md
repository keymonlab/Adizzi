<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-17 -->

# src/constants

App-wide constants and configuration values used throughout the Adizzi application.

## Purpose

Centralize static values for categories, colors, layout dimensions, and app configuration. All components reference these constants rather than hardcoding values, ensuring consistency and easy maintenance.

## Key Files

| File | Purpose |
|------|---------|
| `categories.ts` | Post categories (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other) |
| `colors.ts` | Color theme and palette definitions |
| `config.ts` | App configuration (Supabase URLs, API keys, feature flags) |
| `layout.ts` | Layout constants (spacing, sizes, dimensions) |

## For AI Agents

**When modifying constants:**
- Update all references if renaming a constant
- Keep categories aligned with the database schema (`post_type`, `category` columns)
- Verify color values are accessible (check contrast ratios)
- Layout constants should account for safe area insets on mobile devices

**Key relationships:**
- `categories.ts` maps to database `category` enum in posts table
- `config.ts` loads environment variables (`EXPO_PUBLIC_*` prefix)
- `colors.ts` drives all UI styling across components
- `layout.ts` ensures consistent spacing and typography

## Dependencies

- React Native (for color values, dimension utilities)
- Environment variables (via `expo-constants`)
