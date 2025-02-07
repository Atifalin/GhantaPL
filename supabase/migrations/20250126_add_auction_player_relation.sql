-- Add current_bidder_id column to auctions table
ALTER TABLE auctions
ADD COLUMN current_bidder_id UUID REFERENCES profiles(id);

-- Drop existing status check constraint if it exists
ALTER TABLE auctions
DROP CONSTRAINT IF EXISTS auctions_status_check;

-- Add new status check constraint
ALTER TABLE auctions
ADD CONSTRAINT auctions_status_check 
CHECK (status IN ('pending', 'active', 'paused', 'completed'));
