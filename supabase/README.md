# Supabase setup — FlowBoard

There are two ways to bring up the database — pick one.

## Option A — One click (recommended for new projects)

1. Create a project at <https://supabase.com> → Dashboard
2. Copy `Project URL` and `anon public` key → paste into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Open **SQL Editor** → **New query** → paste the entire contents of
   [`SETUP.sql`](./SETUP.sql) → **Run**
4. Wait ~2 seconds for "Success. No rows returned" — that's it

`SETUP.sql` is fully **idempotent** — you can re-run it after every code update
to pick up new tables/policies. It bundles every migration in `migrations/`
into a single script.

## Option B — Supabase CLI (versioned migrations)

For teams that want migration history in version control:

```bash
npm i -g supabase   # or pnpm dlx supabase
supabase login
supabase link --project-ref <your-project-ref>

# Apply every migration in supabase/migrations/ in timestamp order
supabase db push
```

## What gets created

| Object               | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `profiles`           | Per-user metadata, auto-populated from `auth.users` on signup                    |
| `boards`             | Top-level container, owned by a user, can be archived/starred                    |
| `board_members`      | Many-to-many: user × board with role (`viewer` / `editor` / `admin`)             |
| `columns`            | Kanban columns within a board, position-ordered                                  |
| `cards`              | Cards within a column: title, markdown body, due date, labels, position          |
| `card_comments`      | Discussion thread per card, real-time enabled                                    |
| `find_user_by_email` | RPC (SECURITY DEFINER) — invite-by-email without leaking the whole profile table |
| `is_board_member`    | RPC helper used by RLS policies                                                  |
| `board_role`         | RPC helper that returns `admin`/`editor`/`viewer`/`null`                         |
| `avatars` bucket     | Public Storage bucket for user avatars (`avatars/<uid>/file.png`)                |

All five tables have **RLS enabled** with policies that:

- Allow board owners + members to read/write that board's data
- Allow only the comment author to edit/delete their own comments
- Allow users to upload avatars only into their own `<uid>/` folder
- Trigger Realtime broadcasts on every INSERT/UPDATE/DELETE

## Realtime — verify it's wired up

```sql
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
```

Expected: `boards`, `cards`, `card_comments`, `columns`.

## Auth providers

The app uses email/password by default. To enable OAuth:

1. Dashboard → **Authentication** → **Providers**
2. Enable Google / GitHub / etc.
3. Add redirect URLs:
   - `http://localhost:5173/auth/callback` for dev
   - `https://your-app.vercel.app/auth/callback` for prod

## Troubleshooting

**"relation public.boards does not exist"** — you forgot Step 3 (running SETUP.sql).

**"new row violates row-level security policy"** — your profile row is missing.
Step 6 of `SETUP.sql` backfills profiles for existing users. If you're hitting this
right after signup, the `handle_new_user` trigger may have failed — check
**Dashboard → Database → Logs**.

**Realtime not arriving** — make sure the publication includes the table (see above).
`SETUP.sql` step 10 handles this automatically.

**Comments don't show author name** — your `profiles_select_by_board_members` policy
isn't applied. Re-run `SETUP.sql`.
