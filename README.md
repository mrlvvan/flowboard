<div align="center">

# FlowBoard

**Offline-first Kanban with real-time collaboration**

A portfolio project showcasing modern React patterns — strict TypeScript, optimistic UI,
IndexedDB as a first-class persistence layer, and Supabase Realtime for live multi-user editing.

[![CI](https://github.com/mrlvvan/flowboard/actions/workflows/ci.yml/badge.svg)](https://github.com/mrlvvan/flowboard/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ecf8e?logo=supabase&logoColor=white)

</div>

---

## Why this exists

Most "todo app" portfolios stop at CRUD. FlowBoard intentionally tackles the _uncomfortable_ problems
that show up in real products:

| Hard problem                            | How FlowBoard solves it                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| Re-ordering 1000 items without N writes | **Fractional-index positions** (`lexorank`-style) — one write per move          |
| Working offline + reconciliation        | **Dexie write-through + sync queue** with idempotent ops & backoff              |
| Two users editing the same card         | **Supabase Realtime** + last-write-wins via `updated_at`                        |
| Type drift between client & DB          | `supabase gen types` → strict TS surfaces every breaking change at compile time |
| Stale UI after network round-trip       | **TanStack Query optimistic updates** with rollback on failure                  |

---

## Features

- ✋ **Drag-and-drop** columns and cards (dnd-kit) — keyboard-accessible, fractional positions
- 🔌 **Offline-first** — every mutation writes to IndexedDB first, queues to Supabase, retries with exponential backoff
- 🌐 **Real-time collaboration** — `postgres_changes` channels + presence avatars in the header
- 🔍 **Full-text search** — MiniSearch indexes all local data; fuzzy + prefix matching, keyboard navigation
- 🏷️ **Rich card editor** — Markdown descriptions (GFM), 12 colour labels, due dates, checklists with progress
- 🎯 **URL-persisted filters** — by label, overdue, due-soon — shareable links via TanStack Router `validateSearch`
- ⌨️ **Keyboard shortcuts** — `/` search, `N` new board, `?` cheat-sheet
- 📦 **PWA** — installable, manifest, splash, theme-color
- 🌍 **i18n** — English + Russian, auto-detected from browser locale
- 🧪 **Tested** — Vitest unit (sync queue, position calc, offline engine) + Playwright E2E (10 workflow scenarios)

---

## Stack rationale

| Layer        | Choice                    | Why not the alternative                                                     |
| ------------ | ------------------------- | --------------------------------------------------------------------------- |
| Routing      | **TanStack Router**       | Fully type-safe params & search params — React Router needs manual casting  |
| Server state | **TanStack Query**        | Standard for async state; RTK Query adds too much boilerplate for this size |
| Client state | **Zustand**               | Minimal API, no reducers — Redux overkill for UI-only state                 |
| Offline DB   | **Dexie.js**              | Typed wrapper over IndexedDB; raw IDB is verbose & untyped                  |
| DnD          | **dnd-kit**               | Accessible out of the box; react-beautiful-dnd is unmaintained              |
| Forms        | **react-hook-form + zod** | Uncontrolled inputs (zero re-renders) + runtime-checked schemas             |
| Backend      | **Supabase**              | Auth + Postgres + Realtime + RLS in one — avoids a custom server            |
| Styling      | **Tailwind v4**           | Atomic, zero-runtime; shadcn-style primitives over Radix for a11y           |
| Animations   | **Framer Motion**         | Exit animations for dnd-kit transitions — CSS can't sequence list removals  |

Detailed reasoning in [`docs/adr/001-stack.md`](docs/adr/001-stack.md).

---

## Architecture

```
src/
  features/                  # vertical slices — each owns its api/, components/, hooks/
    boards/                  # board CRUD, archive, star
    columns/                 # KanbanBoard, KanbanColumn, position math
    cards/                   # card list, modal, markdown editor, due dates, labels
    realtime/                # postgres_changes channel + presence
    search/                  # MiniSearch index + keyboard-navigable dialog
    auth/                    # Supabase auth wrapper + signOut
  shared/
    ui/                      # Radix-based primitives (Dialog, Input, Tooltip…)
    hooks/                   # useOnlineStatus, useKeyboardShortcuts, useInstallPrompt
    lib/                     # supabase client, networkError, position, utils
    store/                   # Zustand stores (uiStore)
    i18n/                    # i18next config + en/ru JSONs
  db/                        # Dexie schema, syncQueue, syncEngine (offline core)
  app/                       # routes (TanStack file-based), Providers, Sidebar, App.tsx
supabase/
  migrations/                # versioned SQL — schema, RLS, realtime publication
e2e/                         # Playwright tests
docs/adr/                    # Architecture Decision Records (001-stack, 002-offline, 003-realtime)
```

**Rule**: features import from `shared/` only, never from each other.

### Offline sync flow

```
┌──────────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│ UI mutation  │ ───▶ │  Dexie   │ ───▶ │  syncQueue   │ ───▶ │ Supabase │
└──────────────┘ opt. └──────────┘ enq. └──────────────┘ flush└──────────┘
                          ▲                                          │
                          └──────────── pullColumnsAndCards() ◀──────┘
                              applies last-write-wins by updated_at
```

1. Every mutation writes to **Dexie first** — UI is instant, optimistic
2. The **sync queue** batches operations; consecutive updates to the same record are coalesced (`merge`)
3. On reconnect, `flushAll()` replays the queue to Supabase with exponential backoff (1s → 2s → 4s → 8s → 16s, max 5 attempts)
4. `pullColumnsAndCards()` then pulls remote state and applies last-write-wins via `updated_at`
5. Realtime channel re-invalidates TanStack Query cache on remote changes

Full details: [`docs/adr/002-offline-sync.md`](docs/adr/002-offline-sync.md).

### Real-time collaboration

Each board page subscribes to a Supabase Realtime channel scoped to `board_id`. On any
`INSERT/UPDATE/DELETE` from another client, TanStack Query's cache for that board is invalidated —
React re-renders automatically. Presence uses Supabase presence channels; the current user is tracked
and up to 5 avatars with tooltips appear in the board header.

Full details: [`docs/adr/003-realtime.md`](docs/adr/003-realtime.md).

---

## Getting started

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from
# Supabase Dashboard → Project Settings → API
```

**3. Set up the database** — open Supabase Dashboard → **SQL Editor** → **New query** →
paste the contents of [`supabase/SETUP.sql`](supabase/SETUP.sql) → **Run**.

The script is fully idempotent (safe to re-run) and bundles every migration:
tables, indexes, RLS policies, triggers, Realtime publication, avatars bucket,
and an invite-by-email RPC. See [`supabase/README.md`](supabase/README.md) for details
and the Supabase CLI alternative.

```bash
# 4. Dev server
pnpm dev
```

Open <http://localhost:5173>, register, and you're in.

### Optional: E2E with a real Supabase

```bash
# .env.test.local
TEST_EMAIL=your-test-user@example.com
TEST_PASSWORD=your-test-password

pnpm test:e2e
```

---

## Scripts

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Vite dev server with HMR                  |
| `pnpm build`      | Production build (type-check + bundle)    |
| `pnpm preview`    | Preview the production build              |
| `pnpm typecheck`  | TypeScript strict check (no emit)         |
| `pnpm lint`       | ESLint (typescript-eslint + react + a11y) |
| `pnpm test`       | Vitest unit tests                         |
| `pnpm test:watch` | Vitest in watch mode                      |
| `pnpm test:e2e`   | Playwright E2E (10 workflow scenarios)    |

---

## Testing strategy

- **Unit** (Vitest + Testing Library) — sync queue logic, position algorithm, offline engine, network error detection. Covers the load-bearing code where bugs would silently corrupt user data.
- **E2E** (Playwright) — 10 serial scenarios in `e2e/kanban.spec.ts`: create board → empty state → add column → add card → open modal → filter → search → rename. Auth handled via Playwright `storageState` so login runs only once per test session.
- **Integration** — `cardsApi.offline.test.ts` and `columnsApi.offline.test.ts` mock `navigator.onLine` to verify the offline write path enqueues correctly.

---

## Decisions worth reading

- [`docs/adr/001-stack.md`](docs/adr/001-stack.md) — why TanStack over React Router/RTK, Dexie over PouchDB, etc.
- [`docs/adr/002-offline-sync.md`](docs/adr/002-offline-sync.md) — queue design, conflict resolution, why last-write-wins is enough here
- [`docs/adr/003-realtime.md`](docs/adr/003-realtime.md) — `postgres_changes` vs custom WS, presence channel scope

---

## License

MIT — see [`LICENSE`](LICENSE).
