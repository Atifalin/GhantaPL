create table if not exists public.auction_selected_players (
  id uuid default gen_random_uuid() primary key,
  auction_id uuid references public.auctions(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  created_at timestamptz default now(),
  unique(auction_id, player_id)
);

-- Add RLS policies
alter table public.auction_selected_players enable row level security;

create policy "Users can view auction selected players"
  on public.auction_selected_players
  for select
  using (true);

create policy "Auction hosts can insert auction selected players"
  on public.auction_selected_players
  for insert
  with check (
    exists (
      select 1 from public.auctions a
      where a.id = auction_id
      and a.host_id = auth.uid()
    )
  );

create policy "Auction hosts can delete auction selected players"
  on public.auction_selected_players
  for delete
  using (
    exists (
      select 1 from public.auctions a
      where a.id = auction_id
      and a.host_id = auth.uid()
    )
  ); 