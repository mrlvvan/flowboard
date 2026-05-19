# ADR 002 — Offline sync strategy

**Date:** 2026-05-19  
**Status:** Accepted

## Context

FlowBoard should work without a network connection and sync automatically when connectivity returns. We need a strategy for:

1. Where to store local state
2. How to order and deduplicate writes
3. How to resolve conflicts when the remote has newer data

## Decision

**Local store:** Dexie.js (IndexedDB). All reads go through Dexie; the UI never waits on network.

**Write path:**  
Every mutation enqueues an operation in `syncQueue` (a Dexie table). Consecutive `update` operations for the same record are merged in place — avoiding redundant round-trips for rapid edits (e.g. typing a card title).

**Flush on reconnect:**  
`window.online` triggers `flushAll()` which replays the queue in `createdAt` order. Each item is retried up to 5 times with exponential backoff (`min(1000 × 2^attempts, 30s)`). After 5 failures the item is dropped and an error is logged.

**Conflict resolution:**  
After flushing, `pullBoards()` and `pullColumnsAndCards()` fetch the remote state. Local records are overwritten only when `remote.updated_at >= local.updated_at` (last-write-wins). This is simple and correct for a single-user offline scenario; it can produce data loss in concurrent multi-user offline edits, which is an accepted trade-off for a portfolio project.

## Consequences

- Merge of concurrent offline edits from two different users will silently prefer whichever synced last. A CRDT approach (e.g. Automerge) would solve this but adds significant complexity.
- The sync queue persists across page reloads — unflushed operations survive a browser refresh.
- `fake-indexeddb` lets us unit-test the queue without a real browser.
