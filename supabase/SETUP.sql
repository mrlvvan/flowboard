-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║                                                                           ║
-- ║   FlowBoard — single-file Supabase setup                                  ║
-- ║                                                                           ║
-- ║   Paste this file into Supabase Dashboard → SQL Editor → Run.             ║
-- ║   It is fully idempotent: safe to re-run after every code update.         ║
-- ║                                                                           ║
-- ║   Combines all migrations in supabase/migrations/ into one script for     ║
-- ║   developers who don't want to install the Supabase CLI.                  ║
-- ║                                                                           ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ═══ 1. EXTENSIONS ═════════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

-- ═══ 2. TABLES ═════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  is_archived boolean not null default false,
  is_starred  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Backfill is_starred on existing installs
alter table public.boards
  add column if not exists is_starred boolean not null default false;

create table if not exists public.board_members (
  board_id   uuid not null references public.boards(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'editor' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create table if not exists public.columns (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  name       text not null,
  position   text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references public.columns(id) on delete cascade,
  board_id    uuid not null references public.boards(id) on delete cascade,
  title       text not null,
  description text,
  position    text not null,
  due_date    timestamptz,
  labels      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.card_comments (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id)  on delete cascade,
  board_id    uuid not null references public.boards(id) on delete cascade,
  author_id   uuid not null references auth.users(id)    on delete cascade,
  body        text not null check (length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ═══ 3. INDEXES ════════════════════════════════════════════════════════════════
create index if not exists boards_owner_id_idx          on public.boards(owner_id);
create index if not exists board_members_user_id_idx    on public.board_members(user_id);
create index if not exists columns_board_id_idx         on public.columns(board_id);
create index if not exists cards_column_id_idx          on public.cards(column_id);
create index if not exists cards_board_id_idx           on public.cards(board_id);
create index if not exists card_comments_card_id_idx    on public.card_comments(card_id);
create index if not exists card_comments_board_id_idx   on public.card_comments(board_id);
create index if not exists card_comments_created_at_idx on public.card_comments(created_at);

-- ═══ 4. TRIGGERS — auto-update updated_at ═════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at      on public.profiles;
create trigger set_profiles_updated_at      before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_boards_updated_at        on public.boards;
create trigger set_boards_updated_at        before update on public.boards
  for each row execute function public.set_updated_at();

drop trigger if exists set_columns_updated_at       on public.columns;
create trigger set_columns_updated_at       before update on public.columns
  for each row execute function public.set_updated_at();

drop trigger if exists set_cards_updated_at         on public.cards;
create trigger set_cards_updated_at         before update on public.cards
  for each row execute function public.set_updated_at();

drop trigger if exists set_card_comments_updated_at on public.card_comments;
create trigger set_card_comments_updated_at before update on public.card_comments
  for each row execute function public.set_updated_at();

-- ═══ 5. AUTO-CREATE PROFILE ON SIGNUP ══════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══ 6. BACKFILL EXISTING USERS ════════════════════════════════════════════════
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ═══ 7. RLS — enable ═══════════════════════════════════════════════════════════
alter table public.profiles       enable row level security;
alter table public.boards         enable row level security;
alter table public.board_members  enable row level security;
alter table public.columns        enable row level security;
alter table public.cards          enable row level security;
alter table public.card_comments  enable row level security;

-- ═══ 8. RLS HELPERS — board membership / role ═════════════════════════════════
create or replace function public.is_board_member(p_board_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.board_members
    where board_id = p_board_id and user_id = auth.uid()
  )
  or exists (
    select 1 from public.boards
    where id = p_board_id and owner_id = auth.uid()
  );
$$;

create or replace function public.board_role(p_board_id uuid)
returns text language sql security definer stable as $$
  select case
    when exists (select 1 from public.boards where id = p_board_id and owner_id = auth.uid())
      then 'admin'
    else (
      select role from public.board_members
      where board_id = p_board_id and user_id = auth.uid()
    )
  end;
$$;

-- ═══ 9. RLS POLICIES ══════════════════════════════════════════════════════════

-- ── PROFILES ────────────────────────────────────────────────────────────────
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_select_by_board_members" on public.profiles;

-- Read your own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Read profiles of board members (so we can show names + avatars in comments)
create policy "profiles_select_by_board_members" on public.profiles
  for select using (
    exists (
      select 1 from public.board_members bm
      where bm.user_id = profiles.id
        and exists (
          select 1 from public.board_members me
          where me.board_id = bm.board_id and me.user_id = auth.uid()
        )
    )
    or exists (
      select 1 from public.boards b
      where b.owner_id = profiles.id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1 from public.board_members me
            where me.board_id = b.id and me.user_id = auth.uid()
          )
        )
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ── BOARDS ──────────────────────────────────────────────────────────────────
drop policy if exists "boards_select"  on public.boards;
drop policy if exists "boards_insert"  on public.boards;
drop policy if exists "boards_update"  on public.boards;
drop policy if exists "boards_delete"  on public.boards;

create policy "boards_select" on public.boards
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.board_members
      where board_id = id and user_id = auth.uid()
    )
  );

create policy "boards_insert" on public.boards
  for insert with check (auth.uid() = owner_id);

create policy "boards_update" on public.boards
  for update using (public.board_role(id) in ('editor', 'admin'));

create policy "boards_delete" on public.boards
  for delete using (owner_id = auth.uid());

-- ── BOARD_MEMBERS ──────────────────────────────────────────────────────────
drop policy if exists "board_members_select" on public.board_members;
drop policy if exists "board_members_insert" on public.board_members;
drop policy if exists "board_members_delete" on public.board_members;

create policy "board_members_select" on public.board_members
  for select using (public.is_board_member(board_id));

create policy "board_members_insert" on public.board_members
  for insert with check (public.board_role(board_id) = 'admin');

create policy "board_members_delete" on public.board_members
  for delete using (public.board_role(board_id) = 'admin');

-- ── COLUMNS ─────────────────────────────────────────────────────────────────
drop policy if exists "columns_select" on public.columns;
drop policy if exists "columns_insert" on public.columns;
drop policy if exists "columns_update" on public.columns;
drop policy if exists "columns_delete" on public.columns;

create policy "columns_select" on public.columns
  for select using (public.is_board_member(board_id));

create policy "columns_insert" on public.columns
  for insert with check (public.board_role(board_id) in ('editor', 'admin'));

create policy "columns_update" on public.columns
  for update using (public.board_role(board_id) in ('editor', 'admin'));

create policy "columns_delete" on public.columns
  for delete using (public.board_role(board_id) in ('editor', 'admin'));

-- ── CARDS ───────────────────────────────────────────────────────────────────
drop policy if exists "cards_select" on public.cards;
drop policy if exists "cards_insert" on public.cards;
drop policy if exists "cards_update" on public.cards;
drop policy if exists "cards_delete" on public.cards;

create policy "cards_select" on public.cards
  for select using (public.is_board_member(board_id));

create policy "cards_insert" on public.cards
  for insert with check (public.board_role(board_id) in ('editor', 'admin'));

create policy "cards_update" on public.cards
  for update using (public.board_role(board_id) in ('editor', 'admin'));

create policy "cards_delete" on public.cards
  for delete using (public.board_role(board_id) in ('editor', 'admin'));

-- ── CARD_COMMENTS ──────────────────────────────────────────────────────────
drop policy if exists "card_comments_select" on public.card_comments;
drop policy if exists "card_comments_insert" on public.card_comments;
drop policy if exists "card_comments_update" on public.card_comments;
drop policy if exists "card_comments_delete" on public.card_comments;

-- Any board member can read all comments on that board's cards
create policy "card_comments_select" on public.card_comments
  for select using (public.is_board_member(board_id));

-- Only the author can post, and must be a board member
create policy "card_comments_insert" on public.card_comments
  for insert with check (
    author_id = auth.uid()
    and public.is_board_member(board_id)
  );

create policy "card_comments_update" on public.card_comments
  for update using  (author_id = auth.uid())
                with check (author_id = auth.uid());

create policy "card_comments_delete" on public.card_comments
  for delete using (author_id = auth.uid());

-- ═══ 10. REALTIME ═════════════════════════════════════════════════════════════
-- REPLICA IDENTITY FULL is required for Realtime to ship the full row on UPDATE/DELETE
alter table public.boards         replica identity full;
alter table public.columns        replica identity full;
alter table public.cards          replica identity full;
alter table public.card_comments  replica identity full;

-- Add tables to the supabase_realtime publication if they aren't already.
do $$
declare
  t text;
begin
  foreach t in array array['boards', 'columns', 'cards', 'card_comments']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ═══ 11. INVITE HELPER — find user by email (SECURITY DEFINER) ════════════════
-- ShareBoardDialog needs to look up a user by email to invite them.
-- We can't expose all profiles via RLS for privacy, so use a tightly-scoped RPC.
create or replace function public.find_user_by_email(p_email text)
returns table (id uuid, email text, full_name text, avatar_url text)
language sql security definer set search_path = public as $$
  select id, email, full_name, avatar_url
  from public.profiles
  where lower(profiles.email) = lower(p_email)
  limit 1;
$$;

revoke all     on function public.find_user_by_email(text) from public;
grant  execute on function public.find_user_by_email(text) to authenticated;

-- ═══ 12. STORAGE — avatars bucket ═════════════════════════════════════════════
-- Public bucket so img src can hotlink without signed URLs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_read_public"   on storage.objects;
drop policy if exists "avatars_upload_own"    on storage.objects;
drop policy if exists "avatars_update_own"    on storage.objects;
drop policy if exists "avatars_delete_own"    on storage.objects;

-- Anyone can read
create policy "avatars_read_public" on storage.objects
  for select using (bucket_id = 'avatars');

-- Authenticated users can upload to a folder named after their UID
-- (paths like avatars/<uid>/<file>.png)
create policy "avatars_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══ DONE ══════════════════════════════════════════════════════════════════════
-- Verify Realtime with:
--   select tablename from pg_publication_tables where pubname = 'supabase_realtime';
-- Should list: boards, cards, card_comments, columns
--
-- Verify avatars bucket with:
--   select * from storage.buckets where id = 'avatars';
--
-- Test the email lookup with:
--   select * from public.find_user_by_email('your@email.com');
