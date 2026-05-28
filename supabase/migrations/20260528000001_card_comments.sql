-- ─── card_comments ───────────────────────────────────────────────────────────
-- Lightweight per-card discussion thread.  Authors can edit/delete their own;
-- any board member can read.  Realtime emits changes so other clients update.

create table if not exists public.card_comments (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  board_id    uuid not null references public.boards(id) on delete cascade,
  author_id   uuid not null references auth.users(id)   on delete cascade,
  body        text not null check (length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists card_comments_card_id_idx    on public.card_comments(card_id);
create index if not exists card_comments_board_id_idx   on public.card_comments(board_id);
create index if not exists card_comments_created_at_idx on public.card_comments(created_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.card_comments enable row level security;

drop policy if exists "card_comments_select" on public.card_comments;
drop policy if exists "card_comments_insert" on public.card_comments;
drop policy if exists "card_comments_update" on public.card_comments;
drop policy if exists "card_comments_delete" on public.card_comments;

-- Read: any board member
create policy "card_comments_select" on public.card_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.board_members
      where board_id = card_comments.board_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.boards
      where id = card_comments.board_id and owner_id = auth.uid()
    )
  );

-- Insert: must be a board member and author_id = self
create policy "card_comments_insert" on public.card_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      exists (
        select 1 from public.board_members
        where board_id = card_comments.board_id and user_id = auth.uid()
      )
      or exists (
        select 1 from public.boards
        where id = card_comments.board_id and owner_id = auth.uid()
      )
    )
  );

-- Update / delete: author only
create policy "card_comments_update" on public.card_comments
  for update to authenticated
  using  (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "card_comments_delete" on public.card_comments
  for delete to authenticated
  using (author_id = auth.uid());

-- ─── Realtime ────────────────────────────────────────────────────────────────
alter table public.card_comments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'card_comments'
  ) then
    alter publication supabase_realtime add table public.card_comments;
  end if;
end $$;
