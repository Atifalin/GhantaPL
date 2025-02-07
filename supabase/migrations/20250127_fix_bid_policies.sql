-- Drop existing bid update policy
drop policy if exists "Enable bid updates for participants" on auctions;

-- Create updated policy for participant bidding
create policy "Enable bid updates for participants"
on auctions for update
to authenticated
using (
  -- Check if user is a participant (including host if they are a participant)
  exists (
    select 1 from auction_participants
    where auction_id = id
    and user_id = auth.uid()
  )
  and status = 'active'
)
with check (
  -- Verify only bid-related fields are being updated
  auth.uid() = current_bidder_id
  and current_bid is not null
  and last_bid_time is not null
  and status = 'active'
);

-- Notify about policy update
do $$
begin
  raise notice 'Updated bid policy to allow hosts to bid if they are participants';
end $$;
