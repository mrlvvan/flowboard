# ADR 002 — Offline-first sync strategy

**Date:** 2026-05-19 (revised 2026-05-24)
**Status:** Implemented

## Context

FlowBoard must work without a network connection and sync automatically when connectivity returns. The key requirements are:

1. UI stays responsive during mutations regardless of network state
2. Changes made offline must not be lost across page refreshes
3. Conflict resolution must be deterministic and simple enough to reason about

## Decision

### Read path — Supabase-first with Dexie fallback

Query functions (`fetchCards`, `fetchColumns`, `fetchBoards`) try Supabase first. On success they write the result into Dexie as a local cache (`bulkPut`). If the request fails with a network error (`isNetworkError(err)`) they fall back to the local IndexedDB tables transparently.

```
fetch() → Supabase ──success──▶ bulkPut(Dexie) → return data
                  └──network err──▶ Dexie.where(…).toArray() → return data
```

This means the first offline render uses whatever was last cached in Dexie (populated on the previous online visit).

### Write path — conditional branch on `navigator.onLine`

Every mutation checks `navigator.onLine` at call time:

**Online:**

```
API fn → supabase.[insert|update|delete]() → db.put/delete()
```

Dexie is updated after a confirmed Supabase write (write-through cache).

**Offline:**

```
API fn → crypto.randomUUID() (create) or existing id
       → db.[put|delete]()     ← immediate, UI responds instantly
       → enqueue(table, op, id, payload)   ← persists across refreshes
```

The caller (TanStack Query mutation) sees a resolved promise either way, so optimistic updates work identically online and offline.

### Sync queue — `db.syncQueue` (Dexie table)

Operations are stored as `{ table, operation, recordId, payload, createdAt, attempts }`.

**Deduplication:** consecutive `update` ops for the same `(table, recordId)` are merged in place — a rapid rename doesn't create N queue entries.

**Flush on reconnect:** `window.addEventListener("online")` triggers `goOnline()`:

```
flushAll()  →  pullBoards()
           →  invalidateQueries()  (via goOnline in useOnlineStatus)
```

Each item is retried up to 5 times with exponential backoff `min(1000 × 2^n, 30s)`. After 5 failures the item is dropped and logged (acceptable for a portfolio project; production would need a dead-letter queue or user notification).

### Conflict resolution — last-write-wins on `updated_at`

After flushing, `pull*` functions overwrite local records only when `remote.updated_at >= local.updated_at`. This is correct for single-user offline use. Two users editing the same card offline will silently prefer whichever synced last — an accepted trade-off.

### Sync status UI

`useOnlineStatus` hook exposes `{ isOnline, syncStatus, pendingOps }`. `SyncIndicator` in the sidebar shows:

- 🟢 **Synced** — online, queue empty
- 🟡 **Syncing (N)…** — reconnected, flushing N items
- 🔴 **Offline** — no connection; counter polls Dexie every 3 s

## Consequences

- A CRDT approach (Automerge, Yjs) would eliminate last-write-wins data loss but adds significant bundle size and complexity.
- The sync queue persists across page reloads — unflushed operations survive a browser refresh or crash.
- `fake-indexeddb` is injected by Dexie in the test environment, enabling full unit testing of offline paths without a real browser.
- 27 unit tests cover: queue enqueue/merge/flush/retry/drop, and the offline create/update/delete paths for cards, columns, and boards.
