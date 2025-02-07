-- Enable RLS on all tables
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_no_bids ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON auctions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON auctions;
DROP POLICY IF EXISTS "Enable deletion for auction host" ON auctions;
DROP POLICY IF EXISTS "Enable update for auction host" ON auctions;
DROP POLICY IF EXISTS "Enable bid updates for participants" ON auctions;
DROP POLICY IF EXISTS "Enable read access for all users" ON auction_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON auction_participants;
DROP POLICY IF EXISTS "Enable deletion of participants for auction host" ON auction_participants;
DROP POLICY IF EXISTS "Enable update own participant" ON auction_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON auction_winners;
DROP POLICY IF EXISTS "Enable insert for auction participants" ON auction_winners;
DROP POLICY IF EXISTS "Enable read access for all users" ON auction_no_bids;
DROP POLICY IF EXISTS "Enable insert for auction participants" ON auction_no_bids;
DROP POLICY IF EXISTS "Enable delete for auction participants" ON auction_no_bids;

-- Policies for auctions table
CREATE POLICY "Enable read access for all users"
ON auctions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON auctions FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- Host can update anything
CREATE POLICY "Enable update for auction host"
ON auctions FOR UPDATE
USING (auth.uid() = host_id);

-- Participants can update bid-related fields
CREATE POLICY "Enable bid updates for participants"
ON auctions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auction_participants ap
    WHERE ap.auction_id = id
    AND ap.user_id = auth.uid()
  )
  AND status = 'active'
  AND auth.uid() != host_id
  -- Only allow updating bid-related fields
  AND (
    CASE WHEN auth.uid() != host_id THEN
      -- For participants, only allow updating bid-related fields
      (
        current_bid IS DISTINCT FROM current_bid OR
        current_bidder_id IS DISTINCT FROM current_bidder_id OR
        no_bid_count IS DISTINCT FROM no_bid_count OR
        last_bid_time IS DISTINCT FROM last_bid_time
      )
    ELSE
      true
    END
  )
)
WITH CHECK (
  -- Only allow updating bid-related fields
  (
    CASE WHEN auth.uid() != host_id THEN
      -- For participants, only allow updating bid-related fields
      (
        current_bid IS NOT NULL AND
        current_bidder_id = auth.uid() AND
        last_bid_time IS NOT NULL
      )
    ELSE
      true
    END
  )
);

CREATE POLICY "Enable deletion for auction host"
ON auctions FOR DELETE
USING (auth.uid() = host_id);

-- Policies for auction_participants table
CREATE POLICY "Enable read access for all users"
ON auction_participants FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON auction_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM auctions a
    WHERE a.id = auction_id
    AND a.status = 'pending'
  )
);

CREATE POLICY "Enable update own participant"
ON auction_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable deletion of participants for auction host"
ON auction_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auctions
    WHERE auctions.id = auction_participants.auction_id
    AND auctions.host_id = auth.uid()
  )
);

-- Policies for auction_winners table
CREATE POLICY "Enable read access for all users"
ON auction_winners FOR SELECT
USING (true);

CREATE POLICY "Enable insert for auction participants"
ON auction_winners FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auctions a
    WHERE a.id = auction_id
    AND (
      a.host_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auction_participants ap
        WHERE ap.auction_id = a.id
        AND ap.user_id = auth.uid()
      )
    )
  )
);

-- Policies for auction_no_bids table
CREATE POLICY "Enable read access for all users"
ON auction_no_bids FOR SELECT
USING (true);

CREATE POLICY "Enable insert for auction participants"
ON auction_no_bids FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auction_participants ap
    WHERE ap.auction_id = auction_id
    AND ap.user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for auction participants"
ON auction_no_bids FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auction_participants ap
    WHERE ap.auction_id = auction_id
    AND ap.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON auctions TO authenticated;
GRANT ALL ON auction_participants TO authenticated;
GRANT ALL ON auction_winners TO authenticated;
GRANT ALL ON auction_no_bids TO authenticated;

-- Enable realtime for tables (if not already enabled)
DO $$
BEGIN
  -- Add auctions table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  -- Add auction_participants table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_participants;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  -- Add auction_winners table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_winners;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  -- Add auction_no_bids table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_no_bids;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;
