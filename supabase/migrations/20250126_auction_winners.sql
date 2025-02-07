-- Drop existing table first
DROP TABLE IF EXISTS auction_winners CASCADE;

-- Drop ALL existing policies
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('auction_participants', 'auction_winners')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Create auction_winners table
CREATE TABLE auction_winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  winning_bid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auction_id, player_id)
);

-- Add auction statistics columns
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS total_players INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_players INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skipped_players INTEGER DEFAULT 0;

-- Add budget tracking to auction_participants
ALTER TABLE auction_participants
ADD COLUMN IF NOT EXISTS initial_budget INTEGER NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS remaining_budget INTEGER NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS players_won INTEGER DEFAULT 0;

-- Add RLS
ALTER TABLE auction_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_participants ENABLE ROW LEVEL SECURITY;

-- Add policies for auction_winners
CREATE POLICY "winners_read_all" ON auction_winners
    FOR SELECT USING (true);

CREATE POLICY "winners_insert_all" ON auction_winners
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM auction_participants ap
        WHERE ap.auction_id = auction_winners.auction_id
        AND ap.user_id = auth.uid()
      )
    );

-- Add policies for auction_participants
CREATE POLICY "participants_read_all" ON auction_participants
    FOR SELECT USING (true);

CREATE POLICY "participants_insert_own" ON auction_participants
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_update_own" ON auction_participants
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND remaining_budget >= 0);

-- Add realtime support
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'auction_winners'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_winners;
  END IF;
END $$;
