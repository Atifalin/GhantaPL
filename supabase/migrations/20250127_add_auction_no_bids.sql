-- Create auction_no_bids table to track no bid votes
CREATE TABLE auction_no_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auction_id, user_id, player_id)
);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE auction_no_bids;
