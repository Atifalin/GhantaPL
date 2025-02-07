-- Drop existing objects
DROP TABLE IF EXISTS auction_participants CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TYPE IF EXISTS auction_status CASCADE;
DROP FUNCTION IF EXISTS insert_auction_participant CASCADE;

-- Add auction-related tables and types

-- Create auction status enum
CREATE TYPE auction_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status auction_status NOT NULL DEFAULT 'pending',
  start_time TIMESTAMPTZ NOT NULL,
  budget_per_player INTEGER NOT NULL CHECK (budget_per_player > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  auto_start BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  current_player_id UUID REFERENCES players(id),
  current_bid INTEGER DEFAULT 0,
  current_bidder_id UUID REFERENCES profiles(id),
  total_players INTEGER DEFAULT 0,
  completed_players INTEGER DEFAULT 0,
  skipped_players INTEGER DEFAULT 0,
  last_bid_time TIMESTAMPTZ,
  no_bid_count INTEGER DEFAULT 0
);

-- Create auction participants table
CREATE TABLE IF NOT EXISTS auction_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remaining_budget INTEGER NOT NULL CHECK (remaining_budget >= 0),
  initial_budget INTEGER NOT NULL CHECK (initial_budget > 0),
  players_won INTEGER NOT NULL DEFAULT 0 CHECK (players_won >= 0),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auction_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS auctions_host_id_idx ON auctions(host_id);
CREATE INDEX IF NOT EXISTS auctions_status_idx ON auctions(status);
CREATE INDEX IF NOT EXISTS auction_participants_auction_id_idx ON auction_participants(auction_id);
CREATE INDEX IF NOT EXISTS auction_participants_user_id_idx ON auction_participants(user_id);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_auctions_updated_at ON auctions;
DROP TRIGGER IF EXISTS update_auction_participants_updated_at ON auction_participants;

CREATE TRIGGER update_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_participants_updated_at
    BEFORE UPDATE ON auction_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_participants;
