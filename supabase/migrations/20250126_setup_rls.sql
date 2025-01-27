-- Enable RLS on both tables
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON auctions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON auctions;
DROP POLICY IF EXISTS "Enable deletion for auction host" ON auctions;
DROP POLICY IF EXISTS "Enable read access for all users" ON auction_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON auction_participants;
DROP POLICY IF EXISTS "Enable deletion of participants for auction host" ON auction_participants;

-- Policies for auctions table
CREATE POLICY "Enable read access for all users"
ON auctions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON auctions FOR INSERT
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Enable deletion for auction host"
ON auctions FOR DELETE
USING (auth.uid() = host_id);

-- Policies for auction_participants table
CREATE POLICY "Enable read access for all users"
ON auction_participants FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON auction_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable deletion of participants for auction host"
ON auction_participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auctions
    WHERE auctions.id = auction_participants.auction_id
    AND auctions.host_id = auth.uid()
  )
);
