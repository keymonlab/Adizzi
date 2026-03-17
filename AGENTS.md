<!-- Generated: 2026-03-17 | Updated: 2026-03-17 -->

# Adizzi (어디찌)

## Purpose
Korean neighborhood-based lost-and-found community app. Users post lost or found items scoped to their verified neighborhood, claim items via verification questions, and receive notifications. UI strings are in Korean.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts |
| `app.json` | Expo app configuration |
| `tsconfig.json` | TypeScript config with `@/*` → `src/*` path alias |
| `babel.config.js` | Babel configuration for Expo |
| `playwright.config.ts` | E2E test configuration |
| `index.ts` | App entry point |
| `App.tsx` | Root app component |
| `env.local` | Environment variables (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY) |
| `CLAUDE.md` | AI assistant instructions |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code — routes, components, hooks, services (see `src/AGENTS.md`) |
| `supabase/` | Database migrations, edge functions, config (see `supabase/AGENTS.md`) |
| `tests/` | E2E test suites with Playwright (see `tests/AGENTS.md`) |
| `assets/` | App icons and splash screen images |
| `specs/` | Project specifications |
| `docs/` | Design documents and specs |
| `wireframe_img/` | UI wireframe screenshots |

## For AI Agents

### Working In This Directory
- Use `npx expo start` to run the dev server
- Use `npx tsc --noEmit` to type-check
- Use `npx playwright test` for E2E tests
- Use `supabase start` / `supabase db reset` for local Supabase
- Path alias: `@/*` maps to `src/*`
- All UI strings must be in Korean

### Architecture Overview
- **Framework**: Expo Router + React Native with file-based routing
- **Backend**: Supabase (auth, database, storage, realtime, edge functions)
- **Data fetching**: TanStack React Query
- **Maps**: Kakao Maps API with reverse geocoding
- **Location**: PostGIS with WKT format (`POINT(lng lat)`)

### Data Layer Pattern
`services/*.service.ts` → raw Supabase queries
`hooks/use*.ts` → React Query wrappers (caching, pagination, mutations)
Components consume hooks, never call services directly.

### Key Domain Concepts
- **Posts**: `post_type` (lost | found), `category` (shoes, toy, clothing, bag, electronics, wallet, keys, pet, other)
- **Claims**: Verification question/answer with SHA-256 hashed answers, max 3 attempts
- **Neighborhoods**: Scope all posts; users must verify location first
- **Soft-delete**: `deleted_at` column, always filter with `.is('deleted_at', null)`
- **Feed pagination**: Cursor-based with `(created_at, id)` composite cursor

### Provider Hierarchy
`SafeAreaProvider → QueryClientProvider → AuthProvider → NotificationProvider → RealtimeProvider → Slot`

## Dependencies

### External
- `expo` ~52 — App framework
- `@supabase/supabase-js` — Backend client
- `@tanstack/react-query` — Data fetching/caching
- `expo-router` — File-based routing
- `react-native-maps` / Kakao Maps — Map display
- `expo-location` — Device location
- `expo-notifications` — Push notifications
- `expo-image-picker` — Image selection

<!-- MANUAL: -->
