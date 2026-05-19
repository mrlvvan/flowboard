# ADR 003 — Real-time collaboration approach

**Date:** 2026-05-19  
**Status:** Accepted

## Context

Multiple users can share a board. Changes made by one user should appear on other users' screens without a page reload, and users should see who else is online.

## Options considered

| Approach                | Pros                                                             | Cons                                       |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| Polling (setInterval)   | Simple, no infrastructure                                        | Latency ≥ poll interval; wastes bandwidth  |
| Custom WebSocket server | Full control                                                     | Requires deploying and operating a server  |
| Supabase Realtime       | Included in Supabase; postgres_changes events; presence built-in | Limited to Supabase; free tier rate limits |

## Decision

Use **Supabase Realtime** with two channel types:

1. **`postgres_changes`** — subscribes to `INSERT/UPDATE/DELETE` on `columns`, `cards`, and `boards` filtered by `board_id`. On any event, TanStack Query's cache for that board is invalidated and the UI refetches from Dexie (which was just updated by the realtime write on the sender's side).

2. **Presence channel** — each user tracks their identity (userId, name, avatar) on joining a board. `PresenceAvatars` renders up to 5 live avatars with tooltips showing names.

**Why invalidate TQ cache rather than applying the realtime payload directly?**  
Applying partial updates from realtime events is error-prone (field mismatches, ordering). Invalidation lets TanStack Query re-fetch the full authoritative state from Dexie/Supabase, keeping a single source of truth.

## Consequences

- One Supabase channel per open board page. Channels are cleaned up on unmount.
- Presence data is ephemeral — lost on disconnect, which is the correct behaviour.
- The invalidation approach causes a brief refetch on every change, which is acceptable for board sizes (tens to hundreds of items).
