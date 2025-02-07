-- Enable realtime for required tables
alter publication supabase_realtime add table auctions;
alter publication supabase_realtime add table players;

-- Update RLS policies for auctions
alter table auctions enable row level security;

create policy "Enable read access for all users"
on auctions for select
to authenticated
using (true);

create policy "Enable update for auction host"
on auctions for update
to authenticated
using (auth.uid() = host_id)
with check (auth.uid() = host_id);

create policy "Enable bid updates for participants"
on auctions for update
to authenticated
using (exists (
  select 1 from auction_participants
  where auction_id = id
  and user_id = auth.uid()
))
with check (exists (
  select 1 from auction_participants
  where auction_id = id
  and user_id = auth.uid()
));

-- Update RLS policies for players
alter table players enable row level security;

create policy "Enable read access for all users"
on players for select
to authenticated
using (true);
