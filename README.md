# FlowBoard

Offline-first Kanban board with real-time collaboration — built as a portfolio project showcasing modern React patterns.

[![CI](https://github.com/your-username/flowboard/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/flowboard/actions)

## Features

- **Drag-and-drop** columns and cards with fractional-index positioning (no re-numbering collisions)
- **Offline-first** — all reads/writes go through Dexie (IndexedDB); changes sync to Supabase when back online
- **Real-time collaboration** — live updates via Supabase Realtime postgres_changes + presence avatars
- **Full-text search** — MiniSearch indexes all local boards and cards with fuzzy prefix matching
- **Rich card editor** — Markdown descriptions, colour labels, due dates, checklists with progress bar
- **PWA** — installable, Workbox service worker, offline shell cached
- **i18n** — English and Russian, auto-detected from browser locale
- **Dark / light / system** theme

## Stack rationale

| Layer        | Choice              | Why not the alternative                                                        |
| ------------ | ------------------- | ------------------------------------------------------------------------------ |
| Routing      | **TanStack Router** | Fully type-safe params and search params; React Router requires manual casting |
| Server state | **TanStack Query**  | Standard for async state; Redux Toolkit Query adds too much boilerplate        |
| Client state | **Zustand**         | Minimal API, no reducers; Redux overkill for UI-only state                     |
| Offline DB   | **Dexie.js**        | Typed IndexedDB wrapper; raw IDB API is too verbose                            |
| DnD          | **dnd-kit**         | Accessible out-of-the-box; react-beautiful-dnd is unmaintained                 |
| Backend      | **Supabase**        | Auth + Postgres + Realtime + RLS in one; avoids custom server                  |

## Architecture

```
src/
  features/<feature>/   # vertical slices (boards, cards, columns, realtime, search)
    api/                # TanStack Query hooks + Supabase calls
    components/         # UI local to the feature
  shared/
    ui/                 # shadcn-style primitives (Button, Dialog, Input…)
    hooks/              # reusable hooks (useOnlineStatus, useKeyboardShortcuts…)
  db/                   # Dexie schema + sync queue + sync engine
  app/                  # Router, providers, sidebar, route files
```

### Offline sync flow

1. Every mutation writes to **Dexie first** (instant, optimistic)
2. The **sync queue** batches operations — consecutive updates for the same record are merged
3. On reconnect, `flushAll()` replays the queue to Supabase with exponential backoff (max 5 attempts)
4. `pullBoards()` / `pullColumnsAndCards()` then pulls remote state and applies last-write-wins via `updated_at`

### Real-time collaboration

Each board page subscribes to a Supabase Realtime channel scoped to `board_id`. On any `INSERT/UPDATE/DELETE` from another client, TanStack Query's cache for that board is invalidated — React re-renders automatically. Presence uses Supabase presence channels: the current user is tracked, and up to 5 avatars with tooltips are shown in the board header.

## Getting started

```bash
# Install
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Apply database migrations
pnpm supabase db push

# Dev server
pnpm dev
```

## Scripts

| Command          | Description             |
| ---------------- | ----------------------- |
| `pnpm dev`       | Vite dev server         |
| `pnpm build`     | Production build        |
| `pnpm typecheck` | TypeScript strict check |
| `pnpm lint`      | ESLint                  |
| `pnpm test`      | Vitest unit tests       |
| `pnpm test:e2e`  | Playwright E2E          |

## Testing

- **Unit** (Vitest + Testing Library): sync queue logic, position algorithm, offline engine — run with `pnpm test`
- **E2E** (Playwright): auth redirects, PWA manifest, board routing — run with `pnpm test:e2e`

## Decisions worth reading

- [`docs/adr/001-stack.md`](docs/adr/001-stack.md) — stack selection rationale
- [`docs/adr/002-offline-sync.md`](docs/adr/002-offline-sync.md) — offline sync strategy
- [`docs/adr/003-realtime.md`](docs/adr/003-realtime.md) — realtime approach
