-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;

-- Profiles: users can only read/update their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Helper: check if current user is a board member
create or replace function public.is_board_member(p_board_id uuid)
returns boolean language sql security definer as $$
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
returns text language sql security definer as $$
  select case
    when exists (select 1 from public.boards where id = p_board_id and owner_id = auth.uid())
      then 'admin'
    else (
      select role from public.board_members
      where board_id = p_board_id and user_id = auth.uid()
    )
  end;
$$;

-- Boards policies
create policy "boards_select" on public.boards
  for select using (public.is_board_member(id));

create policy "boards_insert" on public.boards
  for insert with check (auth.uid() = owner_id);

create policy "boards_update" on public.boards
  for update using (public.board_role(id) in ('editor', 'admin'));

create policy "boards_delete" on public.boards
  for delete using (owner_id = auth.uid());

-- Board members policies
create policy "board_members_select" on public.board_members
  for select using (public.is_board_member(board_id));

create policy "board_members_insert" on public.board_members
  for insert with check (public.board_role(board_id) = 'admin');

create policy "board_members_delete" on public.board_members
  for delete using (public.board_role(board_id) = 'admin');

-- Columns policies
create policy "columns_select" on public.columns
  for select using (public.is_board_member(board_id));

create policy "columns_insert" on public.columns
  for insert with check (public.board_role(board_id) in ('editor', 'admin'));

create policy "columns_update" on public.columns
  for update using (public.board_role(board_id) in ('editor', 'admin'));

create policy "columns_delete" on public.columns
  for delete using (public.board_role(board_id) in ('editor', 'admin'));

-- Cards policies
create policy "cards_select" on public.cards
  for select using (public.is_board_member(board_id));

create policy "cards_insert" on public.cards
  for insert with check (public.board_role(board_id) in ('editor', 'admin'));

create policy "cards_update" on public.cards
  for update using (public.board_role(board_id) in ('editor', 'admin'));

create policy "cards_delete" on public.cards
  for delete using (public.board_role(board_id) in ('editor', 'admin'));
