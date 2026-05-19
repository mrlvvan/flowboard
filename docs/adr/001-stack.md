# ADR 001 — Stack selection

**Date:** 2026-05-19  
**Status:** Accepted

## Context

FlowBoard is a portfolio project. The stack must demonstrate modern frontend skills legible to mid-to-senior engineers reviewing resumes, while remaining manageable for a single developer.

## Decision

| Layer        | Chosen                  | Rejected                 | Reason                                                                                               |
| ------------ | ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Build        | Vite + SWC              | CRA, Next.js             | Vite is the current standard; Next.js SSR adds complexity with no payoff for a client-side app       |
| Routing      | TanStack Router         | React Router v6          | File-based routes, fully type-safe params/search without manual casting                              |
| Server state | TanStack Query          | SWR, RTK Query           | Best ecosystem, optimistic updates are first-class                                                   |
| Client state | Zustand                 | Redux, Jotai             | Minimal API; Redux is overkill; Jotai's atom model less familiar to interviewers                     |
| Styles       | Tailwind v4 + shadcn/ui | CSS Modules, Emotion     | Tailwind is industry-standard; shadcn gives production-quality components without a heavy dependency |
| Backend      | Supabase                | Firebase, custom Express | Single service provides Auth, Postgres, RLS, Realtime, and Storage                                   |

## Consequences

- TanStack Router requires running the Vite plugin to generate the route tree — an extra build step interviewers should know about.
- Supabase free tier has connection limits; acceptable for a demo/portfolio.
- No SSR means the app is not SEO-friendly, which is fine for a private Kanban tool.
