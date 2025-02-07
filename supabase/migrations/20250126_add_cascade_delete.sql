-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS auction_participants
DROP CONSTRAINT IF EXISTS auction_participants_auction_id_fkey;

-- Add foreign key constraint with CASCADE DELETE
ALTER TABLE auction_participants
ADD CONSTRAINT auction_participants_auction_id_fkey
FOREIGN KEY (auction_id)
REFERENCES auctions(id)
ON DELETE CASCADE;
