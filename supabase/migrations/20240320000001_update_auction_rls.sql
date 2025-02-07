-- Update RLS for auction_winners
drop policy if exists "Users can view auction winners" on auction_winners;
drop policy if exists "Auction hosts can manage winners" on auction_winners;

create policy "Users can view auction winners"
  on auction_winners
  for select
  using (true);

create policy "Auction hosts can manage winners"
  on auction_winners
  for all
  using (
    exists (
      select 1 from auctions a
      where a.id = auction_id
      and a.host_id = auth.uid()
    )
  );

-- Update RLS for auction_skipped_players
drop policy if exists "Users can view skipped players" on auction_skipped_players;
drop policy if exists "Auction hosts can manage skipped players" on auction_skipped_players;

create policy "Users can view skipped players"
  on auction_skipped_players
  for select
  using (true);

create policy "Auction hosts can manage skipped players"
  on auction_skipped_players
  for all
  using (
    exists (
      select 1 from auctions a
      where a.id = auction_id
      and a.host_id = auth.uid()
    )
  );

-- Update RLS for auction_no_bids
drop policy if exists "Users can view no bids" on auction_no_bids;
drop policy if exists "Auction hosts can manage no bids" on auction_no_bids;

create policy "Users can view no bids"
  on auction_no_bids
  for select
  using (true);

create policy "Auction hosts can manage no bids"
  on auction_no_bids
  for all
  using (
    exists (
      select 1 from auctions a
      where a.id = auction_id
      and a.host_id = auth.uid()
    )
  ); 